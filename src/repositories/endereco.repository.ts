import { paginate, type ListQuery, type PaginatedResult } from "@/lib/pagination";
import type { endereco } from "@prisma/client";
import prisma from "@/lib/prisma";
import type {
  CreateEnderecoDTO,
  EnderecoResponseDTO,
  UpdateEnderecoDTO,
} from "@/types/endereco";

function toResponseDTO(endereco: endereco): EnderecoResponseDTO {
  return {
    id: endereco.id,
    logradouro: endereco.logradouro,
    numero: endereco.numero,
    complemento: endereco.complemento,
    bairro: endereco.bairro,
    cep: endereco.cep,
    cidadeId: endereco.cidadeId,
  };
}

export class EnderecoRepository {
  async create(data: CreateEnderecoDTO): Promise<EnderecoResponseDTO> {
    const endereco = await prisma.endereco.create({
      data: {
        logradouro: data.logradouro,
        numero: data.numero,
        complemento: data.complemento,
        bairro: data.bairro,
        cep: data.cep,
        cidadeId: data.cidadeId,
      },
    });

    return toResponseDTO(endereco);
  }

  async findAll(query: ListQuery): Promise<PaginatedResult<EnderecoResponseDTO>> {
    const where = {
      ...(query.busca ? { OR: [{ logradouro: { contains: query.busca } }, { bairro: { contains: query.busca } }, { cep: { contains: query.busca } }] } : {}),
      ...(query.cidadeId || query.estadoId ? {
        cidade: {
          ...(query.cidadeId ? { id: query.cidadeId } : {}),
          ...(query.estadoId ? { estadoId: query.estadoId } : {}),
        },
      } : {}),
    };
    return paginate({
      query,
      count: () => prisma.endereco.count({ where }),
      findMany: ({ skip, take }) => prisma.endereco.findMany({ skip, take, where }),
      map: toResponseDTO,
    });
  }

  async findById(id: number): Promise<EnderecoResponseDTO | null> {
    const endereco = await prisma.endereco.findUnique({
      where: { id },
    });

    return endereco ? toResponseDTO(endereco) : null;
  }

  async update(
    id: number,
    data: UpdateEnderecoDTO,
  ): Promise<EnderecoResponseDTO> {
    const endereco = await prisma.endereco.update({
      where: { id },
      data: {
        ...(data.logradouro !== undefined && {
          logradouro: data.logradouro,
        }),
        ...(data.numero !== undefined && { numero: data.numero }),
        ...(data.complemento !== undefined && {
          complemento: data.complemento,
        }),
        ...(data.bairro !== undefined && { bairro: data.bairro }),
        ...(data.cep !== undefined && { cep: data.cep }),
        ...(data.cidadeId !== undefined && { cidadeId: data.cidadeId }),
      },
    });

    return toResponseDTO(endereco);
  }

  async delete(id: number): Promise<void> {
    await prisma.endereco.delete({
        where: {id},
    });
  }
}