import type {
  CreateRevisaoFiscalizacaoDTO,
  StatusRevisaoFiscalizacao,
  UpdateRevisaoFiscalizacaoDTO,
} from "@/types/revisao-fiscalizacao";

type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const statuses: StatusRevisaoFiscalizacao[] = [
  "PENDENTE",
  "APROVADA",
  "CONTESTADA",
  "CORRECAO_SOLICITADA",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isId(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isStatus(value: unknown): value is StatusRevisaoFiscalizacao {
  return typeof value === "string" && statuses.includes(value as StatusRevisaoFiscalizacao);
}

function hasOnlyFields(value: Record<string, unknown>): boolean {
  return Object.keys(value).every((key) =>
    ["fiscalizacaoId", "fiscalExternoId", "statusRevisao", "parecer"].includes(key),
  );
}

export function parseCreateRevisaoFiscalizacaoInput(
  value: unknown,
): Result<CreateRevisaoFiscalizacaoDTO> {
  if (!isRecord(value) || !hasOnlyFields(value)) {
    return { success: false, error: "Dados inválidos ou campos não permitidos." };
  }
  if (
    !isId(value.fiscalizacaoId) ||
    !isId(value.fiscalExternoId) ||
    !isStatus(value.statusRevisao) ||
    typeof value.parecer !== "string" ||
    value.parecer.trim().length === 0 ||
    value.parecer.trim().length > 65535
  ) {
    return { success: false, error: "Informe fiscalização, fiscal externo, status e parecer válidos." };
  }
  return {
    success: true,
    data: {
      fiscalizacaoId: value.fiscalizacaoId,
      fiscalExternoId: value.fiscalExternoId,
      statusRevisao: value.statusRevisao,
      parecer: value.parecer.trim(),
    },
  };
}

export function parseUpdateRevisaoFiscalizacaoInput(
  value: unknown,
): Result<UpdateRevisaoFiscalizacaoDTO> {
  if (!isRecord(value) || !hasOnlyFields(value)) {
    return { success: false, error: "Dados inválidos ou campos não permitidos." };
  }
  if (Object.keys(value).length === 0) {
    return { success: false, error: "Informe ao menos um campo para atualizar." };
  }
  const data: UpdateRevisaoFiscalizacaoDTO = {};
  if ("statusRevisao" in value) {
    if (!isStatus(value.statusRevisao)) {
      return { success: false, error: "Status da revisão inválido." };
    }
    data.statusRevisao = value.statusRevisao;
  }
  if ("parecer" in value) {
    if (
      typeof value.parecer !== "string" ||
      value.parecer.trim().length === 0 ||
      value.parecer.trim().length > 65535
    ) {
      return { success: false, error: "Parecer da revisão inválido." };
    }
    data.parecer = value.parecer.trim();
  }
  return { success: true, data };
}
