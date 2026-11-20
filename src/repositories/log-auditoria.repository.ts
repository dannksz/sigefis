import { paginate, type ListQuery, type PaginatedResult } from "@/lib/pagination";
import type { log_auditoria, Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import type {
  CreateLogAuditoriaDTO,
  LogAuditoriaCategoria,
  LogAuditoriaResponseDTO,
  UpdateLogAuditoriaDTO,
} from "@/types/log-auditoria";

const filtrosPorCategoria: Record<LogAuditoriaCategoria, Prisma.log_auditoriaWhereInput> = {
  login: { acao: { in: ["LOGIN", "LOGIN_FALHOU"] } },
  obras: { tabelaAfetada: { in: ["projeto_obra", "etapa_cronograma", "projeto_verba"] } },
  financeiro: {
    tabelaAfetada: {
      in: [
        "verba_publica",
        "emenda_parlamentar",
        "contrato",
        "conta_bancaria",
        "liberacao_recurso",
        "pagamento",
        "decisao_financeira",
        "bloqueio_repasse",
      ],
    },
  },
  fiscalizacao: {
    tabelaAfetada: {
      in: [
        "obra_fiscal",
        "fiscalizacao",
        "revisao_fiscalizacao",
        "evidencia_fiscalizacao",
        "alerta_fiscalizacao",
        "processo_regularizacao",
      ],
    },
  },
};

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

  async findAll(
    query: ListQuery,
    categoria?: LogAuditoriaCategoria,
  ): Promise<PaginatedResult<LogAuditoriaResponseDTO>> {
    const where = categoria ? filtrosPorCategoria[categoria] : {};
    return paginate({
      query,
      count: () => prisma.log_auditoria.count({ where }),
      findMany: ({ skip, take }) =>
        prisma.log_auditoria.findMany({ where, skip, take, orderBy: { id: "asc" } }),
      map: toResponseDTO,
    });
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
