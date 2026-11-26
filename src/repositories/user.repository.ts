import { paginate, type ListQuery, type PaginatedResult } from "@/lib/pagination";
import type { usuario } from '@prisma/client';
import prisma from '@/lib/prisma';
import { CreateUserDTO, UpdateUserDTO, UserResponseDTO } from '../types/user';

function toResponseDTO(user: usuario): UserResponseDTO {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    cpf: user.cpf,
    cnpj: user.cnpj || null,
    role: user.role,
    dataNascimento: user.dataNascimento?.toISOString().slice(0, 10) ?? null,
    enderecoId: user.enderecoId,
    criadoEm: user.criadoEm,
    atualizadoEm: user.atualizadoEm,
  };
}

export class UserRepository {
  async listFiscalOptions() {
    return prisma.usuario.findMany({
      where: { role: "FISCAL" },
      select: { id: true, nome: true },
      orderBy: [{ nome: "asc" }, { id: "asc" }],
    });
  }

  async create(data: CreateUserDTO): Promise<UserResponseDTO> {
    const user = await prisma.usuario.create({
      data: {
        nome: data.nome,
        email: data.email,
        senha: data.senha,
        cpf: data.cpf,
        cnpj: data.cnpj || null,
        dataNascimento: data.dataNascimento
          ? new Date(data.dataNascimento)
          : null,
        role: data.role,
        enderecoId: data.enderecoId,
      },
    });
    return toResponseDTO(user);
  }

  async findAll(query: ListQuery): Promise<PaginatedResult<UserResponseDTO>> {
    const where = {
      ...(query.busca ? { OR: [{ nome: { contains: query.busca } }, { email: { contains: query.busca } }, { cpf: { contains: query.busca } }] } : {}),
      ...(query.role ? { role: query.role as "ADMIN" | "FISCAL" | "GESTOR" | "USER" } : {}),
    };
    return paginate({
      query,
      count: () => prisma.usuario.count({ where }),
      findMany: ({ skip, take }) => prisma.usuario.findMany({ skip, take, where }),
      map: toResponseDTO,
    });
  }

  async findById(id: number): Promise<UserResponseDTO | null> {
    const user = await prisma.usuario.findUnique({
      where: { id },
    });
    return user ? toResponseDTO(user) : null;
  }

  async findByEmail(email: string): Promise<UserResponseDTO | null> {
    const user = await prisma.usuario.findUnique({
      where: { email },
    });
    return user ? toResponseDTO(user) : null;
  }

  async findByEmailForAuthentication(
    email: string,
  ): Promise<{ user: UserResponseDTO; senha: string } | null> {
    const user = await prisma.usuario.findUnique({
      where: { email },
    });
    return user ? { user: toResponseDTO(user), senha: user.senha } : null;
  }

  async update(id: number, data: UpdateUserDTO): Promise<UserResponseDTO> {
    const user = await prisma.usuario.update({
      where: { id },
      data: {
        ...(data.nome !== undefined && { nome: data.nome }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.senha !== undefined && { senha: data.senha }),
        ...(data.cpf !== undefined && { cpf: data.cpf }),
        ...(data.cnpj !== undefined && { cnpj: data.cnpj }),
        ...(data.dataNascimento !== undefined && {
          dataNascimento: data.dataNascimento
            ? new Date(data.dataNascimento)
            : null,
        }),
        ...(data.role !== undefined && { role: data.role }),
        ...(data.enderecoId !== undefined && { enderecoId: data.enderecoId }),
      },
    });
    return toResponseDTO(user);
  }

  async delete(id: number): Promise<void> {
    await prisma.usuario.delete({
      where: { id },
    });
  }
}
