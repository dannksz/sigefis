import type {
  CreateProjetoVerbaDTO,
  UpdateProjetoVerbaDTO,
} from "@/types/projeto-verba";

type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const MONEY = /^\d{1,10}(?:\.\d{1,2})?$/;

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

function fields(value: Record<string, unknown>): boolean {
  return Object.keys(value).every((key) =>
    ["projetoObraId", "verbaPublicaId", "valorAlocado"].includes(key),
  );
}

export function parseCreateProjetoVerbaInput(
  value: unknown,
): Result<CreateProjetoVerbaDTO> {
  if (!record(value) || !fields(value)) {
    return { success: false, error: "Dados inválidos ou campos não permitidos." };
  }
  const valorAlocado = money(value.valorAlocado);
  if (!id(value.projetoObraId) || !id(value.verbaPublicaId) || !valorAlocado) {
    return { success: false, error: "Informe projeto, verba e valor válidos." };
  }
  return {
    success: true,
    data: {
      projetoObraId: value.projetoObraId,
      verbaPublicaId: value.verbaPublicaId,
      valorAlocado,
    },
  };
}

export function parseUpdateProjetoVerbaInput(
  value: unknown,
): Result<UpdateProjetoVerbaDTO> {
  if (!record(value) || !fields(value)) {
    return { success: false, error: "Dados inválidos ou campos não permitidos." };
  }
  if (Object.keys(value).length === 0) {
    return { success: false, error: "Informe ao menos um campo para atualizar." };
  }
  const data: UpdateProjetoVerbaDTO = {};
  if ("projetoObraId" in value) {
    if (!id(value.projetoObraId)) return { success: false, error: "Projeto inválido." };
    data.projetoObraId = value.projetoObraId;
  }
  if ("verbaPublicaId" in value) {
    if (!id(value.verbaPublicaId)) return { success: false, error: "Verba pública inválida." };
    data.verbaPublicaId = value.verbaPublicaId;
  }
  if ("valorAlocado" in value) {
    const valorAlocado = money(value.valorAlocado);
    if (!valorAlocado) return { success: false, error: "Valor alocado inválido." };
    data.valorAlocado = valorAlocado;
  }
  return { success: true, data };
}
