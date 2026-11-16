import type { processo_regularizacao, Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import type {
  CreateProcessoRegularizacaoDTO,
  ProcessoRegularizacaoResponseDTO,
  UpdateProcessoRegularizacaoDTO,
} from "@/types/processo-regularizacao";

function toResponseDTO(
  item: processo_regularizacao,
): ProcessoRegularizacaoResponseDTO {
  return {
    id: item.id,
    descricaoJustificativa: item.descricaoJustificativa,
    dataEnvio: item.dataEnvio.toISOString(),
    statusProcesso: item.statusProcesso,
    bloqueioRepasseId: item.bloqueioRepasseId,
    usuarioId: item.usuarioId,
  };
}

function toCreateData(
  data: CreateProcessoRegularizacaoDTO,
): Prisma.processo_regularizacaoUncheckedCreateInput {
  return data;
}

function toUpdateData(
  data: UpdateProcessoRegularizacaoDTO,
): Prisma.processo_regularizacaoUncheckedUpdateInput {
  return data;
}

export class ProcessoRegularizacaoRepository {
  async create(
    data: CreateProcessoRegularizacaoDTO,
  ): Promise<ProcessoRegularizacaoResponseDTO> {
    return toResponseDTO(
      await prisma.processo_regularizacao.create({ data: toCreateData(data) }),
    );
  }

  async findAll(): Promise<ProcessoRegularizacaoResponseDTO[]> {
    return (await prisma.processo_regularizacao.findMany()).map(toResponseDTO);
  }

  async findById(
    id: number,
  ): Promise<ProcessoRegularizacaoResponseDTO | null> {
    const item = await prisma.processo_regularizacao.findUnique({
      where: { id },
    });
    return item ? toResponseDTO(item) : null;
  }

  async update(
    id: number,
    data: UpdateProcessoRegularizacaoDTO,
  ): Promise<ProcessoRegularizacaoResponseDTO> {
    return toResponseDTO(
      await prisma.processo_regularizacao.update({
        where: { id },
        data: toUpdateData(data),
      }),
    );
  }

  async delete(id: number): Promise<void> {
    await prisma.processo_regularizacao.delete({ where: { id } });
  }
}
