import type { revisao_fiscalizacao, Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import type {
  CreateRevisaoFiscalizacaoDTO,
  RevisaoFiscalizacaoResponseDTO,
  UpdateRevisaoFiscalizacaoDTO,
} from "@/types/revisao-fiscalizacao";

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
  ): Promise<RevisaoFiscalizacaoResponseDTO> {
    return toResponseDTO(
      await prisma.revisao_fiscalizacao.create({
        data: data as Prisma.revisao_fiscalizacaoUncheckedCreateInput,
      }),
    );
  }
  async findAll(): Promise<RevisaoFiscalizacaoResponseDTO[]> {
    return (await prisma.revisao_fiscalizacao.findMany()).map(toResponseDTO);
  }
  async findById(id: number): Promise<RevisaoFiscalizacaoResponseDTO | null> {
    const item = await prisma.revisao_fiscalizacao.findUnique({ where: { id } });
    return item ? toResponseDTO(item) : null;
  }
  async findByFiscalizacao(
    fiscalizacaoId: number,
  ): Promise<RevisaoFiscalizacaoResponseDTO[]> {
    return (
      await prisma.revisao_fiscalizacao.findMany({
        where: { fiscalizacaoId },
        orderBy: { dataRevisao: "desc" },
      })
    ).map(toResponseDTO);
  }
  async update(
    id: number,
    data: UpdateRevisaoFiscalizacaoDTO,
  ): Promise<RevisaoFiscalizacaoResponseDTO> {
    return toResponseDTO(
      await prisma.revisao_fiscalizacao.update({
        where: { id },
        data: data as Prisma.revisao_fiscalizacaoUncheckedUpdateInput,
      }),
    );
  }
  async delete(id: number): Promise<void> {
    await prisma.revisao_fiscalizacao.delete({ where: { id } });
  }
}
