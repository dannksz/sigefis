import type {
  CreateEmendaParlamentarDTO,
  UpdateEmendaParlamentarDTO,
} from "@/types/emenda-parlamentar";

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const MONEY_PATTERN = /^\d{1,10}(?:\.\d{1,2})?$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyFields(value: Record<string, unknown>): boolean {
  return Object.keys(value).every((key) =>
    ["numero", "autor", "valor", "verbaId"].includes(key),
  );
}

function isValidText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length >= 1 && value.trim().length <= 45;
}

function isValidId(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function parseMoney(value: unknown): string | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value <= 0) return null;
    value = value.toFixed(2);
  }
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!MONEY_PATTERN.test(normalized) || Number(normalized) <= 0) return null;
  const [integerPart, decimalPart = ""] = normalized.split(".");
  return `${integerPart}.${decimalPart.padEnd(2, "0")}`;
}

function invalidFields(): ValidationResult<never> {
  return { success: false, error: "Dados inválidos ou campos não permitidos." };
}

export function parseCreateEmendaParlamentarInput(
  value: unknown,
): ValidationResult<CreateEmendaParlamentarDTO> {
  if (!isRecord(value) || !hasOnlyFields(value)) return invalidFields();
  const valor = parseMoney(value.valor);
  if (
    !isValidText(value.numero) ||
    !isValidText(value.autor) ||
    valor === null ||
    !isValidId(value.verbaId)
  ) {
    return {
      success: false,
      error: "Informe número, autor, valor e verba pública válidos.",
    };
  }
  return {
    success: true,
    data: {
      numero: value.numero.trim(),
      autor: value.autor.trim(),
      valor,
      verbaId: value.verbaId,
    },
  };
}

export function parseUpdateEmendaParlamentarInput(
  value: unknown,
): ValidationResult<UpdateEmendaParlamentarDTO> {
  if (!isRecord(value) || !hasOnlyFields(value)) return invalidFields();
  if (Object.keys(value).length === 0) {
    return { success: false, error: "Informe ao menos um campo para atualizar." };
  }
  const data: UpdateEmendaParlamentarDTO = {};
  if ("numero" in value) {
    if (!isValidText(value.numero)) return { success: false, error: "Número inválido." };
    data.numero = value.numero.trim();
  }
  if ("autor" in value) {
    if (!isValidText(value.autor)) return { success: false, error: "Autor inválido." };
    data.autor = value.autor.trim();
  }
  if ("valor" in value) {
    const valor = parseMoney(value.valor);
    if (valor === null) return { success: false, error: "Valor da emenda inválido." };
    data.valor = valor;
  }
  if ("verbaId" in value) {
    if (!isValidId(value.verbaId)) return { success: false, error: "ID de verba pública inválido." };
    data.verbaId = value.verbaId;
  }
  return { success: true, data };
}
