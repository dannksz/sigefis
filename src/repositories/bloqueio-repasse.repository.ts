import { paginate, type ListQuery, type PaginatedResult } from "@/lib/pagination";
import type { bloqueio_repasse, Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import type {
  BloqueioRepasseResponseDTO,
  CreateBloqueioRepasseDTO,
  UpdateBloqueioRepasseDTO,
} from "@/types/bloqueio-repasse";

const toDate = (value: string) => new Date(`${value}T00:00:00.000Z`);

function toResponseDTO(item: bloqueio_repasse): BloqueioRepasseResponseDTO {
  return {
    id: item.id,
    motivoBloqueio: item.motivoBloqueio,
    dataBloqueio: item.dataBloqueio.toISOString(),
    statusBloqueio: item.statusBloqueio,
    dataDesbloqueio: item.dataDesbloqueio?.toISOString() ?? null,
    projetoObraId: item.projetoObraId,
    alertaFiscalizacaoId: item.alertaFiscalizacaoId,
  };
}

function toCreateData(
  data: CreateBloqueioRepasseDTO,
): Prisma.bloqueio_repasseUncheckedCreateInput {
  return data;
}

function toUpdateData(
  data: UpdateBloqueioRepasseDTO,
): Prisma.bloqueio_repasseUncheckedUpdateInput {
  return {
    ...(data.motivoBloqueio !== undefined && { motivoBloqueio: data.motivoBloqueio }),
    ...(data.statusBloqueio !== undefined && { statusBloqueio: data.statusBloqueio }),
    ...(data.dataDesbloqueio !== undefined && {
      dataDesbloqueio: data.dataDesbloqueio ? toDate(data.dataDesbloqueio) : null,
    }),
    ...(data.projetoObraId !== undefined && { projetoObraId: data.projetoObraId }),
    ...(data.alertaFiscalizacaoId !== undefined && {
      alertaFiscalizacaoId: data.alertaFiscalizacaoId,
    }),
  };
}

export class BloqueioRepasseRepository {
  async create(data: CreateBloqueioRepasseDTO): Promise<BloqueioRepasseResponseDTO> {
    return toResponseDTO(
      await prisma.bloqueio_repasse.create({ data: toCreateData(data) }),
    );
  }

  async findAll(query: ListQuery): Promise<PaginatedResult<BloqueioRepasseResponseDTO>> {
    const where = {
      ...(query.status ? { statusBloqueio: query.status } : {}),
      ...(query.projetoObraId ? { projetoObraId: Number(query.projetoObraId) } : {}),
    };
    return paginate({
      query,
      count: () => prisma.bloqueio_repasse.count({ where }),
      findMany: ({ skip, take }) => prisma.bloqueio_repasse.findMany({ skip, take, where }),
      map: toResponseDTO,
    });
  }

  async findById(id: number): Promise<BloqueioRepasseResponseDTO | null> {
    const item = await prisma.bloqueio_repasse.findUnique({ where: { id } });
    return item ? toResponseDTO(item) : null;
  }

  async update(
    id: number,
    data: UpdateBloqueioRepasseDTO,
  ): Promise<BloqueioRepasseResponseDTO> {
    return toResponseDTO(
      await prisma.bloqueio_repasse.update({
        where: { id },
        data: toUpdateData(data),
      }),
    );
  }

  async delete(id: number): Promise<void> {
    await prisma.bloqueio_repasse.delete({ where: { id } });
  }
}
