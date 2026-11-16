import type { log_auditoria, Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import type {
  CreateLogAuditoriaDTO,
  LogAuditoriaResponseDTO,
  UpdateLogAuditoriaDTO,
} from "@/types/log-auditoria";

function toResponseDTO(item: log_auditoria): LogAuditoriaResponseDTO {
  return {
    id: item.id,
    acao: item.acao,
    tabelaAfetada: item.tabelaAfetada,
    registroId: item.registroId,
    detalhes: item.detalhes,
    ipOrigem: item.ipOrigem,
    dataHora: item.dataHora.toISOString(),
    usuarioId: item.usuarioId,
  };
}

function toCreateData(
  data: CreateLogAuditoriaDTO,
): Prisma.log_auditoriaUncheckedCreateInput {
  return data;
}

function toUpdateData(
  data: UpdateLogAuditoriaDTO,
): Prisma.log_auditoriaUncheckedUpdateInput {
  return data;
}

export class LogAuditoriaRepository {
  async create(data: CreateLogAuditoriaDTO): Promise<LogAuditoriaResponseDTO> {
    return toResponseDTO(
      await prisma.log_auditoria.create({ data: toCreateData(data) }),
    );
  }

  async findAll(): Promise<LogAuditoriaResponseDTO[]> {
    return (await prisma.log_auditoria.findMany()).map(toResponseDTO);
  }

  async findById(id: number): Promise<LogAuditoriaResponseDTO | null> {
    const item = await prisma.log_auditoria.findUnique({ where: { id } });
    return item ? toResponseDTO(item) : null;
  }

  async update(
    id: number,
    data: UpdateLogAuditoriaDTO,
  ): Promise<LogAuditoriaResponseDTO> {
    return toResponseDTO(
      await prisma.log_auditoria.update({
        where: { id },
        data: toUpdateData(data),
      }),
    );
  }

  async delete(id: number): Promise<void> {
    await prisma.log_auditoria.delete({ where: { id } });
  }
}
