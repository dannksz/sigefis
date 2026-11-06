import type { projeto_obra } from "@prisma/client";
import prisma from "@/lib/prisma";
import type {
  CreateProjetoDTO,
  ProjetoResponseDTO,
  UpdateProjetoDTO,
} from "@/types/projeto";

function toResponseDTO(projeto: projeto_obra): ProjetoResponseDTO {
  return {
    id: projeto.id,
    nome: projeto.nome,
    descricao: projeto.descricao,
    finalidade: projeto.finalidade,
    enderecoId: projeto.enderecoId,
  };
}

export class ProjetoRepository {
  async create(data: CreateProjetoDTO): Promise<ProjetoResponseDTO> {
    const projeto = await prisma.projeto_obra.create({
      data: {
        nome: data.nome,
        descricao: data.descricao,
        finalidade: data.finalidade,
        enderecoId: data.enderecoId,
      },
    });

    return toResponseDTO(projeto);
  }

  async findAll(): Promise<ProjetoResponseDTO[]> {
    const projetos = await prisma.projeto_obra.findMany();
    return projetos.map(toResponseDTO);
  }

  async findById(id: number): Promise<ProjetoResponseDTO | null> {
    const projeto = await prisma.projeto_obra.findUnique({
      where: { id },
    });

    return projeto ? toResponseDTO(projeto) : null;
  }

  async update(
    id: number,
    data: UpdateProjetoDTO,
  ): Promise<ProjetoResponseDTO> {
    const projeto = await prisma.projeto_obra.update({
      where: { id },
      data: {
        ...(data.nome !== undefined && { nome: data.nome }),
        ...(data.descricao !== undefined && { descricao: data.descricao }),
        ...(data.finalidade !== undefined && { finalidade: data.finalidade }),
        ...(data.enderecoId !== undefined && { enderecoId: data.enderecoId }),
      },
    });

    return toResponseDTO(projeto);
  }

  async delete(id: number): Promise<void> {
    await prisma.projeto_obra.delete({
      where: { id },
    });
  }
}
