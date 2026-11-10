import { NextResponse } from "next/server";
import { EvidenciaFiscalizacaoService } from "@/services/evidencia-fiscalizacao.service";
import { parseUpdateEvidenciaFiscalizacaoInput } from "@/lib/evidencia-fiscalizacao-validation";

const service = new EvidenciaFiscalizacaoService();
interface Params {
  params: Promise<{ id: string }>;
}

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function isNotFound(error: unknown): error is Error {
  return (
    error instanceof Error &&
    ["Evidência não encontrada.", "Fiscalização não encontrada."].includes(error.message)
  );
}

export async function GET(_request: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "ID de evidência inválido." }, { status: 400 });
  try {
    return NextResponse.json(await service.findById(id));
  } catch (error: unknown) {
    if (isNotFound(error)) return NextResponse.json({ error: error.message }, { status: 404 });
    console.error("Erro ao buscar evidência:", error);
    return NextResponse.json({ error: "Erro interno ao buscar evidência." }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "ID de evidência inválido." }, { status: 400 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "O corpo da requisição deve ser um JSON válido." }, { status: 400 });
  }
  const input = parseUpdateEvidenciaFiscalizacaoInput(body);
  if (!input.success) return NextResponse.json({ error: input.error }, { status: 400 });
  try {
    return NextResponse.json(await service.update(id, input.data));
  } catch (error: unknown) {
    if (isNotFound(error)) return NextResponse.json({ error: error.message }, { status: 404 });
    console.error("Erro ao atualizar evidência:", error);
    return NextResponse.json({ error: "Erro interno ao atualizar evidência." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "ID de evidência inválido." }, { status: 400 });
  try {
    await service.delete(id);
    return NextResponse.json({ message: "Evidência excluída com sucesso." });
  } catch (error: unknown) {
    if (isNotFound(error)) return NextResponse.json({ error: error.message }, { status: 404 });
    console.error("Erro ao excluir evidência:", error);
    return NextResponse.json({ error: "Erro interno ao excluir evidência." }, { status: 500 });
  }
}
