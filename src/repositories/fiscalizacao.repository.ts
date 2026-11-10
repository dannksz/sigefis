import type { fiscalizacao, Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import type {
  CreateFiscalizacaoDTO,
  FiscalizacaoResponseDTO,
  UpdateFiscalizacaoDTO,
} from "@/types/fiscalizacao";

const toDate = (value: string) => new Date(`${value}T00:00:00.000Z`);

function toResponseDTO(item: fiscalizacao): FiscalizacaoResponseDTO {
  return {
    id: item.id,
    dataVistoria: item.dataVistoria.toISOString().slice(0, 10),
    percentualExecutado: item.percentualExecutado.toString(),
    parecerTecnico: item.parecerTecnico,
    statusVistoria: item.statusVistoria,
    projetoObraId: item.projetoObraId,
    usuarioId: item.usuarioId,
    etapaCronogramaId: item.etapaCronogramaId,
  };
}

function toCreateData(
  data: CreateFiscalizacaoDTO,
): Prisma.fiscalizacaoUncheckedCreateInput {
  return {
    dataVistoria: toDate(data.dataVistoria),
    percentualExecutado: data.percentualExecutado,
    parecerTecnico: data.parecerTecnico,
    statusVistoria: data.statusVistoria,
    projetoObraId: data.projetoObraId,
    usuarioId: data.usuarioId,
    etapaCronogramaId: data.etapaCronogramaId,
  };
}

function toUpdateData(
  data: UpdateFiscalizacaoDTO,
): Prisma.fiscalizacaoUncheckedUpdateInput {
  return {
    ...(data.dataVistoria !== undefined && { dataVistoria: toDate(data.dataVistoria) }),
    ...(data.percentualExecutado !== undefined && {
      percentualExecutado: data.percentualExecutado,
    }),
    ...(data.parecerTecnico !== undefined && { parecerTecnico: data.parecerTecnico }),
    ...(data.statusVistoria !== undefined && { statusVistoria: data.statusVistoria }),
    ...(data.projetoObraId !== undefined && { projetoObraId: data.projetoObraId }),
    ...(data.usuarioId !== undefined && { usuarioId: data.usuarioId }),
    ...(data.etapaCronogramaId !== undefined && {
      etapaCronogramaId: data.etapaCronogramaId,
    }),
  };
}

export class FiscalizacaoRepository {
  async create(data: CreateFiscalizacaoDTO): Promise<FiscalizacaoResponseDTO> {
    return toResponseDTO(
      await prisma.fiscalizacao.create({ data: toCreateData(data) }),
    );
  }

  async findAll(): Promise<FiscalizacaoResponseDTO[]> {
    return (await prisma.fiscalizacao.findMany()).map(toResponseDTO);
  }

  async findById(id: number): Promise<FiscalizacaoResponseDTO | null> {
    const item = await prisma.fiscalizacao.findUnique({ where: { id } });
    return item ? toResponseDTO(item) : null;
  }

  async update(
    id: number,
    data: UpdateFiscalizacaoDTO,
  ): Promise<FiscalizacaoResponseDTO> {
    return toResponseDTO(
      await prisma.fiscalizacao.update({
        where: { id },
        data: toUpdateData(data),
      }),
    );
  }

  async delete(id: number): Promise<void> {
    await prisma.fiscalizacao.delete({ where: { id } });
  }
}
