import type { conta_bancaria } from "@prisma/client";
import prisma from "@/lib/prisma";
import type {
  ContaBancariaResponseDTO,
  CreateContaBancariaDTO,
  UpdateContaBancariaDTO,
} from "@/types/conta-bancaria";

function toResponseDTO(item: conta_bancaria): ContaBancariaResponseDTO {
  return {
    id: item.id,
    banco: item.banco,
    agencia: item.agencia,
    numeroConta: item.numeroConta,
    tipoConta: item.tipoConta,
    orgaoPublicoId: item.orgaoPublicoId,
    projetoObraId: item.projetoObraId,
  };
}

export class ContaBancariaRepository {
  async create(data: CreateContaBancariaDTO): Promise<ContaBancariaResponseDTO> {
    const item = await prisma.conta_bancaria.create({ data });
    return toResponseDTO(item);
  }

  async findAll(): Promise<ContaBancariaResponseDTO[]> {
    return (await prisma.conta_bancaria.findMany()).map(toResponseDTO);
  }

  async findById(id: number): Promise<ContaBancariaResponseDTO | null> {
    const item = await prisma.conta_bancaria.findUnique({ where: { id } });
    return item ? toResponseDTO(item) : null;
  }

  async update(
    id: number,
    data: UpdateContaBancariaDTO,
  ): Promise<ContaBancariaResponseDTO> {
    const item = await prisma.conta_bancaria.update({ where: { id }, data });
    return toResponseDTO(item);
  }

  async delete(id: number): Promise<void> {
    await prisma.conta_bancaria.delete({ where: { id } });
  }
}
