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

  async findAll(): Promise<EnderecoResponseDTO[]> {
    const enderecos = await prisma.endereco.findMany();
    return enderecos.map(toResponseDTO);
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