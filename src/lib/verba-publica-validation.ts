import type {
  CreateVerbaPublicaDTO,
  UpdateVerbaPublicaDTO,
} from "@/types/verba-publica";

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const MONEY_PATTERN = /^\d{1,10}(?:\.\d{1,2})?$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyFields(value: Record<string, unknown>): boolean {
  return Object.keys(value).every((key) =>
    ["valor", "origem", "finalidade", "orgaoId"].includes(key),
  );
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
  if (!MONEY_PATTERN.test(normalized)) {
    return null;
  }

  const [integerPart, decimalPart = ""] = normalized.split(".");
  const numericValue = Number(normalized);
  if (
    !Number.isSafeInteger(Number(integerPart)) ||
    numericValue <= 0 ||
    (integerPart.length === 10 && Number(integerPart) > 9999999999)
  ) {
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

export function parseCreateVerbaPublicaInput(
  value: unknown,
): ValidationResult<CreateVerbaPublicaDTO> {
  if (!isRecord(value) || !hasOnlyFields(value)) {
    return invalidFields();
  }

  const valor = parseMoney(value.valor);
  if (
    valor === null ||
    !isValidText(value.origem, 45) ||
    !isValidText(value.finalidade, 65) ||
    !isValidId(value.orgaoId)
  ) {
    return {
      success: false,
      error: "Informe valor, origem, finalidade e órgão público válidos.",
    };
  }

  return {
    success: true,
    data: {
      valor,
      origem: value.origem.trim(),
      finalidade: value.finalidade.trim(),
      orgaoId: value.orgaoId,
    },
  };
}

export function parseUpdateVerbaPublicaInput(
  value: unknown,
): ValidationResult<UpdateVerbaPublicaDTO> {
  if (!isRecord(value) || !hasOnlyFields(value)) {
    return invalidFields();
  }
  if (Object.keys(value).length === 0) {
    return {
      success: false,
      error: "Informe ao menos um campo para atualizar.",
    };
  }

  const data: UpdateVerbaPublicaDTO = {};
  if ("valor" in value) {
    const valor = parseMoney(value.valor);
    if (valor === null) {
      return { success: false, error: "Valor da verba pública inválido." };
    }
    data.valor = valor;
  }
  if ("origem" in value) {
    if (!isValidText(value.origem, 45)) {
      return { success: false, error: "Origem deve ter de 1 a 45 caracteres." };
    }
    data.origem = value.origem.trim();
  }
  if ("finalidade" in value) {
    if (!isValidText(value.finalidade, 65)) {
      return {
        success: false,
        error: "Finalidade deve ter de 1 a 65 caracteres.",
      };
    }
    data.finalidade = value.finalidade.trim();
  }
  if ("orgaoId" in value) {
    if (!isValidId(value.orgaoId)) {
      return { success: false, error: "ID de órgão público inválido." };
    }
    data.orgaoId = value.orgaoId;
  }

  return { success: true, data };
}
