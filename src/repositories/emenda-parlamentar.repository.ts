import { paginate, type ListQuery, type PaginatedResult } from "@/lib/pagination";
import type { emenda_parlamentar } from "@prisma/client";
import prisma from "@/lib/prisma";
import type {
  CreateEmendaParlamentarDTO,
  EmendaParlamentarResponseDTO,
  UpdateEmendaParlamentarDTO,
} from "@/types/emenda-parlamentar";

function toResponseDTO(
  emenda: emenda_parlamentar,
): EmendaParlamentarResponseDTO {
  return {
    id: emenda.id,
    numero: emenda.numero,
    autor: emenda.autor,
    valor: emenda.valor.toString(),
    verbaId: emenda.verbaId,
  };
}

export class EmendaParlamentarRepository {
  async create(
    data: CreateEmendaParlamentarDTO,
  ): Promise<EmendaParlamentarResponseDTO> {
    const emenda = await prisma.emenda_parlamentar.create({ data });
    return toResponseDTO(emenda);
  }

  async findAll(query: ListQuery): Promise<PaginatedResult<EmendaParlamentarResponseDTO>> {
    const where = {
      ...(query.busca ? { OR: [{ numero: { contains: query.busca } }, { autor: { contains: query.busca } }] } : {}),
      ...(query.verbaId ? { verbaId: Number(query.verbaId) } : {}),
    };
    return paginate({
      query,
      count: () => prisma.emenda_parlamentar.count({ where }),
      findMany: ({ skip, take }) => prisma.emenda_parlamentar.findMany({ skip, take, where }),
      map: toResponseDTO,
    });
  }

  async findById(id: number): Promise<EmendaParlamentarResponseDTO | null> {
    const emenda = await prisma.emenda_parlamentar.findUnique({
      where: { id },
    });
    return emenda ? toResponseDTO(emenda) : null;
  }

  async update(
    id: number,
    data: UpdateEmendaParlamentarDTO,
  ): Promise<EmendaParlamentarResponseDTO> {
    const emenda = await prisma.emenda_parlamentar.update({
      where: { id },
      data,
    });
    return toResponseDTO(emenda);
  }

  async delete(id: number): Promise<void> {
    await prisma.emenda_parlamentar.delete({ where: { id } });
  }
}
