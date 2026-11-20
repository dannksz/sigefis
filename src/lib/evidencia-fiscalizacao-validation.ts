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

export function isValidLatitude(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const parsed = Number(value);
  return /^-?\d+(?:\.\d+)?$/.test(value) && parsed >= -90 && parsed <= 90;
}

export function isValidLongitude(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const parsed = Number(value);
  return /^-?\d+(?:\.\d+)?$/.test(value) && parsed >= -180 && parsed <= 180;
}

const fields = [
  "tipoEvidencia",
  "caminhoArquivo",
  "latitude",
  "longitude",
  "fiscalizacaoId",
];

const evidencePathPattern =
  /^\/(?:api\/evidencias-fiscalizacao\/\d+\/arquivo|uploads\/evidencias\/\d+)\/[a-f0-9-]+\.(?:jpg|png|pdf|mp4|webm)$/i;

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
    !evidencePathPattern.test(value.caminhoArquivo) ||
    !isValidLatitude(value.latitude) ||
    !isValidLongitude(value.longitude) ||
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
  const data: Partial<UpdateEvidenciaFiscalizacaoDTO> = {};
  for (const field of ["tipoEvidencia", "caminhoArquivo", "latitude", "longitude"] as const) {
    if (field in value) {
      if (field === "latitude" && !isValidLatitude(value[field])) {
        return { success: false, error: "Latitude inválida." };
      }
      if (field === "longitude" && !isValidLongitude(value[field])) {
        return { success: false, error: "Longitude inválida." };
      }
      if (!isText(value[field], field === "caminhoArquivo" ? 255 : 45)) {
        return { success: false, error: `Campo ${field} inválido.` };
      }
      if (
        field === "caminhoArquivo" &&
        !evidencePathPattern.test(value[field])
      ) {
        return { success: false, error: "Caminho de arquivo inválido." };
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
  return { success: true, data: data as UpdateEvidenciaFiscalizacaoDTO };
}
