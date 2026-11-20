import { paginate, type ListQuery, type PaginatedResult } from "@/lib/pagination";
import type { liberacao_recurso, Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import type {
  CreateLiberacaoRecursoDTO,
  LiberacaoRecursoResponseDTO,
  UpdateLiberacaoRecursoDTO,
} from "@/types/liberacao-recurso";

const toDate = (value: string) => new Date(`${value}T00:00:00.000Z`);

function response(item: liberacao_recurso): LiberacaoRecursoResponseDTO {
  return {
    id: item.id,
    valorLiberacao: item.valorLiberacao.toString(),
    dataLiberacao: item.dataLiberacao.toISOString().slice(0, 10),
    verbaPublicaId: item.verbaPublicaId,
    etapaCronogramaId: item.etapaCronogramaId,
    status: item.status as "PENDENTE" | "APROVADA" | "REJEITADA",
    criadoPorUsuarioId: item.criadoPorUsuarioId,
    aprovadoPorUsuarioId: item.aprovadoPorUsuarioId,
    dataAprovacao: item.dataAprovacao?.toISOString() ?? null,
  };
}

function createData(
  data: CreateLiberacaoRecursoDTO & { criadoPorUsuarioId: number },
): Prisma.liberacao_recursoUncheckedCreateInput {
  return {
    valorLiberacao: data.valorLiberacao,
    dataLiberacao: toDate(data.dataLiberacao),
    verbaPublicaId: data.verbaPublicaId,
    etapaCronogramaId: data.etapaCronogramaId,
    status: "PENDENTE",
    criadoPorUsuarioId: data.criadoPorUsuarioId,
  };
}

function updateData(
  data: UpdateLiberacaoRecursoDTO,
): Prisma.liberacao_recursoUncheckedUpdateInput {
  return {
    ...(data.valorLiberacao !== undefined && { valorLiberacao: data.valorLiberacao }),
    ...(data.dataLiberacao !== undefined && { dataLiberacao: toDate(data.dataLiberacao) }),
    ...(data.verbaPublicaId !== undefined && { verbaPublicaId: data.verbaPublicaId }),
    ...(data.etapaCronogramaId !== undefined && { etapaCronogramaId: data.etapaCronogramaId }),
  };
}

export class LiberacaoRecursoRepository {
  async create(tx: Prisma.TransactionClient, data: CreateLiberacaoRecursoDTO & { criadoPorUsuarioId: number }) {
    return response(await tx.liberacao_recurso.create({ data: createData(data) }));
  }
  async findAll(query: ListQuery): Promise<PaginatedResult<ReturnType<typeof response>>> {
    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.verbaPublicaId ? { verbaPublicaId: Number(query.verbaPublicaId) } : {}),
      ...(query.etapaCronogramaId ? { etapaCronogramaId: Number(query.etapaCronogramaId) } : {}),
    };
    return paginate({
      query,
      count: () => prisma.liberacao_recurso.count({ where }),
      findMany: ({ skip, take }) => prisma.liberacao_recurso.findMany({ skip, take, where }),
      map: response,
    });
  }
  async findById(id: number, client: Prisma.TransactionClient = prisma) {
    const item = await client.liberacao_recurso.findUnique({ where: { id } });
    return item ? response(item) : null;
  }
  async update(tx: Prisma.TransactionClient, id: number, data: UpdateLiberacaoRecursoDTO) {
    return response(await tx.liberacao_recurso.update({ where: { id }, data: updateData(data) }));
  }
  async delete(id: number) {
    await prisma.liberacao_recurso.delete({ where: { id } });
  }
  async sumByProjetoAndVerba(tx: Prisma.TransactionClient, projetoObraId: number, verbaPublicaId: number, excludeId?: number): Promise<string> {
    const result = await tx.liberacao_recurso.aggregate({
      _sum: { valorLiberacao: true },
      where: {
        verbaPublicaId,
        etapaCronograma: { projetoObraId },
        status: { in: ["PENDENTE", "APROVADA"] },
        ...(excludeId !== undefined && { id: { not: excludeId } }),
      },
    });
    return result._sum.valorLiberacao?.toString() ?? "0.00";
  }
  async sumByEtapaAndVerba(etapaCronogramaId: number, verbaPublicaId: number): Promise<string> {
    const result = await prisma.liberacao_recurso.aggregate({
      _sum: { valorLiberacao: true },
      where: { etapaCronogramaId, verbaPublicaId },
    });
    return result._sum.valorLiberacao?.toString() ?? "0.00";
  }
}
