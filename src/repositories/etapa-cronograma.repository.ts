import { paginate, type ListQuery, type PaginatedResult } from "@/lib/pagination";
import type { etapa_cronograma, Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { stageDateError } from "@/lib/etapa-cronograma-validation";
import { StageRuleError } from "@/lib/stage-rule-error";
import type {
  CreateEtapaCronogramaDTO,
  EtapaCronogramaResponseDTO,
  UpdateEtapaCronogramaDTO,
} from "@/types/etapa-cronograma";

const date = (value: string) => new Date(`${value}T00:00:00.000Z`);

function response(item: etapa_cronograma): EtapaCronogramaResponseDTO {
  const format = (value: Date | null) => value?.toISOString().slice(0, 10) ?? null;
  return {
    id: item.id,
    projetoObraId: item.projetoObraId,
    nomeEtapa: item.nomeEtapa,
    ordemEtapa: item.ordemEtapa,
    percentualPrevisto: item.percentualPrevisto.toString(),
    percentualExecutado: item.percentualExecutado.toString(),
    dataInicioPrevista: format(item.dataInicioPrevista)!,
    dataFimPrevista: format(item.dataFimPrevista)!,
    dataInicioReal: format(item.dataInicioReal),
    dataFimReal: format(item.dataFimReal),
    status: item.status,
  };
}

function toCreateData(
  data: CreateEtapaCronogramaDTO,
): Prisma.etapa_cronogramaUncheckedCreateInput {
  return {
    projetoObraId: data.projetoObraId,
    nomeEtapa: data.nomeEtapa,
    ordemEtapa: data.ordemEtapa,
    percentualPrevisto: data.percentualPrevisto,
    percentualExecutado: data.percentualExecutado,
    dataInicioPrevista: date(data.dataInicioPrevista),
    dataFimPrevista: date(data.dataFimPrevista),
    ...(data.dataInicioReal !== undefined && {
      dataInicioReal: data.dataInicioReal ? date(data.dataInicioReal) : null,
    }),
    ...(data.dataFimReal !== undefined && {
      dataFimReal: data.dataFimReal ? date(data.dataFimReal) : null,
    }),
    status: data.status,
  };
}

function toUpdateData(
  data: UpdateEtapaCronogramaDTO,
): Prisma.etapa_cronogramaUncheckedUpdateInput {
  return {
    ...(data.projetoObraId !== undefined && { projetoObraId: data.projetoObraId }),
    ...(data.nomeEtapa !== undefined && { nomeEtapa: data.nomeEtapa }),
    ...(data.ordemEtapa !== undefined && { ordemEtapa: data.ordemEtapa }),
    ...(data.percentualPrevisto !== undefined && {
      percentualPrevisto: data.percentualPrevisto,
    }),
    ...(data.percentualExecutado !== undefined && {
      percentualExecutado: data.percentualExecutado,
    }),
    ...(data.dataInicioPrevista !== undefined && {
      dataInicioPrevista: date(data.dataInicioPrevista),
    }),
    ...(data.dataFimPrevista !== undefined && {
      dataFimPrevista: date(data.dataFimPrevista),
    }),
    ...(data.dataInicioReal !== undefined && {
      dataInicioReal: data.dataInicioReal ? date(data.dataInicioReal) : null,
    }),
    ...(data.dataFimReal !== undefined && {
      dataFimReal: data.dataFimReal ? date(data.dataFimReal) : null,
    }),
    ...(data.status !== undefined && { status: data.status }),
  };
}

async function validateWeight(tx: Prisma.TransactionClient, workId: number, weight: string, excludeId?: number) {
  const { _sum } = await tx.etapa_cronograma.aggregate({
    where: { projetoObraId: workId, ...(excludeId !== undefined && { id: { not: excludeId } }) },
    _sum: { percentualPrevisto: true },
  });
  const total = Math.round(Number(_sum.percentualPrevisto ?? 0) * 100) + Math.round(Number(weight) * 100);
  if (total > 10000) throw new StageRuleError("A soma dos pesos das etapas da obra não pode ultrapassar 100%.", 409);
}

export class EtapaCronogramaRepository {
  async create(data: CreateEtapaCronogramaDTO) {
    return prisma.$transaction(async (tx) => {
      await validateWeight(tx, data.projetoObraId, data.percentualPrevisto);
      return response(await tx.etapa_cronograma.create({ data: toCreateData(data) }));
    }, { isolationLevel: "Serializable" });
  }
  async findAll(query: ListQuery): Promise<PaginatedResult<ReturnType<typeof response>>> {
    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.projetoObraId ? { projetoObraId: Number(query.projetoObraId) } : {}),
    };
    return paginate({
      query,
      count: () => prisma.etapa_cronograma.count({ where }),
      findMany: ({ skip, take }) => prisma.etapa_cronograma.findMany({ skip, take, where }),
      map: response,
    });
  }
  async findById(id: number) {
    const item = await prisma.etapa_cronograma.findUnique({ where: { id } });
    return item ? response(item) : null;
  }
  async update(id: number, values: UpdateEtapaCronogramaDTO) {
    return prisma.$transaction(async (tx) => {
      const item = await tx.etapa_cronograma.findUnique({ where: { id } });
      if (!item) throw new Error("Etapa do cronograma não encontrada.");
      const current = response(item);
      const next = { ...current, ...values };
      const dateError = stageDateError(next);
      if (dateError) throw new StageRuleError(dateError, 400);
      if (next.projetoObraId !== current.projetoObraId || Number(next.percentualPrevisto) > Number(current.percentualPrevisto)) {
        await validateWeight(tx, next.projetoObraId, next.percentualPrevisto, id);
      }
      return response(await tx.etapa_cronograma.update({ where: { id }, data: toUpdateData(values) }));
    }, { isolationLevel: "Serializable" });
  }
  async delete(id: number) {
    await prisma.etapa_cronograma.delete({ where: { id } });
  }
}
