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
  };
}

function createData(
  data: CreateLiberacaoRecursoDTO,
): Prisma.liberacao_recursoUncheckedCreateInput {
  return {
    valorLiberacao: data.valorLiberacao,
    dataLiberacao: toDate(data.dataLiberacao),
    verbaPublicaId: data.verbaPublicaId,
    etapaCronogramaId: data.etapaCronogramaId,
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
  async create(data: CreateLiberacaoRecursoDTO) {
    return response(await prisma.liberacao_recurso.create({ data: createData(data) }));
  }
  async findAll() {
    return (await prisma.liberacao_recurso.findMany()).map(response);
  }
  async findById(id: number) {
    const item = await prisma.liberacao_recurso.findUnique({ where: { id } });
    return item ? response(item) : null;
  }
  async update(id: number, data: UpdateLiberacaoRecursoDTO) {
    return response(await prisma.liberacao_recurso.update({ where: { id }, data: updateData(data) }));
  }
  async delete(id: number) {
    await prisma.liberacao_recurso.delete({ where: { id } });
  }
  async sumByVerba(verbaPublicaId: number, excludeId?: number): Promise<string> {
    const result = await prisma.liberacao_recurso.aggregate({
      _sum: { valorLiberacao: true },
      where: {
        verbaPublicaId,
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
