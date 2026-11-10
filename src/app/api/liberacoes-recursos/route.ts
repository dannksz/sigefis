import { NextResponse } from "next/server";
import { parseCreateLiberacaoRecursoInput } from "@/lib/liberacao-recurso-validation";
import { LiberacaoRecursoService } from "@/services/liberacao-recurso.service";

const service = new LiberacaoRecursoService();

export async function GET() {
  try { return NextResponse.json(await service.findAll()); }
  catch (error: unknown) {
    console.error("Erro ao listar liberações:", error);
    return NextResponse.json({ error: "Erro interno ao listar liberações." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "O corpo da requisição deve ser um JSON válido." }, { status: 400 }); }
  const input = parseCreateLiberacaoRecursoInput(body);
  if (!input.success) return NextResponse.json({ error: input.error }, { status: 400 });
  try { return NextResponse.json(await service.create(input.data), { status: 201 }); }
  catch (error: unknown) {
    if (error instanceof Error && [
      "Etapa do cronograma não encontrada.",
      "Verba pública não encontrada.",
      "A verba não está vinculada ao projeto da etapa.",
    ].includes(error.message)) return NextResponse.json({ error: error.message }, { status: 404 });
    if (error instanceof Error && error.message.startsWith("O total de liberações")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Erro ao criar liberação:", error);
    return NextResponse.json({ error: "Erro interno ao criar liberação." }, { status: 500 });
  }
}
