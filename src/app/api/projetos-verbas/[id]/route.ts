import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ProjetoVerbaService } from "@/services/projeto-verba.service";
import { parseUpdateProjetoVerbaInput } from "@/lib/projeto-verba-validation";

const service = new ProjetoVerbaService();
interface Params { params: Promise<{ id: string }> }

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
function isNotFound(error: unknown): error is Error {
  return error instanceof Error && error.message === "Vínculo projeto-verba não encontrado.";
}
function isReferenceNotFound(error: unknown): error is Error {
  return error instanceof Error && ["Projeto não encontrado.", "Verba pública não encontrada."].includes(error.message);
}

export async function GET(_request: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "ID de vínculo inválido." }, { status: 400 });
  try { return NextResponse.json(await service.findById(id)); }
  catch (error: unknown) {
    if (isNotFound(error)) return NextResponse.json({ error: error.message }, { status: 404 });
    console.error("Erro ao buscar vínculo projeto-verba:", error);
    return NextResponse.json({ error: "Erro interno ao buscar vínculo." }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "ID de vínculo inválido." }, { status: 400 });
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "O corpo da requisição deve ser um JSON válido." }, { status: 400 }); }
  const input = parseUpdateProjetoVerbaInput(body);
  if (!input.success) return NextResponse.json({ error: input.error }, { status: 400 });
  try { return NextResponse.json(await service.update(id, input.data)); }
  catch (error: unknown) {
    if (isNotFound(error) || isReferenceNotFound(error)) return NextResponse.json({ error: error.message }, { status: 404 });
    console.error("Erro ao atualizar vínculo projeto-verba:", error);
    return NextResponse.json({ error: "Erro interno ao atualizar vínculo." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "ID de vínculo inválido." }, { status: 400 });
  try {
    await service.delete(id);
    return NextResponse.json({ message: "Vínculo projeto-verba excluído com sucesso." });
  } catch (error: unknown) {
    if (isNotFound(error)) return NextResponse.json({ error: error.message }, { status: 404 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json({ error: "Não é possível excluir um vínculo associado a outros registros." }, { status: 409 });
    }
    console.error("Erro ao excluir vínculo projeto-verba:", error);
    return NextResponse.json({ error: "Erro interno ao excluir vínculo." }, { status: 500 });
  }
}
