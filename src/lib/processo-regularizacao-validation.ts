import type {
  CreateProcessoRegularizacaoDTO,
  UpdateProcessoRegularizacaoDTO,
} from "@/types/processo-regularizacao";

type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

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

const allowedFields = [
  "descricaoJustificativa",
  "statusProcesso",
  "bloqueioRepasseId",
  "usuarioId",
];

function hasOnlyFields(value: Record<string, unknown>): boolean {
  return Object.keys(value).every((key) => allowedFields.includes(key));
}

export function parseCreateProcessoRegularizacaoInput(
  value: unknown,
): Result<CreateProcessoRegularizacaoDTO> {
  if (!record(value) || !hasOnlyFields(value)) {
    return { success: false, error: "Dados inválidos ou campos não permitidos." };
  }
  if (
    !text(value.descricaoJustificativa, 65535) ||
    !text(value.statusProcesso, 30) ||
    !id(value.bloqueioRepasseId) ||
    !id(value.usuarioId)
  ) {
    return {
      success: false,
      error: "Informe justificativa, status, bloqueio e usuário válidos.",
    };
  }
  return {
    success: true,
    data: {
      descricaoJustificativa: value.descricaoJustificativa.trim(),
      statusProcesso: value.statusProcesso.trim(),
      bloqueioRepasseId: value.bloqueioRepasseId,
      usuarioId: value.usuarioId,
    },
  };
}

export function parseUpdateProcessoRegularizacaoInput(
  value: unknown,
): Result<UpdateProcessoRegularizacaoDTO> {
  if (!record(value) || !hasOnlyFields(value)) {
    return { success: false, error: "Dados inválidos ou campos não permitidos." };
  }
  if (Object.keys(value).length === 0) {
    return { success: false, error: "Informe ao menos um campo para atualizar." };
  }

  const data: Partial<UpdateProcessoRegularizacaoDTO> = {};
  if ("descricaoJustificativa" in value) {
    if (!text(value.descricaoJustificativa, 65535)) {
      return { success: false, error: "Descrição da justificativa inválida." };
    }
    data.descricaoJustificativa = value.descricaoJustificativa.trim();
  }
  if ("statusProcesso" in value) {
    if (!text(value.statusProcesso, 30)) {
      return { success: false, error: "Status do processo inválido." };
    }
    data.statusProcesso = value.statusProcesso.trim();
  }
  for (const field of ["bloqueioRepasseId", "usuarioId"] as const) {
    if (field in value) {
      if (!id(value[field])) {
        return { success: false, error: `ID de ${field} inválido.` };
      }
      data[field] = value[field];
    }
  }
  return { success: true, data: data as UpdateProcessoRegularizacaoDTO };
}
