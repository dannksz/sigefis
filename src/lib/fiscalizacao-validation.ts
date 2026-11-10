import type {
  CreateFiscalizacaoDTO,
  UpdateFiscalizacaoDTO,
} from "@/types/fiscalizacao";

type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const PERCENTAGE_PATTERN = /^\d{1,3}(?:\.\d{1,2})?$/;

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

function percentage(value: unknown): string | null {
  if (typeof value === "number") value = value.toFixed(2);
  if (typeof value !== "string" || !PERCENTAGE_PATTERN.test(value.trim())) {
    return null;
  }
  const normalized = value.trim();
  return Number(normalized) <= 100 ? Number(normalized).toFixed(2) : null;
}

function text(value: unknown, maxLength: number): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= maxLength
  );
}

function hasOnlyFields(value: Record<string, unknown>): boolean {
  return Object.keys(value).every((key) =>
    [
      "dataVistoria",
      "percentualExecutado",
      "parecerTecnico",
      "statusVistoria",
      "projetoObraId",
      "usuarioId",
      "etapaCronogramaId",
    ].includes(key),
  );
}

export function parseCreateFiscalizacaoInput(
  value: unknown,
): Result<CreateFiscalizacaoDTO> {
  if (!isRecord(value) || !hasOnlyFields(value)) {
    return { success: false, error: "Dados inválidos ou campos não permitidos." };
  }
  const percentualExecutado = percentage(value.percentualExecutado);
  if (
    !isDate(value.dataVistoria) ||
    !percentualExecutado ||
    !text(value.parecerTecnico, 65535) ||
    !text(value.statusVistoria, 45) ||
    !isId(value.projetoObraId) ||
    !isId(value.usuarioId) ||
    !isId(value.etapaCronogramaId)
  ) {
    return {
      success: false,
      error: "Informe dados válidos para a fiscalização.",
    };
  }
  return {
    success: true,
    data: {
      dataVistoria: value.dataVistoria,
      percentualExecutado,
      parecerTecnico: value.parecerTecnico.trim(),
      statusVistoria: value.statusVistoria.trim(),
      projetoObraId: value.projetoObraId,
      usuarioId: value.usuarioId,
      etapaCronogramaId: value.etapaCronogramaId,
    },
  };
}

export function parseUpdateFiscalizacaoInput(
  value: unknown,
): Result<UpdateFiscalizacaoDTO> {
  if (!isRecord(value) || !hasOnlyFields(value)) {
    return { success: false, error: "Dados inválidos ou campos não permitidos." };
  }
  if (Object.keys(value).length === 0) {
    return {
      success: false,
      error: "Informe ao menos um campo para atualizar.",
    };
  }
  const data: UpdateFiscalizacaoDTO = {};
  if ("dataVistoria" in value) {
    if (!isDate(value.dataVistoria)) {
      return { success: false, error: "Data de vistoria inválida." };
    }
    data.dataVistoria = value.dataVistoria;
  }
  if ("percentualExecutado" in value) {
    const percentageValue = percentage(value.percentualExecutado);
    if (!percentageValue) {
      return { success: false, error: "Percentual executado inválido." };
    }
    data.percentualExecutado = percentageValue;
  }
  if ("parecerTecnico" in value) {
    if (!text(value.parecerTecnico, 65535)) {
      return { success: false, error: "Parecer técnico inválido." };
    }
    data.parecerTecnico = value.parecerTecnico.trim();
  }
  if ("statusVistoria" in value) {
    if (!text(value.statusVistoria, 45)) {
      return { success: false, error: "Status da vistoria inválido." };
    }
    data.statusVistoria = value.statusVistoria.trim();
  }
  for (const field of [
    "projetoObraId",
    "usuarioId",
    "etapaCronogramaId",
  ] as const) {
    if (field in value) {
      if (!isId(value[field])) {
        return { success: false, error: `ID de ${field} inválido.` };
      }
      data[field] = value[field];
    }
  }
  return { success: true, data };
}
