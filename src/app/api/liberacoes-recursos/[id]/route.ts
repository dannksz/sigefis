import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { parseUpdateLiberacaoRecursoInput } from "@/lib/liberacao-recurso-validation";
import { LiberacaoRecursoService } from "@/services/liberacao-recurso.service";

const service = new LiberacaoRecursoService();
interface Params { params: Promise<{ id: string }> }
function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
function isNotFound(error: unknown): error is Error {
  return error instanceof Error && [
    "Liberação de recurso não encontrada.",
    "Etapa do cronograma não encontrada.",
    "Verba pública não encontrada.",
    "A verba não está vinculada ao projeto da etapa.",
  ].includes(error.message);
}
function isLimit(error: unknown): error is Error {
  return error instanceof Error && error.message.startsWith("O total de liberações");
}

export async function GET(_request: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "ID de liberação inválido." }, { status: 400 });
  try { return NextResponse.json(await service.findById(id)); }
  catch (error: unknown) {
    if (isNotFound(error)) return NextResponse.json({ error: error.message }, { status: 404 });
    console.error("Erro ao buscar liberação:", error);
    return NextResponse.json({ error: "Erro interno ao buscar liberação." }, { status: 500 });
  }
}
export async function PUT(request: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "ID de liberação inválido." }, { status: 400 });
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "O corpo da requisição deve ser um JSON válido." }, { status: 400 }); }
  const input = parseUpdateLiberacaoRecursoInput(body);
  if (!input.success) return NextResponse.json({ error: input.error }, { status: 400 });
  try { return NextResponse.json(await service.update(id, input.data)); }
  catch (error: unknown) {
    if (isNotFound(error)) return NextResponse.json({ error: error.message }, { status: 404 });
    if (isLimit(error)) return NextResponse.json({ error: error.message }, { status: 409 });
    console.error("Erro ao atualizar liberação:", error);
    return NextResponse.json({ error: "Erro interno ao atualizar liberação." }, { status: 500 });
  }
}
export async function DELETE(_request: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "ID de liberação inválido." }, { status: 400 });
  try {
    await service.delete(id);
    return NextResponse.json({ message: "Liberação excluída com sucesso." });
  } catch (error: unknown) {
    if (isNotFound(error)) return NextResponse.json({ error: error.message }, { status: 404 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json({ error: "Não é possível excluir uma liberação associada a outros registros." }, { status: 409 });
    }
    console.error("Erro ao excluir liberação:", error);
    return NextResponse.json({ error: "Erro interno ao excluir liberação." }, { status: 500 });
  }
}
