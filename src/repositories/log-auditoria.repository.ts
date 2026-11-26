import { paginate, type ListQuery, type PaginatedResult } from "@/lib/pagination";
import type { log_auditoria, Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { findAuditWorkNames, hasAuditWorkLink } from "@/lib/audit-work";
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

const usuarioInclude = { usuario: { select: { nome: true } } } as const;

function toResponseDTO(item: log_auditoria & { usuario?: { nome: string } | null }): LogAuditoriaResponseDTO {
  return {
    id: item.id,
    acao: item.acao,
    tabelaAfetada: item.tabelaAfetada,
    registroId: item.registroId,
    detalhes: item.detalhes,
    ipOrigem: item.ipOrigem,
    dataHora: item.dataHora.toISOString(),
    usuarioId: item.usuarioId,
    usuarioNome: item.usuario?.nome ?? null,
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

async function includeWorkNames(items: LogAuditoriaResponseDTO[]): Promise<void> {
  const workLogs = items.filter((item) => {
    if (!hasAuditWorkLink(item.tabelaAfetada)) return false;
    item.obraNome = null;

    try {
      const details = JSON.parse(item.detalhes) as { obraNome?: unknown } | null;
      if (typeof details?.obraNome === "string" && details.obraNome.trim()) {
        item.obraNome = details.obraNome;
        return false;
      }
    } catch {
      // Registros antigos podem conter detalhes em texto livre.
    }
    return item.registroId > 0;
  });
  const tables = new Set(workLogs.map((item) => item.tabelaAfetada));
  await Promise.all([...tables].map(async (table) => {
    const logs = workLogs.filter((item) => item.tabelaAfetada === table);
    const names = await findAuditWorkNames(table, logs.map((item) => item.registroId));
    for (const log of logs) log.obraNome = names.get(log.registroId) ?? null;
  }));
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
    const direction = query.ordem === "antiga" ? "asc" : "desc";
    const result = await paginate({
      query,
      count: () => prisma.log_auditoria.count({ where }),
      findMany: ({ skip, take }) =>
        prisma.log_auditoria.findMany({
          where, skip, take, include: usuarioInclude,
          orderBy: [{ dataHora: direction }, { id: direction }],
        }),
      map: toResponseDTO,
    });
    await includeWorkNames(result.data);
    return result;
  }

  async findById(id: number): Promise<LogAuditoriaResponseDTO | null> {
    const item = await prisma.log_auditoria.findUnique({ where: { id }, include: usuarioInclude });
    if (!item) return null;
    const result = toResponseDTO(item);
    await includeWorkNames([result]);
    return result;
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
