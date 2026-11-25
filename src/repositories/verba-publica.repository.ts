import { paginate, type ListQuery, type PaginatedResult } from "@/lib/pagination";
import { Prisma, type verba_publica } from "@prisma/client";
import { VerbaPublicaBudgetError } from "@/lib/verba-publica-budget-error";
import { AllocationError } from "@/lib/allocation-error";
import prisma from "@/lib/prisma";
import type {
  CreateVerbaPublicaDTO,
  UpdateVerbaPublicaDTO,
  VerbaPublicaResponseDTO,
} from "@/types/verba-publica";

function toResponseDTO(verba: verba_publica): VerbaPublicaResponseDTO {
  return {
    id: verba.id,
    valor: verba.valor.toString(),
    origem: verba.origem,
    finalidade: verba.finalidade,
    orgaoId: verba.orgaoId,
  };
}

export class VerbaPublicaRepository {
  async create(data: CreateVerbaPublicaDTO): Promise<VerbaPublicaResponseDTO> {
    const verba = await prisma.verba_publica.create({
      data,
    });

    return toResponseDTO(verba);
  }

  async findAll(query: ListQuery): Promise<PaginatedResult<VerbaPublicaResponseDTO>> {
    const where = {
      ...(query.busca ? { OR: [{ origem: { contains: query.busca } }, { finalidade: { contains: query.busca } }] } : {}),
      ...(query.finalidade ? { finalidade: { contains: String(query.finalidade) } } : {}),
      ...(query.orgaoId ? { orgaoId: Number(query.orgaoId) } : {}),
    };
    return paginate({
      query,
      count: () => prisma.verba_publica.count({ where }),
      findMany: ({ skip, take }) => prisma.verba_publica.findMany({ skip, take, where }),
      map: toResponseDTO,
    });
  }

  async findById(id: number): Promise<VerbaPublicaResponseDTO | null> {
    const verba = await prisma.verba_publica.findUnique({
      where: { id },
    });

    return verba ? toResponseDTO(verba) : null;
  }

  async update(
    id: number,
    data: UpdateVerbaPublicaDTO,
  ): Promise<VerbaPublicaResponseDTO> {
    const verba = await prisma.$transaction(async (tx) => {
      if (data.valor !== undefined) {
        const current = await tx.verba_publica.findUnique({
          where: { id }, select: { valor: true },
        });
        if (!current) throw new Error("Verba pública não encontrada.");
        if (current.valor.greaterThan(data.valor)) {
          const { _sum } = await tx.contrato.aggregate({
            where: { verbaPublicaId: id },
            _sum: { valorContrato: true },
          });
          const committed = _sum.valorContrato ?? new Prisma.Decimal(0);
          if (committed.greaterThan(data.valor)) throw new VerbaPublicaBudgetError(committed.toNumber());
          const allocated = await tx.projeto_verba.aggregate({
            where: { verbaPublicaId: id }, _sum: { valorAlocado: true },
          });
          if (allocated._sum.valorAlocado?.greaterThan(data.valor)) {
            throw new AllocationError("O valor da verba não pode ficar abaixo do total já alocado às obras.");
          }
        }
      }
      return tx.verba_publica.update({ where: { id }, data });
    }, { isolationLevel: "Serializable" });

    return toResponseDTO(verba);
  }

  async delete(id: number): Promise<void> {
    await prisma.verba_publica.delete({
      where: { id },
    });
  }

  async existsById(id: number): Promise<boolean> {
    return (await this.findById(id)) !== null;
  }
}
