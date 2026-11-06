import type { CreateContratoDTO, UpdateContratoDTO } from "@/types/contrato";

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MONEY_PATTERN = /^\d{1,10}(?:\.\d{1,2})?$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyFields(value: Record<string, unknown>): boolean {
  const allowedFields = [
    "numeroContrato",
    "valorContrato",
    "dataAssinatura",
    "dataInicio",
    "dataFim",
    "projetoObraId",
    "empresaId",
    "verbaPublicaId",
  ];
  return Object.keys(value).every((key) => allowedFields.includes(key));
}

function isValidText(value: unknown, maxLength: number): value is string {
  return (
    typeof value === "string" &&
    value.trim().length >= 1 &&
    value.trim().length <= maxLength
  );
}

function isValidId(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0
  );
}

function parseDate(value: unknown): string | null {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
    ? value
    : null;
}

function parseMoney(value: unknown): string | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value <= 0) {
      return null;
    }
    value = value.toFixed(2);
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  if (!MONEY_PATTERN.test(normalized) || Number(normalized) <= 0) {
    return null;
  }

  const [integerPart, decimalPart = ""] = normalized.split(".");
  if (integerPart === "9999999999" && decimalPart > "99") {
    return null;
  }

  return `${integerPart}.${decimalPart.padEnd(2, "0")}`;
}

function invalidFields(): ValidationResult<never> {
  return {
    success: false,
    error: "Dados inválidos ou campos não permitidos.",
  };
}

function validateDateOrder(data: {
  dataAssinatura: string;
  dataInicio: string;
  dataFim: string;
}): string | null {
  if (data.dataInicio > data.dataFim) {
    return "A data de início não pode ser posterior à data de fim.";
  }
  return null;
}

export function parseCreateContratoInput(
  value: unknown,
): ValidationResult<CreateContratoDTO> {
  if (!isRecord(value) || !hasOnlyFields(value)) {
    return invalidFields();
  }

  const valorContrato = parseMoney(value.valorContrato);
  const dataAssinatura = parseDate(value.dataAssinatura);
  const dataInicio = parseDate(value.dataInicio);
  const dataFim = parseDate(value.dataFim);

  if (
    !isValidText(value.numeroContrato, 45) ||
    valorContrato === null ||
    dataAssinatura === null ||
    dataInicio === null ||
    dataFim === null ||
    !isValidId(value.projetoObraId) ||
    !isValidId(value.empresaId) ||
    !isValidId(value.verbaPublicaId)
  ) {
    return {
      success: false,
      error: "Informe número, valor, datas e referências válidos.",
    };
  }

  const dateOrderError = validateDateOrder({
    dataAssinatura,
    dataInicio,
    dataFim,
  });
  if (dateOrderError) {
    return { success: false, error: dateOrderError };
  }

  return {
    success: true,
    data: {
      numeroContrato: value.numeroContrato.trim(),
      valorContrato,
      dataAssinatura,
      dataInicio,
      dataFim,
      projetoObraId: value.projetoObraId,
      empresaId: value.empresaId,
      verbaPublicaId: value.verbaPublicaId,
    },
  };
}

export function parseUpdateContratoInput(
  value: unknown,
): ValidationResult<UpdateContratoDTO> {
  if (!isRecord(value) || !hasOnlyFields(value)) {
    return invalidFields();
  }
  if (Object.keys(value).length === 0) {
    return {
      success: false,
      error: "Informe ao menos um campo para atualizar.",
    };
  }

  const data: UpdateContratoDTO = {};
  if ("numeroContrato" in value) {
    if (!isValidText(value.numeroContrato, 45)) {
      return { success: false, error: "Número deve ter de 1 a 45 caracteres." };
    }
    data.numeroContrato = value.numeroContrato.trim();
  }
  if ("valorContrato" in value) {
    const valorContrato = parseMoney(value.valorContrato);
    if (valorContrato === null) {
      return { success: false, error: "Valor do contrato inválido." };
    }
    data.valorContrato = valorContrato;
  }

  for (const field of ["dataAssinatura", "dataInicio", "dataFim"] as const) {
    if (field in value) {
      const date = parseDate(value[field]);
      if (date === null) {
        return { success: false, error: "Data do contrato inválida." };
      }
      data[field] = date;
    }
  }

  for (const field of ["projetoObraId", "empresaId", "verbaPublicaId"] as const) {
    if (field in value) {
      if (!isValidId(value[field])) {
        return { success: false, error: "Referência relacionada inválida." };
      }
      data[field] = value[field];
    }
  }

  return { success: true, data };
}
