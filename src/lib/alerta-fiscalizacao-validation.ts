import type {
  CreateAlertaFiscalizacaoDTO,
  UpdateAlertaFiscalizacaoDTO,
} from "@/types/alerta-fiscalizacao";

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
  "tipoAlerta",
  "descricao",
  "severidade",
  "statusAlerta",
  "projetoObraId",
  "fiscalizacaoId",
];

function hasOnlyFields(value: Record<string, unknown>): boolean {
  return Object.keys(value).every((key) => allowedFields.includes(key));
}

export function parseCreateAlertaFiscalizacaoInput(
  value: unknown,
): Result<CreateAlertaFiscalizacaoDTO> {
  if (!record(value) || !hasOnlyFields(value)) {
    return { success: false, error: "Dados inválidos ou campos não permitidos." };
  }
  if (
    !text(value.tipoAlerta, 50) ||
    !text(value.descricao, 65535) ||
    !text(value.severidade, 20) ||
    !text(value.statusAlerta, 30) ||
    !id(value.projetoObraId) ||
    !id(value.fiscalizacaoId)
  ) {
    return { success: false, error: "Informe dados válidos para o alerta." };
  }
  return {
    success: true,
    data: {
      tipoAlerta: value.tipoAlerta.trim(),
      descricao: value.descricao.trim(),
      severidade: value.severidade.trim(),
      statusAlerta: value.statusAlerta.trim(),
      projetoObraId: value.projetoObraId,
      fiscalizacaoId: value.fiscalizacaoId,
    },
  };
}

export function parseUpdateAlertaFiscalizacaoInput(
  value: unknown,
): Result<UpdateAlertaFiscalizacaoDTO> {
  if (!record(value) || !hasOnlyFields(value)) {
    return { success: false, error: "Dados inválidos ou campos não permitidos." };
  }
  if (Object.keys(value).length === 0) {
    return { success: false, error: "Informe ao menos um campo para atualizar." };
  }
  const data: Partial<UpdateAlertaFiscalizacaoDTO> = {};
  const textFields = [
    ["tipoAlerta", 50],
    ["descricao", 65535],
    ["severidade", 20],
    ["statusAlerta", 30],
  ] as const;
  for (const [field, maxLength] of textFields) {
    if (field in value) {
      if (!text(value[field], maxLength)) {
        return { success: false, error: `Campo ${field} inválido.` };
      }
      data[field] = value[field].trim();
    }
  }
  for (const field of ["projetoObraId", "fiscalizacaoId"] as const) {
    if (field in value) {
      if (!id(value[field])) {
        return { success: false, error: `ID de ${field} inválido.` };
      }
      data[field] = value[field];
    }
  }
  return { success: true, data: data as UpdateAlertaFiscalizacaoDTO };
}
