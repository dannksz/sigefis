import type { empresa } from "@prisma/client";
import prisma from "@/lib/prisma";
import type {
  CreateEmpresaDTO,
  EmpresaResponseDTO,
  UpdateEmpresaDTO,
} from "@/types/empresa";

function toResponseDTO(empresa: empresa): EmpresaResponseDTO {
  return {
    id: empresa.id,
    nome: empresa.nome,
    cnpj: empresa.cnpj,
    representanteLegal: empresa.representanteLegal,
    telefone: empresa.telefone,
    email: empresa.email,
    enderecoId: empresa.enderecoId,
  };
}

export class EmpresaRepository {
  async create(data: CreateEmpresaDTO): Promise<EmpresaResponseDTO> {
    const empresa = await prisma.empresa.create({
      data: {
        nome: data.nome,
        cnpj: data.cnpj,
        representanteLegal: data.representanteLegal,
        telefone: data.telefone,
        email: data.email,
        enderecoId: data.enderecoId,
      },
    });

    return toResponseDTO(empresa);
  }

  async findAll(): Promise<EmpresaResponseDTO[]> {
    const empresas = await prisma.empresa.findMany();
    return empresas.map(toResponseDTO);
  }

  async findById(id: number): Promise<EmpresaResponseDTO | null> {
    const empresa = await prisma.empresa.findUnique({
      where: { id },
    });

    return empresa ? toResponseDTO(empresa) : null;
  }

  async update(
    id: number,
    data: UpdateEmpresaDTO,
  ): Promise<EmpresaResponseDTO> {
    const empresa = await prisma.empresa.update({
      where: { id },
      data: {
        ...(data.nome !== undefined && { nome: data.nome }),
        ...(data.cnpj !== undefined && { cnpj: data.cnpj }),
        ...(data.representanteLegal !== undefined && {
          representanteLegal: data.representanteLegal,
        }),
        ...(data.telefone !== undefined && { telefone: data.telefone }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.enderecoId !== undefined && { enderecoId: data.enderecoId }),
      },
    });

    return toResponseDTO(empresa);
  }

  async delete(id: number): Promise<void> {
    await prisma.empresa.delete({
      where: { id },
    });
  }
}
