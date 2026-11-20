import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getEvidenceContentType, getEvidenceFilePath } from "@/lib/evidencia-upload";
import { EvidenciaFiscalizacaoService } from "@/services/evidencia-fiscalizacao.service";

const service = new EvidenciaFiscalizacaoService();

interface Params {
  params: Promise<{ id: string; nome: string }>;
}

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function GET(_request: Request, { params }: Params) {
  const { id: idValue, nome } = await params;
  const id = parseId(idValue);
  if (id === null || !/^[a-f0-9-]+\.(?:jpg|png|pdf|mp4|webm)$/i.test(nome)) {
    return NextResponse.json({ error: "Arquivo de evidência inválido." }, { status: 400 });
  }

  try {
    const url = `/api/evidencias-fiscalizacao/${id}/arquivo/${nome}`;
    const evidence = await service.findByFileUrl(url, id);
    const filePath = getEvidenceFilePath(evidence.caminhoArquivo);
    if (path.basename(filePath) !== nome) {
      return NextResponse.json({ error: "Arquivo de evidência não encontrado." }, { status: 404 });
    }

    const file = await readFile(filePath);
    return new NextResponse(file, {
      headers: {
        "Content-Type": getEvidenceContentType(evidence.caminhoArquivo),
        "Content-Disposition": "inline",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return NextResponse.json({ error: "Arquivo de evidência não encontrado." }, { status: 404 });
    }
    if (error instanceof Error && error.message === "Evidência não encontrada.") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Erro ao acessar arquivo de evidência:", error);
    return NextResponse.json(
      { error: "Erro interno ao acessar arquivo de evidência." },
      { status: 500 },
    );
  }
}
