import type { obra_fiscal } from "@prisma/client";
import prisma from "@/lib/prisma";
import type {
  CreateObraFiscalDTO,
  ObraFiscalResponseDTO,
  UpdateObraFiscalDTO,
} from "@/types/obra-fiscal";

const toDate = (value: string) => new Date(`${value}T00:00:00.000Z`);

function toResponseDTO(item: obra_fiscal): ObraFiscalResponseDTO {
  return {
    id: item.id,
    dataDesignacao: item.dataDesignacao.toISOString().slice(0, 10),
    usuarioId: item.usuarioId,
    projetoObraId: item.projetoObraId,
  };
}

export class ObraFiscalRepository {
  async create(data: CreateObraFiscalDTO): Promise<ObraFiscalResponseDTO> {
    const item = await prisma.obra_fiscal.create({
      data: { ...data, dataDesignacao: toDate(data.dataDesignacao) },
    });
    return toResponseDTO(item);
  }

  async findAll(): Promise<ObraFiscalResponseDTO[]> {
    const items = await prisma.obra_fiscal.findMany();
    return items.map(toResponseDTO);
  }

  async findById(id: number): Promise<ObraFiscalResponseDTO | null> {
    const item = await prisma.obra_fiscal.findUnique({ where: { id } });
    return item ? toResponseDTO(item) : null;
  }

  async update(
    id: number,
    data: UpdateObraFiscalDTO,
  ): Promise<ObraFiscalResponseDTO> {
    const item = await prisma.obra_fiscal.update({
      where: { id },
      data: {
        ...(data.dataDesignacao !== undefined && {
          dataDesignacao: toDate(data.dataDesignacao),
        }),
        ...(data.usuarioId !== undefined && { usuarioId: data.usuarioId }),
        ...(data.projetoObraId !== undefined && {
          projetoObraId: data.projetoObraId,
        }),
      },
    });
    return toResponseDTO(item);
  }

  async delete(id: number): Promise<void> {
    await prisma.obra_fiscal.delete({ where: { id } });
  }
}
