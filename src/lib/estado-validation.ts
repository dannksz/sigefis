import type { CreateEstadoDTO, UpdateEstadoDTO } from "../types/estado";

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyFields(value: Record<string, unknown>): boolean {
  const allowedFields = ["nome", "sigla", "regiao"];
  return Object.keys(value).every((key) => allowedFields.includes(key));
}

export function parseCreateEstadoInput(
  value: unknown,
): ValidationResult<CreateEstadoDTO> {
  if (!isRecord(value) || !hasOnlyFields(value)) {
    return {
      success: false,
      error: "Dados inválidos ou campos não permitidos.",
    };
  }

  if (
    typeof value.nome !== "string" ||
    value.nome.trim().length === 0 ||
    value.nome.trim().length > 45
  ) {
    return { success: false, error: "Nome deve ter de 1 a 45 caracteres." };
  }

  if (
    typeof value.sigla !== "string" ||
    !/^[a-zA-Z]{2}$/.test(value.sigla.trim())
  ) {
    return { success: false, error: "Sigla deve conter duas letras." };
  }

  if (
    typeof value.regiao !== "string" ||
    value.regiao.trim().length === 0 ||
    value.regiao.trim().length > 45
  ) {
    return { success: false, error: "Região deve ter de 1 a 45 caracteres." };
  }

  return {
    success: true,
    data: {
      nome: value.nome.trim(),
      sigla: value.sigla.trim().toUpperCase(),
      regiao: value.regiao.trim(),
    },
  };
}

export function parseUpdateEstadoInput(
  value: unknown,
): ValidationResult<UpdateEstadoDTO> {
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

  const data: UpdateEstadoDTO = {};

  if ("nome" in value) {
    if (
      typeof value.nome !== "string" ||
      value.nome.trim().length === 0 ||
      value.nome.trim().length > 45
    ) {
      return { success: false, error: "Nome deve ter de 1 a 45 caracteres." };
    }
    data.nome = value.nome.trim();
  }

  if ("sigla" in value) {
    if (typeof value.sigla !== "string" || !/^[a-zA-Z]{2}$/.test(value.sigla.trim())) {
      return { success: false, error: "Sigla deve conter duas letras." };
    }
    data.sigla = value.sigla.trim().toUpperCase();
  }

  if ("regiao" in value) {
    if (
      typeof value.regiao !== "string" ||
      value.regiao.trim().length === 0 ||
      value.regiao.trim().length > 45
    ) {
      return { success: false, error: "Região deve ter de 1 a 45 caracteres." };
    }
    data.regiao = value.regiao.trim();
  }

  return { success: true, data };
}