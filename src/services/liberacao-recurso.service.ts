import type { ListQuery } from "@/lib/pagination";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { RevisaoFiscalizacaoRepository } from "@/repositories/revisao-fiscalizacao.repository";
import { LiberacaoRecursoRepository } from "@/repositories/liberacao-recurso.repository";
import type {
  CreateLiberacaoRecursoDTO,
  LiberacaoRecursoResponseDTO,
  UpdateLiberacaoRecursoDTO,
} from "@/types/liberacao-recurso";

export const LIBERACAO_BLOQUEADA = "A obra possui bloqueio de repasse vigente.";

function cents(value: string): bigint {
  const [integer, decimal = ""] = value.split(".");
  return BigInt(integer) * BigInt("100") + BigInt(decimal.padEnd(2, "0"));
}

function money(value: bigint): string {
  const hundred = BigInt("100");
  return `${value / hundred}.${(value % hundred).toString().padStart(2, "0")}`;
}

export class LiberacaoRecursoService {
  private revisoes = new RevisaoFiscalizacaoRepository();
  private repository = new LiberacaoRecursoRepository();

  private async ensureLimit(
    tx: Prisma.TransactionClient,
    verbaPublicaId: number,
    etapaCronogramaId: number,
    valorLiberacao: string,
    excludeId?: number,
  ): Promise<void> {
    const verba = await tx.$queryRaw<{ id: number }[]>`SELECT id FROM verba_publica WHERE id = ${verbaPublicaId} FOR UPDATE`;
    const etapa = await tx.etapa_cronograma.findUnique({
      where: { id: etapaCronogramaId },
      select: { projetoObraId: true },
    });
    if (!etapa) throw new Error("Etapa do cronograma não encontrada.");
    if (!verba.length) {
      throw new Error("Verba pública não encontrada.");
    }
    const alocacao = await tx.projeto_verba.aggregate({
      where: { projetoObraId: etapa.projetoObraId, verbaPublicaId },
      _sum: { valorAlocado: true },
    });
    if (!alocacao._sum.valorAlocado) throw new Error("A verba não está vinculada ao projeto da etapa.");
    const alocado = cents(alocacao._sum.valorAlocado.toString());
    const liberado = cents(await this.repository.sumByProjetoAndVerba(
      tx, etapa.projetoObraId, verbaPublicaId, excludeId,
    ));
    if (liberado + cents(valorLiberacao) > alocado) {
      throw new Error(`O total de liberações excede o valor alocado (${money(alocado)}).`);
    }
  }

  async create(
    data: CreateLiberacaoRecursoDTO,
    criadoPorUsuarioId: number,
  ): Promise<LiberacaoRecursoResponseDTO> {
    return prisma.$transaction(async (tx) => {
      await this.ensureLimit(tx, data.verbaPublicaId, data.etapaCronogramaId, data.valorLiberacao);
      return this.repository.create(tx, { ...data, criadoPorUsuarioId });
    }, { isolationLevel: "ReadCommitted" });
  }
  async approve(id: number, aprovadoPorUsuarioId: number): Promise<LiberacaoRecursoResponseDTO> {
    const current = await this.findById(id);
    if (current.status !== "PENDENTE") throw new Error("A liberação não está pendente.");
    if (current.criadoPorUsuarioId === aprovadoPorUsuarioId) {
      throw new Error("Quem criou a liberação não pode aprová-la.");
    }
    const etapa = await prisma.etapa_cronograma.findUnique({
      where: { id: current.etapaCronogramaId },
      select: { projetoObraId: true },
    });
    if (!etapa) throw new Error("Etapa do cronograma não encontrada.");
    await prisma.$transaction(async (tx) => {
      const approvedInspection = await this.revisoes.etapaTemRevisaoAprovada(
        current.etapaCronogramaId, etapa.projetoObraId, tx,
      );
      if (!approvedInspection) {
        throw new Error("A liberação exige fiscalização revisada externamente.");
      }
      const updated = await tx.liberacao_recurso.updateMany({
        where: { id, status: "PENDENTE" },
        data: {
          status: "APROVADA",
          aprovadoPorUsuarioId,
          dataAprovacao: new Date(),
        },
      });
      if (updated.count === 0) throw new Error("A liberação não está pendente.");
      const bloqueio = await tx.bloqueio_repasse.findFirst({
        where: {
          projetoObraId: etapa.projetoObraId,
          OR: [{ dataDesbloqueio: null }, { dataDesbloqueio: { gt: new Date() } }],
        },
        select: { id: true },
      });
      if (bloqueio) throw new Error(LIBERACAO_BLOQUEADA);
      await tx.decisao_financeira.create({
        data: {
          tipoOperacao: "LIBERACAO",
          operacaoId: id,
          status: "APROVADA",
          justificativa: "Liberação aprovada.",
          usuarioId: aprovadoPorUsuarioId,
        },
      });
    });
    const response = await this.repository.findById(id);
    if (!response) throw new Error("Liberação de recurso não encontrada.");
    return response;
  }
  async findAll(query: ListQuery) {
    return this.repository.findAll(query);
  }
  async findById(id: number): Promise<LiberacaoRecursoResponseDTO> {
    const item = await this.repository.findById(id);
    if (!item) throw new Error("Liberação de recurso não encontrada.");
    return item;
  }
  async update(id: number, data: UpdateLiberacaoRecursoDTO): Promise<LiberacaoRecursoResponseDTO> {
    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM liberacao_recurso WHERE id = ${id} FOR UPDATE`;
      const current = await this.repository.findById(id, tx);
      if (!current) throw new Error("Liberação de recurso não encontrada.");
      if (current.status !== "PENDENTE") {
        throw new Error("Operação já decidida não pode ser alterada.");
      }
      await this.ensureLimit(
        tx,
        data.verbaPublicaId ?? current.verbaPublicaId,
        data.etapaCronogramaId ?? current.etapaCronogramaId,
        data.valorLiberacao ?? current.valorLiberacao,
        id,
      );
      return this.repository.update(tx, id, data);
    }, { isolationLevel: "ReadCommitted" });
  }
  async delete(id: number) {
    const current = await this.findById(id);
    if (current.status !== "PENDENTE") {
      throw new Error("Operação já decidida não pode ser excluída.");
    }
    return this.repository.delete(id);
  }
  async reject(
    id: number,
    usuarioId: number,
    justificativa: string,
  ): Promise<LiberacaoRecursoResponseDTO> {
    const current = await this.findById(id);
    if (current.status !== "PENDENTE") throw new Error("A liberação não está pendente.");
    if (current.criadoPorUsuarioId === usuarioId) {
      throw new Error("Quem criou a liberação não pode rejeitá-la.");
    }
    await prisma.$transaction(async (tx) => {
      const updated = await tx.liberacao_recurso.updateMany({
        where: { id, status: "PENDENTE" },
        data: {
          status: "REJEITADA",
          aprovadoPorUsuarioId: usuarioId,
          dataAprovacao: new Date(),
        },
      });
      if (updated.count === 0) throw new Error("A liberação não está pendente.");
      await tx.decisao_financeira.create({
        data: {
          tipoOperacao: "LIBERACAO",
          operacaoId: id,
          status: "REJEITADA",
          justificativa,
          usuarioId,
        },
      });
    });
    const response = await this.repository.findById(id);
    if (!response) throw new Error("Liberação de recurso não encontrada.");
    return response;
  }
}
