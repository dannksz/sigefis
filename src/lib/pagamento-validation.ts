import type { CreatePagamentoDTO, UpdatePagamentoDTO } from "@/types/pagamento";

type Result<T> = { success: true; data: T } | { success: false; error: string };
const MONEY = /^\d{1,10}(?:\.\d{1,2})?$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function id(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}
function text(value: unknown, max: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= max;
}
function money(value: unknown): string | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value <= 0) return null;
    value = value.toFixed(2);
  }
  if (typeof value !== "string" || !MONEY.test(value.trim()) || Number(value) <= 0) return null;
  const [integer, decimal = ""] = value.trim().split(".");
  return `${integer}.${decimal.padEnd(2, "0")}`;
}
function date(value: unknown): value is string {
  if (typeof value !== "string" || !DATE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}
const allowed = ["valorPagamento", "dataPagamento", "numeroNotaFiscal", "contratoId", "etapaCronogramaId"];
function fields(value: Record<string, unknown>): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

export function parseCreatePagamentoInput(value: unknown): Result<CreatePagamentoDTO> {
  if (!record(value) || !fields(value)) return { success: false, error: "Dados inválidos ou campos não permitidos." };
  const valorPagamento = money(value.valorPagamento);
  if (!valorPagamento || !date(value.dataPagamento) || !text(value.numeroNotaFiscal, 45) ||
      !id(value.contratoId) || !id(value.etapaCronogramaId)) {
    return { success: false, error: "Informe valor, data, nota fiscal, contrato e etapa válidos." };
  }
  return { success: true, data: {
    valorPagamento, dataPagamento: value.dataPagamento, numeroNotaFiscal: value.numeroNotaFiscal.trim(),
    contratoId: value.contratoId, etapaCronogramaId: value.etapaCronogramaId,
  } };
}

export function parseUpdatePagamentoInput(value: unknown): Result<UpdatePagamentoDTO> {
  if (!record(value) || !fields(value)) return { success: false, error: "Dados inválidos ou campos não permitidos." };
  if (Object.keys(value).length === 0) return { success: false, error: "Informe ao menos um campo para atualizar." };
  const data: UpdatePagamentoDTO = {};
  if ("valorPagamento" in value) {
    const parsed = money(value.valorPagamento);
    if (!parsed) return { success: false, error: "Valor do pagamento inválido." };
    data.valorPagamento = parsed;
  }
  if ("dataPagamento" in value) {
    if (!date(value.dataPagamento)) return { success: false, error: "Data do pagamento inválida." };
    data.dataPagamento = value.dataPagamento;
  }
  if ("numeroNotaFiscal" in value) {
    if (!text(value.numeroNotaFiscal, 45)) return { success: false, error: "Número da nota fiscal inválido." };
    data.numeroNotaFiscal = value.numeroNotaFiscal.trim();
  }
  for (const field of ["contratoId", "etapaCronogramaId"] as const) {
    if (field in value) {
      if (!id(value[field])) return { success: false, error: `ID de ${field} inválido.` };
      data[field] = value[field];
    }
  }
  return { success: true, data };
}
