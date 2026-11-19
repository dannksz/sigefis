import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export const MAX_EVIDENCE_FILE_SIZE = 10 * 1024 * 1024;

export const ALLOWED_EVIDENCE_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "application/pdf": ".pdf",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
};

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

export async function saveEvidenceFile(
  fiscalizacaoId: number,
  file: File,
): Promise<string> {
  if (!ALLOWED_EVIDENCE_TYPES[file.type]) {
    throw new Error("Tipo de arquivo não permitido.");
  }
  if (file.size <= 0) {
    throw new Error("O arquivo está vazio.");
  }
  if (file.size > MAX_EVIDENCE_FILE_SIZE) {
    throw new Error("O arquivo excede o limite de 10 MB.");
  }
  const fileName = `${randomUUID()}${ALLOWED_EVIDENCE_TYPES[file.type]}`;
  const directory = path.join(
    process.cwd(),
    "public",
    "uploads",
    "evidencias",
    String(fiscalizacaoId),
  );
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, fileName), Buffer.from(await file.arrayBuffer()));
  return `/uploads/evidencias/${fiscalizacaoId}/${fileName}`;
}

export async function deleteEvidenceFile(caminhoArquivo: string): Promise<void> {
  if (!caminhoArquivo.startsWith("/uploads/evidencias/")) return;
  const relativePath = caminhoArquivo.replace(/^\/uploads\//, "");
  const filePath = path.resolve(process.cwd(), "public", "uploads", relativePath);
  const evidenceRoot = path.resolve(
    process.cwd(),
    "public",
    "uploads",
    "evidencias",
  );
  if (
    filePath !== evidenceRoot &&
    !filePath.startsWith(`${evidenceRoot}${path.sep}`)
  ) {
    return;
  }
  try {
    await unlink(filePath);
  } catch (error: unknown) {
    if (
      !(error instanceof Error) ||
      !("code" in error) ||
      error.code !== "ENOENT"
    ) {
      throw error;
    }
  }
}
