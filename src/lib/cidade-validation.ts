import type { CreateCidadeDTO, UpdateCidadeDTO } from "@/types/cidade";

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyFields(value: Record<string, unknown>): boolean {
  const allowedFields = ["nome", "estadoId"];
  return Object.keys(value).every((key) => allowedFields.includes(key));
}

function isValidNome(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length >= 1 &&
    value.trim().length <= 100
  );
}

function isValidEstadoId(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0
  );
}

export function parseCreateCidadeInput(
  value: unknown,
): ValidationResult<CreateCidadeDTO> {
  if (!isRecord(value) || !hasOnlyFields(value)) {
    return {
      success: false,
      error: "Dados inválidos ou campos não permitidos.",
    };
  }

  if (!isValidNome(value.nome)) {
    return { success: false, error: "Nome deve ter de 1 a 100 caracteres." };
  }

  if (!isValidEstadoId(value.estadoId)) {
    return { success: false, error: "Estado deve ser um ID inteiro positivo." };
  }

  return {
    success: true,
    data: {
      nome: value.nome.trim(),
      estadoId: value.estadoId,
    },
  };
}

export function parseUpdateCidadeInput(
  value: unknown,
): ValidationResult<UpdateCidadeDTO> {
  if (!isRecord(value) || !hasOnlyFields(value)) {
    return {
      success: false,
      error: "Dados inválidos ou campos não permitidos.",
    };
  }

  if (Object.keys(value).length === 0) {
    return {
      success: false,
      error: "Informe ao menos um campo para atualizar.",
    };
  }

  const data: UpdateCidadeDTO = {};

  if ("nome" in value) {
    if (!isValidNome(value.nome)) {
      return { success: false, error: "Nome deve ter de 1 a 100 caracteres." };
    }
    data.nome = value.nome.trim();
  }

  if ("estadoId" in value) {
    if (!isValidEstadoId(value.estadoId)) {
      return {
        success: false,
        error: "Estado deve ser um ID inteiro positivo.",
      };
    }
    data.estadoId = value.estadoId;
  }

  return { success: true, data };
}