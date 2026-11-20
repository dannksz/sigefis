import type { ListQuery } from "@/lib/pagination";
import type { Prisma } from "@prisma/client";
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

  private async salvarRevisao<T>(
    fiscalizacaoId: number,
    alterar: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM fiscalizacao WHERE id = ${fiscalizacaoId} FOR UPDATE`;
      const result = await alterar(tx);
      await this.repository.sincronizarVistoria(fiscalizacaoId, tx);
      return result;
    });
  }

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
    return this.salvarRevisao(data.fiscalizacaoId, (tx) => this.repository.create(data, tx));
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
    return this.salvarRevisao(current.fiscalizacaoId, (tx) => this.repository.update(id, data, tx));
  }

  async delete(id: number): Promise<void> {
    const current = await this.findById(id);
    return this.salvarRevisao(current.fiscalizacaoId, (tx) => this.repository.delete(id, tx));
  }

  findByFiscalizacao(
    fiscalizacaoId: number,
    query: ListQuery,
  ) {
    return this.repository.findByFiscalizacao(fiscalizacaoId, query);
  }
}
