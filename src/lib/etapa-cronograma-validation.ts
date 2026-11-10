import type {
  CreateEtapaCronogramaDTO,
  UpdateEtapaCronogramaDTO,
} from "@/types/etapa-cronograma";

type Result<T> = { success: true; data: T } | { success: false; error: string };
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const decimalPattern = /^\d{1,3}(?:\.\d{1,2})?$/;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function id(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}
function order(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 1;
}
function date(value: unknown): value is string {
  if (typeof value !== "string" || !datePattern.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day;
}
function nullableDate(value: unknown): value is string | null | undefined {
  if (value === null || value === undefined) return true;
  return date(value);
}
function decimal(value: unknown): string | null {
  if (typeof value === "number") value = value.toFixed(2);
  if (typeof value !== "string" || !decimalPattern.test(value.trim())) return null;
  const normalized = value.trim();
  return Number(normalized) >= 0 && Number(normalized) <= 100
    ? Number(normalized).toFixed(2)
    : null;
}
function fields(value: Record<string, unknown>) {
  return Object.keys(value).every((key) => [
    "projetoObraId", "nomeEtapa", "ordemEtapa", "percentualPrevisto",
    "percentualExecutado", "dataInicioPrevista", "dataFimPrevista",
    "dataInicioReal", "dataFimReal", "status",
  ].includes(key));
}
function orderError(data: {
  dataInicioPrevista: string;
  dataFimPrevista: string;
  dataInicioReal?: string | null;
  dataFimReal?: string | null;
}): string | null {
  if (data.dataInicioPrevista > data.dataFimPrevista) {
    return "A data inicial prevista não pode ser posterior à data final prevista.";
  }
  if (data.dataInicioReal && data.dataFimReal && data.dataInicioReal > data.dataFimReal) {
    return "A data inicial real não pode ser posterior à data final real.";
  }
  return null;
}

export function parseCreateEtapaCronogramaInput(value: unknown): Result<CreateEtapaCronogramaDTO> {
  if (!record(value) || !fields(value)) return { success: false, error: "Dados inválidos ou campos não permitidos." };
  const percentualPrevisto = decimal(value.percentualPrevisto);
  const percentualExecutado = decimal(value.percentualExecutado);
  if (!id(value.projetoObraId) || !typeofText(value.nomeEtapa, 45) ||
      !order(value.ordemEtapa) ||
      !percentualPrevisto || !percentualExecutado ||
      !date(value.dataInicioPrevista) || !date(value.dataFimPrevista) ||
      !nullableDate(value.dataInicioReal) || !nullableDate(value.dataFimReal) ||
      !typeofText(value.status, 45)) {
    return { success: false, error: "Informe dados válidos para a etapa do cronograma." };
  }
  const data = {
    projetoObraId: value.projetoObraId,
    nomeEtapa: value.nomeEtapa.trim(),
    ordemEtapa: value.ordemEtapa,
    percentualPrevisto,
    percentualExecutado,
    dataInicioPrevista: value.dataInicioPrevista,
    dataFimPrevista: value.dataFimPrevista,
    dataInicioReal: value.dataInicioReal ?? null,
    dataFimReal: value.dataFimReal ?? null,
    status: value.status.trim(),
  };
  const error = orderError(data);
  return error ? { success: false, error } : { success: true, data };
}

function typeofText(value: unknown, max: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= max;
}

export function parseUpdateEtapaCronogramaInput(value: unknown): Result<UpdateEtapaCronogramaDTO> {
  if (!record(value) || !fields(value)) return { success: false, error: "Dados inválidos ou campos não permitidos." };
  if (!Object.keys(value).length) return { success: false, error: "Informe ao menos um campo para atualizar." };
  const data: UpdateEtapaCronogramaDTO = {};
  if ("projetoObraId" in value && !id(value.projetoObraId)) return { success: false, error: "Projeto inválido." };
  if ("projetoObraId" in value) {
    data.projetoObraId = value.projetoObraId as number;
  }
  for (const field of ["nomeEtapa", "status"] as const) {
    if (field in value) {
      if (!typeofText(value[field], 45)) return { success: false, error: `${field} inválido.` };
      data[field] = value[field].trim();
    }
  }
  if ("ordemEtapa" in value) {
    if (!order(value.ordemEtapa)) return { success: false, error: "Ordem da etapa inválida." };
    data.ordemEtapa = value.ordemEtapa;
  }
  for (const field of ["percentualPrevisto", "percentualExecutado"] as const) {
    if (field in value) {
      const parsed = decimal(value[field]);
      if (!parsed) return { success: false, error: `${field} inválido.` };
      data[field] = parsed;
    }
  }
  for (const field of ["dataInicioPrevista", "dataFimPrevista", "dataInicioReal", "dataFimReal"] as const) {
    if (field in value) {
      if (!(field.endsWith("Real") ? nullableDate(value[field]) : date(value[field]))) return { success: false, error: `${field} inválida.` };
      if (field === "dataInicioPrevista" && typeof value[field] === "string") data.dataInicioPrevista = value[field];
      if (field === "dataFimPrevista" && typeof value[field] === "string") data.dataFimPrevista = value[field];
      if (field === "dataInicioReal") data.dataInicioReal = typeof value[field] === "string" ? value[field] : null;
      if (field === "dataFimReal") data.dataFimReal = typeof value[field] === "string" ? value[field] : null;
    }
  }
  return { success: true, data };
}
