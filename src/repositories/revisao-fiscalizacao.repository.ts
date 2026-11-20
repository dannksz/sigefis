import { paginate, type ListQuery, type PaginatedResult } from "@/lib/pagination";
import type { revisao_fiscalizacao, Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import type {
  CreateRevisaoFiscalizacaoDTO,
  RevisaoFiscalizacaoResponseDTO,
  UpdateRevisaoFiscalizacaoDTO,
} from "@/types/revisao-fiscalizacao";

const ordemVigencia: Prisma.revisao_fiscalizacaoOrderByWithRelationInput[] = [
  { dataRevisao: "desc" },
  { id: "desc" },
];

function toResponseDTO(
  item: revisao_fiscalizacao,
): RevisaoFiscalizacaoResponseDTO {
  return {
    id: item.id,
    fiscalizacaoId: item.fiscalizacaoId,
    fiscalExternoId: item.fiscalExternoId,
    statusRevisao: item.statusRevisao as RevisaoFiscalizacaoResponseDTO["statusRevisao"],
    parecer: item.parecer,
    dataRevisao: item.dataRevisao.toISOString(),
  };
}

export class RevisaoFiscalizacaoRepository {
  async create(
    data: CreateRevisaoFiscalizacaoDTO,
    tx: Prisma.TransactionClient,
  ): Promise<RevisaoFiscalizacaoResponseDTO> {
    return toResponseDTO(
      await tx.revisao_fiscalizacao.create({
        data: data as Prisma.revisao_fiscalizacaoUncheckedCreateInput,
      }),
    );
  }
  async findAll(query: ListQuery): Promise<PaginatedResult<RevisaoFiscalizacaoResponseDTO>> {
    const where = {
      ...(query.status ? { statusRevisao: query.status } : {}),
      ...(query.fiscalizacaoId ? { fiscalizacaoId: Number(query.fiscalizacaoId) } : {}),
      ...(query.fiscalExternoId ? { fiscalExternoId: Number(query.fiscalExternoId) } : {}),
    };
    return paginate({
      query,
      count: () => prisma.revisao_fiscalizacao.count({ where }),
      findMany: ({ skip, take }) => prisma.revisao_fiscalizacao.findMany({ skip, take, where }),
      map: toResponseDTO,
    });
  }
  async findById(id: number): Promise<RevisaoFiscalizacaoResponseDTO | null> {
    const item = await prisma.revisao_fiscalizacao.findUnique({ where: { id } });
    return item ? toResponseDTO(item) : null;
  }
  async findByFiscalizacao(
    fiscalizacaoId: number,
    query: ListQuery,
  ): Promise<PaginatedResult<RevisaoFiscalizacaoResponseDTO>> {
    return paginate({
      query,
      count: () => prisma.revisao_fiscalizacao.count({ where: { fiscalizacaoId } }),
      findMany: ({ skip, take }) => prisma.revisao_fiscalizacao.findMany({
        where: { fiscalizacaoId },
        orderBy: ordemVigencia,
        skip,
        take,
      }),
      map: toResponseDTO,
    });
  }
  async update(
    id: number,
    data: UpdateRevisaoFiscalizacaoDTO,
    tx: Prisma.TransactionClient,
  ): Promise<RevisaoFiscalizacaoResponseDTO> {
    return toResponseDTO(
      await tx.revisao_fiscalizacao.update({
        where: { id },
        data: data as Prisma.revisao_fiscalizacaoUncheckedUpdateInput,
      }),
    );
  }
  async delete(id: number, tx: Prisma.TransactionClient): Promise<void> {
    await tx.revisao_fiscalizacao.delete({ where: { id } });
  }

  async sincronizarVistoria(fiscalizacaoId: number, tx: Prisma.TransactionClient): Promise<void> {
    const vigente = await tx.revisao_fiscalizacao.findFirst({
      where: { fiscalizacaoId },
      orderBy: ordemVigencia,
      select: { statusRevisao: true },
    });
    const status = vigente?.statusRevisao ?? "PENDENTE";
    await tx.fiscalizacao.update({
      where: { id: fiscalizacaoId },
      data: { statusVistoria: status === "PENDENTE" ? "PENDENTE_REVISAO" : status },
    });
  }

  async etapaTemRevisaoAprovada(
    etapaCronogramaId: number,
    projetoObraId: number,
    tx: Prisma.TransactionClient,
  ): Promise<boolean> {
    const vistorias = await tx.fiscalizacao.findMany({
      where: { etapaCronogramaId, projetoObraId, revisoes: { some: { statusRevisao: "APROVADA" } } },
      select: { revisoes: { orderBy: ordemVigencia, take: 1, select: { statusRevisao: true } } },
    });
    return vistorias.some(({ revisoes }) => revisoes[0]?.statusRevisao === "APROVADA");
  }
}
