import type {
  CreateObraFiscalDTO,
  UpdateObraFiscalDTO,
} from "@/types/obra-fiscal";

type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isId(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function hasOnlyFields(value: Record<string, unknown>): boolean {
  return Object.keys(value).every((key) =>
    ["dataDesignacao", "usuarioId", "projetoObraId"].includes(key),
  );
}

function invalidFields(): Result<never> {
  return {
    success: false,
    error: "Dados inválidos ou campos não permitidos.",
  };
}

export function parseCreateObraFiscalInput(
  value: unknown,
): Result<CreateObraFiscalDTO> {
  if (!isRecord(value) || !hasOnlyFields(value)) return invalidFields();
  if (
    !isDate(value.dataDesignacao) ||
    !isId(value.usuarioId) ||
    !isId(value.projetoObraId)
  ) {
    return {
      success: false,
      error: "Informe data, usuário e projeto válidos.",
    };
  }
  return {
    success: true,
    data: {
      dataDesignacao: value.dataDesignacao,
      usuarioId: value.usuarioId,
      projetoObraId: value.projetoObraId,
    },
  };
}

export function parseUpdateObraFiscalInput(
  value: unknown,
): Result<UpdateObraFiscalDTO> {
  if (!isRecord(value) || !hasOnlyFields(value)) return invalidFields();
  if (Object.keys(value).length === 0) {
    return {
      success: false,
      error: "Informe ao menos um campo para atualizar.",
    };
  }
  const data: UpdateObraFiscalDTO = {};
  if ("dataDesignacao" in value) {
    if (!isDate(value.dataDesignacao)) {
      return { success: false, error: "Data de designação inválida." };
    }
    data.dataDesignacao = value.dataDesignacao;
  }
  if ("usuarioId" in value) {
    if (!isId(value.usuarioId)) {
      return { success: false, error: "ID de usuário inválido." };
    }
    data.usuarioId = value.usuarioId;
  }
  if ("projetoObraId" in value) {
    if (!isId(value.projetoObraId)) {
      return { success: false, error: "ID de projeto inválido." };
    }
    data.projetoObraId = value.projetoObraId;
  }
  return { success: true, data };
}
