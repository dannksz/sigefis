import { paginate, type ListQuery, type PaginatedResult } from "@/lib/pagination";
import type { contrato } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { ContratoBudgetError } from "@/lib/contrato-budget-error";
import prisma from "@/lib/prisma";
import type {
  ContratoResponseDTO,
  CreateContratoDTO,
  UpdateContratoDTO,
} from "@/types/contrato";

function toResponseDTO(contrato: contrato): ContratoResponseDTO {
  return {
    id: contrato.id,
    numeroContrato: contrato.numeroContrato,
    valorContrato: contrato.valorContrato.toString(),
    dataAssinatura: contrato.dataAssinatura.toISOString().slice(0, 10),
    dataInicio: contrato.dataInicio.toISOString().slice(0, 10),
    dataFim: contrato.dataFim.toISOString().slice(0, 10),
    projetoObraId: contrato.projetoObraId,
    empresaId: contrato.empresaId,
    verbaPublicaId: contrato.verbaPublicaId,
  };
}

function toDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

async function ensureBudget(tx: Prisma.TransactionClient, projetoObraId: number, verbaPublicaId: number, valor: string | Prisma.Decimal, id?: number) {
  const verba = await tx.verba_publica.findUnique({ where: { id: verbaPublicaId }, select: { valor: true } });
  if (!verba) throw new Error("Verba pública não encontrada.");
  const committed = await tx.contrato.aggregate({
    where: { verbaPublicaId, ...(id !== undefined && { id: { not: id } }) },
    _sum: { valorContrato: true },
  });
  const available = Prisma.Decimal.max(0, verba.valor.minus(committed._sum.valorContrato ?? 0));
  if (available.lessThan(valor)) throw new ContratoBudgetError(available.toNumber());
  const allocated = await tx.projeto_verba.aggregate({
    where: { projetoObraId, verbaPublicaId },
    _sum: { valorAlocado: true },
  });
  const workCommitted = await tx.contrato.aggregate({
    where: { projetoObraId, verbaPublicaId, ...(id !== undefined && { id: { not: id } }) },
    _sum: { valorContrato: true },
  });
  const coverage = Prisma.Decimal.max(0, new Prisma.Decimal(allocated._sum.valorAlocado ?? 0).minus(workCommitted._sum.valorContrato ?? 0));
  if (coverage.lessThan(valor)) throw new ContratoBudgetError(coverage.toNumber(), "obra");
}

export class ContratoRepository {
  async create(data: CreateContratoDTO): Promise<ContratoResponseDTO> {
    const contrato = await prisma.$transaction(async (tx) => {
      await ensureBudget(tx, data.projetoObraId, data.verbaPublicaId, data.valorContrato);
      return tx.contrato.create({
      data: {
        numeroContrato: data.numeroContrato,
        valorContrato: data.valorContrato,
        dataAssinatura: toDate(data.dataAssinatura),
        dataInicio: toDate(data.dataInicio),
        dataFim: toDate(data.dataFim),
        projetoObraId: data.projetoObraId,
        empresaId: data.empresaId,
        verbaPublicaId: data.verbaPublicaId,
      },
      });
    }, { isolationLevel: "Serializable" });

    return toResponseDTO(contrato);
  }

  async findAll(query: ListQuery): Promise<PaginatedResult<ContratoResponseDTO>> {
    const where = {
      ...(query.busca ? { numeroContrato: { contains: query.busca } } : {}),
      ...(query.projetoObraId ? { projetoObraId: Number(query.projetoObraId) } : {}),
      ...(query.empresaId ? { empresaId: Number(query.empresaId) } : {}),
      ...(query.verbaPublicaId ? { verbaPublicaId: Number(query.verbaPublicaId) } : {}),
    };
    return paginate({
      query,
      count: () => prisma.contrato.count({ where }),
      findMany: ({ skip, take }) => prisma.contrato.findMany({ skip, take, where }),
      map: toResponseDTO,
    });
  }

  async findById(id: number): Promise<ContratoResponseDTO | null> {
    const contrato = await prisma.contrato.findUnique({
      where: { id },
    });

    return contrato ? toResponseDTO(contrato) : null;
  }

  async update(
    id: number,
    data: UpdateContratoDTO,
  ): Promise<ContratoResponseDTO> {
    const contrato = await prisma.$transaction(async (tx) => {
      const current = await tx.contrato.findUnique({ where: { id } });
      if (!current) throw new Error("Contrato não encontrado.");
      const fundId = data.verbaPublicaId ?? current.verbaPublicaId;
      const workId = data.projetoObraId ?? current.projetoObraId;
      const amount = data.valorContrato ?? current.valorContrato;
      if (workId !== current.projetoObraId || fundId !== current.verbaPublicaId || current.valorContrato.lessThan(amount)) {
        await ensureBudget(tx, workId, fundId, amount, id);
      }
      return tx.contrato.update({
      where: { id },
      data: {
        ...(data.numeroContrato !== undefined && {
          numeroContrato: data.numeroContrato,
        }),
        ...(data.valorContrato !== undefined && {
          valorContrato: data.valorContrato,
        }),
        ...(data.dataAssinatura !== undefined && {
          dataAssinatura: toDate(data.dataAssinatura),
        }),
        ...(data.dataInicio !== undefined && {
          dataInicio: toDate(data.dataInicio),
        }),
        ...(data.dataFim !== undefined && {
          dataFim: toDate(data.dataFim),
        }),
        ...(data.projetoObraId !== undefined && {
          projetoObraId: data.projetoObraId,
        }),
        ...(data.empresaId !== undefined && { empresaId: data.empresaId }),
        ...(data.verbaPublicaId !== undefined && {
          verbaPublicaId: data.verbaPublicaId,
        }),
      },
      });
    }, { isolationLevel: "Serializable" });

    return toResponseDTO(contrato);
  }

  async delete(id: number): Promise<void> {
    await prisma.contrato.delete({
      where: { id },
    });
  }
}
