import { paginate, type ListQuery, type PaginatedResult } from "@/lib/pagination";
import { Prisma, type projeto_verba } from "@prisma/client";
import { AllocationError } from "@/lib/allocation-error";
import prisma from "@/lib/prisma";
import type {
  CreateProjetoVerbaDTO,
  ProjetoVerbaResponseDTO,
  UpdateProjetoVerbaDTO,
} from "@/types/projeto-verba";

function toResponseDTO(item: projeto_verba): ProjetoVerbaResponseDTO {
  return {
    id: item.id,
    projetoObraId: item.projetoObraId,
    verbaPublicaId: item.verbaPublicaId,
    valorAlocado: item.valorAlocado.toString(),
    dataVinculacao: item.dataVinculacao.toISOString(),
  };
}

async function validateAllocation(tx: Prisma.TransactionClient, verbaPublicaId: number, amount: string | Prisma.Decimal, id?: number) {
  const fund = await tx.verba_publica.findUnique({ where: { id: verbaPublicaId }, select: { valor: true } });
  if (!fund) throw new Error("Verba pública não encontrada.");
  const { _sum } = await tx.projeto_verba.aggregate({
    where: { verbaPublicaId, ...(id !== undefined && { id: { not: id } }) },
    _sum: { valorAlocado: true },
  });
  const available = Prisma.Decimal.max(0, fund.valor.minus(_sum.valorAlocado ?? 0));
  if (available.lessThan(amount)) {
    const formatted = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(available.toNumber());
    throw new AllocationError(`O valor excede o saldo disponível para alocação (${formatted}).`);
  }
}

export class ProjetoVerbaRepository {
  async create(data: CreateProjetoVerbaDTO): Promise<ProjetoVerbaResponseDTO> {
    return prisma.$transaction(async (tx) => {
      await validateAllocation(tx, data.verbaPublicaId, data.valorAlocado);
      return toResponseDTO(await tx.projeto_verba.create({ data }));
    }, { isolationLevel: "Serializable" });
  }

  async findAll(query: ListQuery): Promise<PaginatedResult<ProjetoVerbaResponseDTO>> {
    const where = {
      ...(query.projetoObraId ? { projetoObraId: Number(query.projetoObraId) } : {}),
      ...(query.verbaPublicaId ? { verbaPublicaId: Number(query.verbaPublicaId) } : {}),
    };
    return paginate({
      query,
      count: () => prisma.projeto_verba.count({ where }),
      findMany: ({ skip, take }) => prisma.projeto_verba.findMany({ skip, take, where }),
      map: toResponseDTO,
    });
  }

  async findById(id: number): Promise<ProjetoVerbaResponseDTO | null> {
    const item = await prisma.projeto_verba.findUnique({ where: { id } });
    return item ? toResponseDTO(item) : null;
  }

  async update(
    id: number,
    data: UpdateProjetoVerbaDTO,
  ): Promise<ProjetoVerbaResponseDTO> {
    return prisma.$transaction(async (tx) => {
      const current = await tx.projeto_verba.findUnique({ where: { id } });
      if (!current) throw new Error("Vínculo projeto-verba não encontrado.");
      const fundId = data.verbaPublicaId ?? current.verbaPublicaId;
      const amount = data.valorAlocado ?? current.valorAlocado;
      if (fundId !== current.verbaPublicaId || !current.valorAlocado.equals(amount)) {
        await validateAllocation(tx, fundId, amount, id);
      }
      return toResponseDTO(await tx.projeto_verba.update({ where: { id }, data }));
    }, { isolationLevel: "Serializable" });
  }

  async delete(id: number): Promise<void> {
    await prisma.projeto_verba.delete({ where: { id } });
  }
}
