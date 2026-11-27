import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import type { Profile } from "@/types/profile";

const profileSelect = {
  id: true, nome: true, email: true, cpf: true, cnpj: true, dataNascimento: true,
  endereco: { select: {
    logradouro: true, numero: true, complemento: true, bairro: true, cep: true,
    cidade: { select: { nome: true, estado: { select: { sigla: true } } } },
  } },
} satisfies Prisma.usuarioSelect;

type Row = Prisma.usuarioGetPayload<{ select: typeof profileSelect }>;

function toProfile({ endereco, dataNascimento, ...user }: Row): Profile {
  return {
    ...user,
    dataNascimento: dataNascimento?.toISOString().slice(0, 10) ?? null,
    endereco: endereco ? {
      ...endereco,
      cidade: endereco.cidade.nome,
      uf: endereco.cidade.estado.sigla,
    } : null,
  };
}

export class ProfileRepository {
  async find(id: number) {
    const row = await prisma.usuario.findUnique({ where: { id }, select: profileSelect });
    return row ? toProfile(row) : null;
  }

  findPassword(id: number) {
    return prisma.usuario.findUnique({ where: { id }, select: { senha: true } });
  }

  findState(sigla: string) {
    return prisma.estado.findUnique({ where: { sigla }, select: { id: true } });
  }

  async update(where: Prisma.usuarioWhereUniqueInput, data: Prisma.usuarioUpdateInput) {
    return toProfile(await prisma.usuario.update({ where, data, select: profileSelect }));
  }
}
