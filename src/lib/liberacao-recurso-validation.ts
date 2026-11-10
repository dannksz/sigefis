import type {
  CreateLiberacaoRecursoDTO,
  UpdateLiberacaoRecursoDTO,
} from "@/types/liberacao-recurso";

type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const MONEY = /^\d{1,10}(?:\.\d{1,2})?$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function id(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function money(value: unknown): string | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value <= 0) return null;
    value = value.toFixed(2);
  }
  if (typeof value !== "string" || !MONEY.test(value.trim())) return null;
  const normalized = value.trim();
  if (Number(normalized) <= 0) return null;
  const [integer, decimal = ""] = normalized.split(".");
  return `${integer}.${decimal.padEnd(2, "0")}`;
}

function date(value: unknown): value is string {
  if (typeof value !== "string" || !DATE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day;
}

function fields(value: Record<string, unknown>): boolean {
  return Object.keys(value).every((key) =>
    ["valorLiberacao", "dataLiberacao", "verbaPublicaId", "etapaCronogramaId"].includes(key),
  );
}

export function parseCreateLiberacaoRecursoInput(
  value: unknown,
): Result<CreateLiberacaoRecursoDTO> {
  if (!record(value) || !fields(value)) {
    return { success: false, error: "Dados inválidos ou campos não permitidos." };
  }
  const valorLiberacao = money(value.valorLiberacao);
  if (!valorLiberacao || !date(value.dataLiberacao) ||
      !id(value.verbaPublicaId) || !id(value.etapaCronogramaId)) {
    return { success: false, error: "Informe valor, data, verba e etapa válidos." };
  }
  return {
    success: true,
    data: {
      valorLiberacao,
      dataLiberacao: value.dataLiberacao,
      verbaPublicaId: value.verbaPublicaId,
      etapaCronogramaId: value.etapaCronogramaId,
    },
  };
}

export function parseUpdateLiberacaoRecursoInput(
  value: unknown,
): Result<UpdateLiberacaoRecursoDTO> {
  if (!record(value) || !fields(value)) {
    return { success: false, error: "Dados inválidos ou campos não permitidos." };
  }
  if (Object.keys(value).length === 0) {
    return { success: false, error: "Informe ao menos um campo para atualizar." };
  }
  const data: UpdateLiberacaoRecursoDTO = {};
  if ("valorLiberacao" in value) {
    const valorLiberacao = money(value.valorLiberacao);
    if (!valorLiberacao) return { success: false, error: "Valor da liberação inválido." };
    data.valorLiberacao = valorLiberacao;
  }
  if ("dataLiberacao" in value) {
    if (!date(value.dataLiberacao)) return { success: false, error: "Data da liberação inválida." };
    data.dataLiberacao = value.dataLiberacao;
  }
  for (const field of ["verbaPublicaId", "etapaCronogramaId"] as const) {
    if (field in value) {
      if (!id(value[field])) return { success: false, error: `ID de ${field} inválido.` };
      data[field] = value[field];
    }
  }
  return { success: true, data };
}
