import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { EtapaCronogramaService } from "@/services/etapa-cronograma.service";
import { parseUpdateEtapaCronogramaInput } from "@/lib/etapa-cronograma-validation";

const service = new EtapaCronogramaService();
interface Params { params: Promise<{ id: string }> }
const parseId = (v: string) => Number.isSafeInteger(Number(v)) && Number(v) > 0 ? Number(v) : null;
const isNotFound = (e: unknown) => e instanceof Error && e.message === "Etapa do cronograma não encontrada.";
const isProjetoNotFound = (e: unknown) => e instanceof Error && e.message === "Projeto não encontrado.";

export async function GET(_request: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "ID de etapa inválido." }, { status: 400 });
  try { return NextResponse.json(await service.findById(id)); }
  catch (error) {
    if (isNotFound(error)) return NextResponse.json({ error: error.message }, { status: 404 });
    console.error("Erro ao buscar etapa:", error);
    return NextResponse.json({ error: "Erro interno ao buscar etapa." }, { status: 500 });
  }
}
export async function PUT(request: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "ID de etapa inválido." }, { status: 400 });
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "O corpo da requisição deve ser um JSON válido." }, { status: 400 }); }
  const input = parseUpdateEtapaCronogramaInput(body);
  if (!input.success) return NextResponse.json({ error: input.error }, { status: 400 });
  try { return NextResponse.json(await service.update(id, input.data)); }
  catch (error) {
    if (isNotFound(error) || isProjetoNotFound(error)) return NextResponse.json({ error: error.message }, { status: 404 });
    console.error("Erro ao atualizar etapa:", error);
    return NextResponse.json({ error: "Erro interno ao atualizar etapa." }, { status: 500 });
  }
}
export async function DELETE(_request: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "ID de etapa inválido." }, { status: 400 });
  try {
    await service.delete(id);
    return NextResponse.json({ message: "Etapa excluída com sucesso." });
  } catch (error) {
    if (isNotFound(error)) return NextResponse.json({ error: error.message }, { status: 404 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json({ error: "Não é possível excluir uma etapa com fiscalizações, liberações ou pagamentos associados." }, { status: 409 });
    }
    console.error("Erro ao excluir etapa:", error);
    return NextResponse.json({ error: "Erro interno ao excluir etapa." }, { status: 500 });
  }
}
