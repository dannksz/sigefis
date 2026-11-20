import { paginate, type ListQuery, type PaginatedResult } from "@/lib/pagination";
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
    publicado: projeto.publicado,
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

  async findAll(query: ListQuery): Promise<PaginatedResult<ProjetoResponseDTO>> {
    const where = {
      ...(query.busca ? { OR: [{ nome: { contains: query.busca } }, { descricao: { contains: query.busca } }, { finalidade: { contains: query.busca } }] } : {}),
      ...(query.finalidade ? { finalidade: { contains: String(query.finalidade) } } : {}),
      ...(query.cidadeId || query.estadoId ? {
        endereco: {
          cidade: {
            ...(query.cidadeId ? { id: query.cidadeId } : {}),
            ...(query.estadoId ? { estadoId: query.estadoId } : {}),
          },
        },
      } : {}),
    };
    return paginate({
      query,
      count: () => prisma.projeto_obra.count({ where }),
      findMany: ({ skip, take }) => prisma.projeto_obra.findMany({ skip, take, where }),
      map: toResponseDTO,
    });
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
        publicado: data.publicado,
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
