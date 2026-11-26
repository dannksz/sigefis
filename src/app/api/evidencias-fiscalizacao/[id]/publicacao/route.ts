import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auditRequestSuccess } from "@/lib/audit-request";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (request.headers.get("x-auth-role") !== "ADMIN") {
    return NextResponse.json({ error: "Somente administradores podem alterar a publicação." }, { status: 403 });
  }
  const id = Number((await params).id);
  const body: unknown = await request.json().catch(() => null);
  if (!Number.isSafeInteger(id) || id < 1 || !body || typeof body !== "object" || !("publicado" in body) || typeof body.publicado !== "boolean") {
    return NextResponse.json({ error: "Informe uma evidência e um estado de publicação válidos." }, { status: 400 });
  }

  try {
    const evidence = await prisma.evidencia_fiscalizacao.findUnique({ where: { id }, select: { caminhoArquivo: true } });
    if (!evidence) return NextResponse.json({ error: "Evidência não encontrada." }, { status: 404 });
    if (body.publicado && !/\.(jpg|png)$/i.test(evidence.caminhoArquivo)) {
      return NextResponse.json({ error: "Somente imagens podem ser publicadas na galeria." }, { status: 400 });
    }
    const { count } = await prisma.evidencia_fiscalizacao.updateMany({
      where: { id, caminhoArquivo: evidence.caminhoArquivo },
      data: { publicado: body.publicado },
    });
    if (!count) return NextResponse.json({ error: "A evidência foi alterada. Atualize a página." }, { status: 409 });
    await auditRequestSuccess(request, body.publicado ? "PUBLICAR_EVIDENCIA" : "RETIRAR_PUBLICACAO_EVIDENCIA", id);
    return NextResponse.json({ publicado: body.publicado });
  } catch (error) {
    console.error("Erro ao alterar publicação da evidência:", error);
    return NextResponse.json({ error: "Não foi possível alterar a publicação." }, { status: 500 });
  }
}
