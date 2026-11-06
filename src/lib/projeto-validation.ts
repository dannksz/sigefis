import type { CreateProjetoDTO, UpdateProjetoDTO } from "@/types/projeto";

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyFields(value: Record<string, unknown>): boolean {
  const allowedFields = ["nome", "descricao", "finalidade", "enderecoId"];
  return Object.keys(value).every((key) => allowedFields.includes(key));
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

  if (!isValidEnderecoId(value.enderecoId)) {
    return {
      success: false,
      error: "Endereço deve ser um ID inteiro positivo.",
    };
  }

  return {
    success: true,
    data: {
      nome: value.nome.trim(),
      descricao: value.descricao.trim(),
      finalidade: value.finalidade.trim(),
      enderecoId: value.enderecoId,
    },
  };
}

export function parseUpdateProjetoInput(
  value: unknown,
): ValidationResult<UpdateProjetoDTO> {
  if (!isRecord(value) || !hasOnlyFields(value)) {
    return invalidFields();
  }

  if (Object.keys(value).length === 0) {
    return {
      success: false,
      error: "Informe ao menos um campo para atualizar.",
    };
  }

  const data: UpdateProjetoDTO = {};

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

  return { success: true, data };
}
