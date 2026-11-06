import type { verba_publica } from "@prisma/client";
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

  async findAll(): Promise<VerbaPublicaResponseDTO[]> {
    const verbas = await prisma.verba_publica.findMany();
    return verbas.map(toResponseDTO);
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
    const verba = await prisma.verba_publica.update({
      where: { id },
      data,
    });

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
