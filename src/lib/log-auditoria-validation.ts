import type {
  CreateLogAuditoriaInputDTO,
  UpdateLogAuditoriaDTO,
} from "@/types/log-auditoria";

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
  "acao",
  "tabelaAfetada",
  "registroId",
  "detalhes",
  "ipOrigem",
  "usuarioId",
];

function hasOnlyFields(value: Record<string, unknown>): boolean {
  return Object.keys(value).every((key) => allowedFields.includes(key));
}

export function parseCreateLogAuditoriaInput(
  value: unknown,
): Result<CreateLogAuditoriaInputDTO> {
  if (!record(value) || !hasOnlyFields(value)) {
    return { success: false, error: "Dados inválidos ou campos não permitidos." };
  }
  if (
    !text(value.acao, 100) ||
    !text(value.tabelaAfetada, 60) ||
    !id(value.registroId) ||
    !text(value.detalhes, 65535)
  ) {
    return { success: false, error: "Informe dados válidos para o log de auditoria." };
  }
  return {
    success: true,
    data: {
      acao: value.acao.trim(),
      tabelaAfetada: value.tabelaAfetada.trim(),
      registroId: value.registroId,
      detalhes: value.detalhes.trim(),
    },
  };
}

export function parseUpdateLogAuditoriaInput(
  value: unknown,
): Result<UpdateLogAuditoriaDTO> {
  if (!record(value) || !hasOnlyFields(value)) {
    return { success: false, error: "Dados inválidos ou campos não permitidos." };
  }
  if (Object.keys(value).length === 0) {
    return { success: false, error: "Informe ao menos um campo para atualizar." };
  }
  const data: UpdateLogAuditoriaDTO = {};
  const textFields = [
    ["acao", 100],
    ["tabelaAfetada", 60],
    ["detalhes", 65535],
    ["ipOrigem", 45],
  ] as const;
  for (const [field, maxLength] of textFields) {
    if (field in value) {
      if (!text(value[field], maxLength)) {
        return { success: false, error: `Campo ${field} inválido.` };
      }
      data[field] = value[field].trim();
    }
  }
  for (const field of ["registroId", "usuarioId"] as const) {
    if (field in value) {
      if (!id(value[field])) return { success: false, error: `ID de ${field} inválido.` };
      data[field] = value[field];
    }
  }
  return { success: true, data };
}
