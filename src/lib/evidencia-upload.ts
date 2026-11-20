import { randomUUID } from "node:crypto";
import { mkdir, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import prisma from "@/lib/prisma";

export const MAX_EVIDENCE_FILE_SIZE = 10 * 1024 * 1024;
const EVIDENCE_STORAGE_ROOT = path.resolve(
  process.cwd(),
  "storage",
  "uploads",
  "evidencias",
);

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

function hasBytesAtStart(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((value, index) => bytes[index] === value);
}

function isPdf(bytes: Uint8Array): boolean {
  return new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
}

function isMp4(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 12 &&
    new TextDecoder().decode(bytes.slice(4, 8)) === "ftyp"
  );
}

function isWebm(bytes: Uint8Array): boolean {
  return hasBytesAtStart(bytes, [0x1a, 0x45, 0xdf, 0xa3]);
}

function hasValidContent(bytes: Uint8Array, mimeType: string): boolean {
  switch (mimeType) {
    case "image/jpeg":
      return (
        bytes.length >= 3 &&
        hasBytesAtStart(bytes, [0xff, 0xd8, 0xff])
      );
    case "image/png":
      return hasBytesAtStart(bytes, [
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);
    case "application/pdf":
      return isPdf(bytes);
    case "video/mp4":
      return isMp4(bytes);
    case "video/webm":
      return isWebm(bytes);
    default:
      return false;
  }
}

export function getEvidenceFilePath(caminhoArquivo: string): string {
  const privatePath = /^\/api\/evidencias-fiscalizacao\/(\d+)\/arquivo\/([a-f0-9-]+\.(?:jpg|png|pdf|mp4|webm))$/i.exec(
    caminhoArquivo,
  );
  if (privatePath) {
    return path.join(EVIDENCE_STORAGE_ROOT, privatePath[1], privatePath[2]);
  }

  const legacyPath = /^\/uploads\/evidencias\/(\d+)\/([a-f0-9-]+\.(?:jpg|png|pdf|mp4|webm))$/i.exec(
    caminhoArquivo,
  );
  if (legacyPath) {
    return path.join(
      process.cwd(),
      "public",
      "uploads",
      "evidencias",
      legacyPath[1],
      legacyPath[2],
    );
  }

  throw new Error("Caminho de evidência inválido.");
}

export function getEvidenceContentType(caminhoArquivo: string): string {
  const extension = path.extname(caminhoArquivo).toLowerCase();
  return Object.entries(ALLOWED_EVIDENCE_TYPES).find(
    ([, value]) => value === extension,
  )?.[0] ?? "application/octet-stream";
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
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasValidContent(bytes, file.type)) {
    throw new Error("O conteúdo do arquivo não corresponde ao tipo informado.");
  }
  const fileName = `${randomUUID()}${ALLOWED_EVIDENCE_TYPES[file.type]}`;
  const directory = path.join(EVIDENCE_STORAGE_ROOT, String(fiscalizacaoId));
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, fileName), bytes, { flag: "wx" });
  return `/api/evidencias-fiscalizacao/${fiscalizacaoId}/arquivo/${fileName}`;
}

export async function deleteEvidenceFile(caminhoArquivo: string): Promise<void> {
  const filePath = getEvidenceFilePath(caminhoArquivo);
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

export async function cleanupOrphanEvidenceFiles(): Promise<number> {
  const referencedPaths = new Set(
    (
      await prisma.evidencia_fiscalizacao.findMany({
        select: { caminhoArquivo: true },
      })
    ).map(({ caminhoArquivo }) => {
      try {
        return getEvidenceFilePath(caminhoArquivo);
      } catch {
        return "";
      }
    }),
  );
  let removed = 0;
  let fiscalizacaoDirectories;
  try {
    fiscalizacaoDirectories = await readdir(EVIDENCE_STORAGE_ROOT, {
      withFileTypes: true,
    });
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return 0;
    }
    throw error;
  }

  for (const directory of fiscalizacaoDirectories) {
    if (!directory.isDirectory() || !/^\d+$/.test(directory.name)) continue;
    const files = await readdir(
      path.join(EVIDENCE_STORAGE_ROOT, directory.name),
      { withFileTypes: true },
    );
    for (const file of files) {
      if (!file.isFile()) continue;
      const filePath = path.join(
        EVIDENCE_STORAGE_ROOT,
        directory.name,
        file.name,
      );
      if (!referencedPaths.has(filePath)) {
        await unlink(filePath);
        removed += 1;
      }
    }
  }
  return removed;
}
