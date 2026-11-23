import type { CreateProjetoDTO, CreateProjetoEnderecoDTO, UpdateProjetoDTO } from "@/types/projeto";
import { parseCreateEnderecoInput } from "./endereco-validation";

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyFields(value: Record<string, unknown>, update = false): boolean {
  const allowedFields = ["nome", "descricao", "finalidade", "enderecoId", "dataConclusao"];
  return Object.keys(value).every(
    (key) => allowedFields.includes(key) || key === "endereco" || (update && key === "publicado"),
  );
}

function isValidDataConclusao(value: unknown): value is string | null {
  if (value === null) return true;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value < "1000-01-01") {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isValidText(value: unknown, maxLength: number): value is string {
  return (
    typeof value === "string" &&
    value.trim().length >= 1 &&
    value.trim().length <= maxLength
  );
}

function isValidEnderecoId(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0
  );
}

function parseProjectAddress(value: unknown): ValidationResult<CreateProjetoEnderecoDTO> {
  if (!isRecord(value) || !("cidade" in value)) return parseCreateEnderecoInput(value);
  if ("cidadeId" in value || !isRecord(value.cidade)) return invalidFields();
  if (!Object.keys(value.cidade).every((key) => ["nome", "estadoId"].includes(key))) return invalidFields();
  const cidadeNome = value.cidade.nome;
  const estadoId = value.cidade.estadoId;
  if (!isValidText(cidadeNome, 100) || !isValidEnderecoId(estadoId)) {
    return { success: false, error: "Informe uma cidade e um estado válidos." };
  }
  const address = parseCreateEnderecoInput({
    logradouro: value.logradouro,
    numero: value.numero,
    ...(value.complemento !== undefined && { complemento: value.complemento }),
    bairro: value.bairro,
    cep: value.cep,
    cidadeId: 1,
  });
  if (!address.success) return address;
  return {
    success: true,
    data: {
      logradouro: address.data.logradouro,
      numero: address.data.numero,
      complemento: address.data.complemento,
      bairro: address.data.bairro,
      cep: address.data.cep,
      cidade: { nome: cidadeNome.trim(), estadoId },
    },
  };
}

function invalidFields(): ValidationResult<never> {
  return {
    success: false,
    error: "Dados inválidos ou campos não permitidos.",
  };
}

export function parseCreateProjetoInput(
  value: unknown,
): ValidationResult<CreateProjetoDTO> {
  if (!isRecord(value) || !hasOnlyFields(value)) {
    return invalidFields();
  }

  if (!isValidText(value.nome, 45)) {
    return { success: false, error: "Nome deve ter de 1 a 45 caracteres." };
  }

  if (!isValidText(value.descricao, 250)) {
    return {
      success: false,
      error: "Descrição deve ter de 1 a 250 caracteres.",
    };
  }

  if (!isValidText(value.finalidade, 45)) {
    return {
      success: false,
      error: "Finalidade deve ter de 1 a 45 caracteres.",
    };
  }

  const hasEnderecoId = "enderecoId" in value;
  const hasEndereco = "endereco" in value;
  if (hasEnderecoId === hasEndereco) {
    return {
      success: false,
      error: "Informe um endereço cadastrado ou os dados completos de um novo endereço.",
    };
  }
  if (hasEnderecoId && !isValidEnderecoId(value.enderecoId)) {
    return { success: false, error: "Endereço deve ser um ID inteiro positivo." };
  }
  const endereco = hasEndereco ? parseProjectAddress(value.endereco) : null;
  if (endereco && !endereco.success) return endereco;
  const { dataConclusao } = value;
  if (dataConclusao !== undefined && !isValidDataConclusao(dataConclusao)) {
    return { success: false, error: "Informe uma data de conclusão válida em YYYY-MM-DD ou null." };
  }

  const base = {
    nome: value.nome.trim(),
    descricao: value.descricao.trim(),
    finalidade: value.finalidade.trim(),
    ...(dataConclusao !== undefined && { dataConclusao }),
  };
  return {
    success: true,
    data: hasEnderecoId
      ? { ...base, enderecoId: value.enderecoId as number }
      : { ...base, endereco: endereco!.data },
  };
}

export function parseUpdateProjetoInput(
  value: unknown,
): ValidationResult<UpdateProjetoDTO> {
  if (!isRecord(value) || !hasOnlyFields(value, true)) {
    return invalidFields();
  }

  if (Object.keys(value).length === 0) {
    return {
      success: false,
      error: "Informe ao menos um campo para atualizar.",
    };
  }

  const data: Partial<UpdateProjetoDTO> = {};
  if ("endereco" in value) {
    if ("enderecoId" in value) {
      return { success: false, error: "Informe o endereço completo ou um endereço cadastrado, não ambos." };
    }
    const endereco = parseProjectAddress(value.endereco);
    if (!endereco.success) return endereco;
    data.endereco = endereco.data;
  }
  if ("dataConclusao" in value) {
    if (!isValidDataConclusao(value.dataConclusao)) {
      return { success: false, error: "Informe uma data de conclusão válida em YYYY-MM-DD ou null." };
    }
    data.dataConclusao = value.dataConclusao;
  }
  if ("publicado" in value) {
    if (typeof value.publicado !== "boolean") return invalidFields();
    data.publicado = value.publicado;
  }

  if ("nome" in value) {
    if (!isValidText(value.nome, 45)) {
      return { success: false, error: "Nome deve ter de 1 a 45 caracteres." };
    }
    data.nome = value.nome.trim();
  }

  if ("descricao" in value) {
    if (!isValidText(value.descricao, 250)) {
      return {
        success: false,
        error: "Descrição deve ter de 1 a 250 caracteres.",
      };
    }
    data.descricao = value.descricao.trim();
  }

  if ("finalidade" in value) {
    if (!isValidText(value.finalidade, 45)) {
      return {
        success: false,
        error: "Finalidade deve ter de 1 a 45 caracteres.",
      };
    }
    data.finalidade = value.finalidade.trim();
  }

  if ("enderecoId" in value) {
    if (!isValidEnderecoId(value.enderecoId)) {
      return {
        success: false,
        error: "Endereço deve ser um ID inteiro positivo.",
      };
    }
    data.enderecoId = value.enderecoId;
  }

  return { success: true, data: data as UpdateProjetoDTO };
}
