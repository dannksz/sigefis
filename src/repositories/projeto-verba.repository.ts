import type { projeto_verba } from "@prisma/client";
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

export class ProjetoVerbaRepository {
  async create(data: CreateProjetoVerbaDTO): Promise<ProjetoVerbaResponseDTO> {
    return toResponseDTO(await prisma.projeto_verba.create({ data }));
  }

  async findAll(): Promise<ProjetoVerbaResponseDTO[]> {
    const items = await prisma.projeto_verba.findMany();
    return items.map(toResponseDTO);
  }

  async findById(id: number): Promise<ProjetoVerbaResponseDTO | null> {
    const item = await prisma.projeto_verba.findUnique({ where: { id } });
    return item ? toResponseDTO(item) : null;
  }

  async update(
    id: number,
    data: UpdateProjetoVerbaDTO,
  ): Promise<ProjetoVerbaResponseDTO> {
    return toResponseDTO(
      await prisma.projeto_verba.update({ where: { id }, data }),
    );
  }

  async delete(id: number): Promise<void> {
    await prisma.projeto_verba.delete({ where: { id } });
  }
}
