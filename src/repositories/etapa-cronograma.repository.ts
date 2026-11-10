import type { etapa_cronograma } from "@prisma/client";
import prisma from "@/lib/prisma";
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

function toPrismaData(data: CreateEtapaCronogramaDTO | UpdateEtapaCronogramaDTO) {
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

export class EtapaCronogramaRepository {
  async create(data: CreateEtapaCronogramaDTO) {
    return response(await prisma.etapa_cronograma.create({ data: toPrismaData(data) }));
  }
  async findAll() {
    return (await prisma.etapa_cronograma.findMany()).map(response);
  }
  async findById(id: number) {
    const item = await prisma.etapa_cronograma.findUnique({ where: { id } });
    return item ? response(item) : null;
  }
  async update(id: number, values: UpdateEtapaCronogramaDTO) {
    return response(await prisma.etapa_cronograma.update({ where: { id }, data: toPrismaData(values) }));
  }
  async delete(id: number) {
    await prisma.etapa_cronograma.delete({ where: { id } });
  }
}
