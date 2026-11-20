import type { ListQuery } from "@/lib/pagination";
import prisma from "@/lib/prisma";
import { FiscalizacaoRepository } from "@/repositories/fiscalizacao.repository";
import { RevisaoFiscalizacaoRepository } from "@/repositories/revisao-fiscalizacao.repository";
import { UserRepository } from "@/repositories/user.repository";
import type {
  CreateRevisaoFiscalizacaoDTO,
  RevisaoFiscalizacaoResponseDTO,
  UpdateRevisaoFiscalizacaoDTO,
} from "@/types/revisao-fiscalizacao";

export const REVISAO_OUTRO_AUTOR = "Somente o autor autenticado pode editar a revisão.";

export class RevisaoFiscalizacaoService {
  private repository = new RevisaoFiscalizacaoRepository();
  private fiscalizacaoRepository = new FiscalizacaoRepository();
  private userRepository = new UserRepository();

  async create(
    data: CreateRevisaoFiscalizacaoDTO,
  ): Promise<RevisaoFiscalizacaoResponseDTO> {
    const fiscalizacao = await this.fiscalizacaoRepository.findById(
      data.fiscalizacaoId,
    );
    if (!fiscalizacao) throw new Error("Fiscalização não encontrada.");
    if (fiscalizacao.usuarioId === data.fiscalExternoId) {
      throw new Error("O fiscal não pode revisar a própria fiscalização.");
    }
    const fiscal = await this.userRepository.findById(data.fiscalExternoId);
    if (!fiscal) throw new Error("Fiscal externo não encontrado.");
    if (fiscal.role !== "FISCAL") {
      throw new Error("Usuário informado não possui o papel FISCAL.");
    }
    const designacao = await prisma.obra_fiscal.findFirst({
      where: {
        usuarioId: data.fiscalExternoId,
        projetoObraId: fiscalizacao.projetoObraId,
        tipoFiscal: "EXTERNO",
      },
    });
    if (!designacao) {
      throw new Error("O fiscal externo não está designado para esta obra.");
    }
    const result = await prisma.$transaction(async (tx) => {
      const revision = await tx.revisao_fiscalizacao.create({
        data,
      });
      const statusVistoria =
        data.statusRevisao === "APROVADA"
          ? "APROVADA"
          : data.statusRevisao === "CONTESTADA"
            ? "CONTESTADA"
            : data.statusRevisao === "CORRECAO_SOLICITADA"
              ? "CORRECAO_SOLICITADA"
              : "PENDENTE_REVISAO";
      await tx.fiscalizacao.update({
        where: { id: data.fiscalizacaoId },
        data: { statusVistoria },
      });
      return revision;
    });
    return this.repository.findById(result.id).then((item) => {
      if (!item) throw new Error("Revisão de fiscalização não encontrada.");
      return item;
    });
  }

  async findAll(query: ListQuery) {
    return this.repository.findAll(query);
  }

  async findById(id: number): Promise<RevisaoFiscalizacaoResponseDTO> {
    const item = await this.repository.findById(id);
    if (!item) throw new Error("Revisão de fiscalização não encontrada.");
    return item;
  }

  async update(
    id: number,
    data: UpdateRevisaoFiscalizacaoDTO,
    usuarioId: number,
  ): Promise<RevisaoFiscalizacaoResponseDTO> {
    const current = await this.findById(id);
    if (current.fiscalExternoId !== usuarioId) throw new Error(REVISAO_OUTRO_AUTOR);
    return this.repository.update(id, data);
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    return this.repository.delete(id);
  }

  findByFiscalizacao(
    fiscalizacaoId: number,
    query: ListQuery,
  ) {
    return this.repository.findByFiscalizacao(fiscalizacaoId, query);
  }
}
