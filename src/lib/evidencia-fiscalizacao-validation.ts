import type {
  CreateEvidenciaFiscalizacaoDTO,
  UpdateEvidenciaFiscalizacaoDTO,
} from "@/types/evidencia-fiscalizacao";

type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isId(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isText(value: unknown, maxLength: number): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= maxLength
  );
}

const fields = [
  "tipoEvidencia",
  "caminhoArquivo",
  "latitude",
  "longitude",
  "fiscalizacaoId",
];

function hasOnlyFields(value: Record<string, unknown>): boolean {
  return Object.keys(value).every((key) => fields.includes(key));
}

export function parseCreateEvidenciaFiscalizacaoInput(
  value: unknown,
): Result<CreateEvidenciaFiscalizacaoDTO> {
  if (!isRecord(value) || !hasOnlyFields(value)) {
    return { success: false, error: "Dados inválidos ou campos não permitidos." };
  }
  if (
    !isText(value.tipoEvidencia, 45) ||
    !isText(value.caminhoArquivo, 255) ||
    !isText(value.latitude, 45) ||
    !isText(value.longitude, 45) ||
    !isId(value.fiscalizacaoId)
  ) {
    return { success: false, error: "Informe dados válidos para a evidência." };
  }
  return {
    success: true,
    data: {
      tipoEvidencia: value.tipoEvidencia.trim(),
      caminhoArquivo: value.caminhoArquivo.trim(),
      latitude: value.latitude.trim(),
      longitude: value.longitude.trim(),
      fiscalizacaoId: value.fiscalizacaoId,
    },
  };
}

export function parseUpdateEvidenciaFiscalizacaoInput(
  value: unknown,
): Result<UpdateEvidenciaFiscalizacaoDTO> {
  if (!isRecord(value) || !hasOnlyFields(value)) {
    return { success: false, error: "Dados inválidos ou campos não permitidos." };
  }
  if (Object.keys(value).length === 0) {
    return { success: false, error: "Informe ao menos um campo para atualizar." };
  }
  const data: UpdateEvidenciaFiscalizacaoDTO = {};
  for (const field of ["tipoEvidencia", "caminhoArquivo", "latitude", "longitude"] as const) {
    if (field in value) {
      if (!isText(value[field], field === "caminhoArquivo" ? 255 : 45)) {
        return { success: false, error: `Campo ${field} inválido.` };
      }
      data[field] = value[field].trim();
    }
  }
  if ("fiscalizacaoId" in value) {
    if (!isId(value.fiscalizacaoId)) {
      return { success: false, error: "ID de fiscalização inválido." };
    }
    data.fiscalizacaoId = value.fiscalizacaoId;
  }
  return { success: true, data };
}
