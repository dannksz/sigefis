import { paginate, type ListQuery, type PaginatedResult } from "@/lib/pagination";
import type { alerta_fiscalizacao, Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import type {
  AlertaFiscalizacaoResponseDTO,
  CreateAlertaFiscalizacaoDTO,
  UpdateAlertaFiscalizacaoDTO,
} from "@/types/alerta-fiscalizacao";

function toResponseDTO(
  item: alerta_fiscalizacao,
): AlertaFiscalizacaoResponseDTO {
  return {
    id: item.id,
    tipoAlerta: item.tipoAlerta,
    descricao: item.descricao,
    severidade: item.severidade,
    dataGeracao: item.dataGeracao.toISOString(),
    statusAlerta: item.statusAlerta,
    projetoObraId: item.projetoObraId,
    fiscalizacaoId: item.fiscalizacaoId,
  };
}

function toCreateData(
  data: CreateAlertaFiscalizacaoDTO,
): Prisma.alerta_fiscalizacaoUncheckedCreateInput {
  return data;
}

function toUpdateData(
  data: UpdateAlertaFiscalizacaoDTO,
): Prisma.alerta_fiscalizacaoUncheckedUpdateInput {
  return data;
}

export class AlertaFiscalizacaoRepository {
  async create(
    data: CreateAlertaFiscalizacaoDTO,
  ): Promise<AlertaFiscalizacaoResponseDTO> {
    return toResponseDTO(
      await prisma.alerta_fiscalizacao.create({ data: toCreateData(data) }),
    );
  }

  async findAll(query: ListQuery): Promise<PaginatedResult<AlertaFiscalizacaoResponseDTO>> {
    const where = {
      ...(query.status ? { statusAlerta: query.status } : {}),
      ...(query.severidade ? { severidade: String(query.severidade) } : {}),
      ...(query.projetoObraId ? { projetoObraId: Number(query.projetoObraId) } : {}),
    };
    return paginate({
      query,
      count: () => prisma.alerta_fiscalizacao.count({ where }),
      findMany: ({ skip, take }) => prisma.alerta_fiscalizacao.findMany({ skip, take, where }),
      map: toResponseDTO,
    });
  }

  async findById(id: number): Promise<AlertaFiscalizacaoResponseDTO | null> {
    const item = await prisma.alerta_fiscalizacao.findUnique({ where: { id } });
    return item ? toResponseDTO(item) : null;
  }

  async update(
    id: number,
    data: UpdateAlertaFiscalizacaoDTO,
  ): Promise<AlertaFiscalizacaoResponseDTO> {
    return toResponseDTO(
      await prisma.alerta_fiscalizacao.update({
        where: { id },
        data: toUpdateData(data),
      }),
    );
  }

  async delete(id: number): Promise<void> {
    await prisma.alerta_fiscalizacao.delete({ where: { id } });
  }
}
