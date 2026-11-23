import { paginate, type ListQuery, type PaginatedResult } from "@/lib/pagination";
import type { projeto_obra } from "@prisma/client";
import prisma from "@/lib/prisma";
import type {
  CreateProjetoDTO,
  CreateProjetoEnderecoDTO,
  ProjetoResponseDTO,
  UpdateProjetoDTO,
} from "@/types/projeto";

function nestedAddressData(address: CreateProjetoEnderecoDTO) {
  if (!("cidade" in address)) return address;
  const { cidade, ...addressFields } = address;
  return {
    ...addressFields,
    cidade: {
      connectOrCreate: {
        where: { nome_estadoId: { nome: cidade.nome, estadoId: cidade.estadoId } },
        create: cidade,
      },
    },
  };
}

function toResponseDTO(projeto: projeto_obra): ProjetoResponseDTO {
  return {
    id: projeto.id,
    dataConclusao: projeto.dataConclusao?.toISOString().slice(0, 10) ?? null,
    publicado: projeto.publicado,
    nome: projeto.nome,
    descricao: projeto.descricao,
    finalidade: projeto.finalidade,
    enderecoId: projeto.enderecoId,
  };
}

export class ProjetoRepository {
  async create(data: CreateProjetoDTO): Promise<ProjetoResponseDTO> {
    const nestedAddress = data.endereco ? nestedAddressData(data.endereco) : undefined;
    const projeto = await prisma.projeto_obra.create({
      data: {
        nome: data.nome,
        descricao: data.descricao,
        finalidade: data.finalidade,
        ...(data.enderecoId !== undefined
          ? { enderecoId: data.enderecoId }
          : { endereco: { create: nestedAddress! } }),
        dataConclusao: data.dataConclusao ? new Date(`${data.dataConclusao}T00:00:00.000Z`) : null,
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
    const scalarData = {
      ...(data.nome !== undefined && { nome: data.nome }),
      ...(data.descricao !== undefined && { descricao: data.descricao }),
      ...(data.finalidade !== undefined && { finalidade: data.finalidade }),
      publicado: data.publicado,
      ...(data.dataConclusao !== undefined && {
        dataConclusao: data.dataConclusao === null ? null : new Date(`${data.dataConclusao}T00:00:00.000Z`),
      }),
    };
    const projeto = data.endereco !== undefined
      ? await prisma.projeto_obra.update({
          where: { id },
          data: { ...scalarData, endereco: { update: nestedAddressData(data.endereco) } },
        })
      : await prisma.projeto_obra.update({
          where: { id },
          data: { ...scalarData, ...(data.enderecoId !== undefined && { enderecoId: data.enderecoId }) },
        });

    return toResponseDTO(projeto);
  }

  async delete(id: number): Promise<void> {
    await prisma.projeto_obra.delete({
      where: { id },
    });
  }
}
