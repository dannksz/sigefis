import { compare, hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { ProfileRepository } from "@/repositories/profile.repository";
import { parseUpdateUserInput } from "@/lib/user-validation";
import type { ProfileAddress } from "@/types/profile";

const repository = new ProfileRepository();
const personalFields = new Set(["nome", "cpf", "cnpj", "dataNascimento"]);
const credentialFields = new Set(["email", "senha", "senhaAtual"]);
const addressLimits = { logradouro: 191, numero: 10, complemento: 45, bairro: 45, cep: 9, cidade: 100, uf: 2 } as const;

export class ProfileError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}

function parseAddress(value: unknown): ProfileAddress {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
    Object.keys(value).some((key) => !Object.hasOwn(addressLimits, key))) {
    throw new ProfileError("Informe um endereço válido.");
  }
  const fields = value as Record<string, unknown>;
  const result = Object.fromEntries(Object.entries(addressLimits).map(([key, max]) => {
    const raw = fields[key];
    const text = typeof raw === "string" ? raw.trim() : "";
    if (text.length > max || (key !== "complemento" && !text)) throw new ProfileError("Confira os campos do endereço.");
    return [key, text];
  })) as ProfileAddress;
  if (!/^\d{5}-?\d{3}$/.test(result.cep) || !/^[a-z]{2}$/i.test(result.uf)) {
    throw new ProfileError("Informe um CEP e uma UF válidos.");
  }
  return { ...result, cep: result.cep.replace("-", ""), uf: result.uf.toUpperCase(), complemento: result.complemento || null };
}

export async function getProfile(id: number) {
  const profile = await repository.find(id);
  if (!profile) throw new ProfileError("Conta não encontrada.", 404);
  return profile;
}

export async function updateProfile(id: number, payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new ProfileError("Informe dados válidos.");
  const fields = Object.keys(payload);
  if (!fields.length) throw new ProfileError("Informe um campo para atualizar.");
  const body = payload as Record<string, unknown>;
  try {
    if (fields.length === 1 && "endereco" in body) {
      const where = { id, enderecoId: { not: null } };
      if (body.endereco === null) return await repository.update(where, { endereco: { disconnect: true } });
      const { cidade, uf, ...address } = parseAddress(body.endereco);
      const state = await repository.findState(uf);
      if (!state) throw new ProfileError("UF não cadastrada.");
      return await repository.update(where, {
        endereco: { create: {
          ...address,
          cidade: { connectOrCreate: {
            where: { nome_estadoId: { nome: cidade, estadoId: state.id } },
            create: { nome: cidade, estado: { connect: { id: state.id } } },
          } },
        } },
      });
    }

    if (fields.every((field) => personalFields.has(field))) {
      const result = parseUpdateUserInput(body);
      if (!result.success) throw new ProfileError(result.error);
      const { nome, cpf, cnpj, dataNascimento } = result.data;
      if (typeof dataNascimento === "string" && (!/^\d{4}-\d{2}-\d{2}$/.test(dataNascimento) || new Date(dataNascimento) > new Date())) {
        throw new ProfileError("Informe uma data de nascimento válida.");
      }
      return await repository.update({ id }, {
        nome, cpf, cnpj,
        dataNascimento: dataNascimento ? new Date(dataNascimento) : dataNascimento,
      });
    }

    if (fields.length === 2 && fields.every((field) => credentialFields.has(field)) && "senhaAtual" in body) {
      const { senhaAtual, ...change } = body;
      const result = parseUpdateUserInput(change);
      if (!result.success) throw new ProfileError(result.error);
      const current = await repository.findPassword(id);
      if (!current) throw new ProfileError("Conta não encontrada.", 404);
      if (typeof senhaAtual !== "string" || !senhaAtual || Buffer.byteLength(senhaAtual) > 72 || !(await compare(senhaAtual, current.senha))) {
        throw new ProfileError("Senha atual incorreta.", 400);
      }
      const data = result.data.senha !== undefined
        ? { senha: await hash(result.data.senha, 10) }
        : { email: result.data.email };
      return await repository.update({ id, senha: current.senha }, data);
    }
    throw new ProfileError("Há campos que não podem ser alterados nesta operação.");
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new ProfileError("O e-mail já está em uso ou os dados foram alterados. Confira e tente novamente.", 409);
      if (error.code === "P2025") throw new ProfileError("O cadastro foi alterado ou o endereço não está mais vinculado. Recarregue a página.", 409);
    }
    throw error;
  }
}
