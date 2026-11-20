import type {
  CreateBloqueioRepasseDTO,
  UpdateBloqueioRepasseDTO,
} from "@/types/bloqueio-repasse";

type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const allowedFields = [
  "motivoBloqueio",
  "statusBloqueio",
  "dataDesbloqueio",
  "projetoObraId",
  "alertaFiscalizacaoId",
];

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function id(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function text(value: unknown, maxLength: number): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= maxLength
  );
}

function date(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function hasOnlyFields(value: Record<string, unknown>): boolean {
  return Object.keys(value).every((key) => allowedFields.includes(key));
}

export function parseCreateBloqueioRepasseInput(
  value: unknown,
): Result<CreateBloqueioRepasseDTO> {
  if (!record(value) || !hasOnlyFields(value)) {
    return { success: false, error: "Dados inválidos ou campos não permitidos." };
  }
  if (
    !text(value.motivoBloqueio, 65535) ||
    !text(value.statusBloqueio, 30) ||
    !id(value.projetoObraId) ||
    !id(value.alertaFiscalizacaoId)
  ) {
    return { success: false, error: "Informe motivo, status e referências válidos." };
  }
  return {
    success: true,
    data: {
      motivoBloqueio: value.motivoBloqueio.trim(),
      statusBloqueio: value.statusBloqueio.trim(),
      projetoObraId: value.projetoObraId,
      alertaFiscalizacaoId: value.alertaFiscalizacaoId,
    },
  };
}

export function parseUpdateBloqueioRepasseInput(
  value: unknown,
): Result<UpdateBloqueioRepasseDTO> {
  if (!record(value) || !hasOnlyFields(value)) {
    return { success: false, error: "Dados inválidos ou campos não permitidos." };
  }
  if (Object.keys(value).length === 0) {
    return { success: false, error: "Informe ao menos um campo para atualizar." };
  }

  const data: Partial<UpdateBloqueioRepasseDTO> = {};
  if ("motivoBloqueio" in value) {
    if (!text(value.motivoBloqueio, 65535)) {
      return { success: false, error: "Motivo do bloqueio inválido." };
    }
    data.motivoBloqueio = value.motivoBloqueio.trim();
  }
  if ("statusBloqueio" in value) {
    if (!text(value.statusBloqueio, 30)) {
      return { success: false, error: "Status do bloqueio inválido." };
    }
    data.statusBloqueio = value.statusBloqueio.trim();
  }
  if ("dataDesbloqueio" in value) {
    if (value.dataDesbloqueio !== null && !date(value.dataDesbloqueio)) {
      return { success: false, error: "Data de desbloqueio inválida." };
    }
    data.dataDesbloqueio = value.dataDesbloqueio;
  }
  for (const field of ["projetoObraId", "alertaFiscalizacaoId"] as const) {
    if (field in value) {
      if (!id(value[field])) return { success: false, error: `ID de ${field} inválido.` };
      data[field] = value[field];
    }
  }
  return { success: true, data: data as UpdateBloqueioRepasseDTO };
}
