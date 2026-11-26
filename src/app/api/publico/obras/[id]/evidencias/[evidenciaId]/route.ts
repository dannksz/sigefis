import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getEvidenceContentType, getEvidenceFilePath } from "@/lib/evidencia-upload";

type Params = { params: Promise<{ id: string; evidenciaId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const values = await params;
  const id = Number(values.id);
  const evidenceId = Number(values.evidenciaId);
  if (![id, evidenceId].every((value) => Number.isSafeInteger(value) && value > 0)) {
    return new NextResponse(null, { status: 404 });
  }
  try {
    const evidence = await prisma.evidencia_fiscalizacao.findFirst({
      where: { id: evidenceId, publicado: true, fiscalizacao: { projetoObra: { id, publicado: true } } },
      select: { caminhoArquivo: true },
    });
    if (!evidence || !/\.(jpg|png)$/i.test(evidence.caminhoArquivo)) return new NextResponse(null, { status: 404 });
    const body = await readFile(getEvidenceFilePath(evidence.caminhoArquivo));
    return new NextResponse(body, {
      headers: {
        "Content-Type": getEvidenceContentType(evidence.caminhoArquivo),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return new NextResponse(null, { status: 404 });
    }
    console.error("Erro ao consultar imagem pública:", error);
    return new NextResponse(null, { status: 500 });
  }
}
