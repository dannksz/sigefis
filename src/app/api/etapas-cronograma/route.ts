import { NextResponse } from "next/server";
import { EtapaCronogramaService } from "@/services/etapa-cronograma.service";
import { parseCreateEtapaCronogramaInput } from "@/lib/etapa-cronograma-validation";

const service = new EtapaCronogramaService();
function isProjetoNotFound(e: unknown): e is Error {
  return e instanceof Error && e.message === "Projeto não encontrado.";
}

export async function GET() {
  try { return NextResponse.json(await service.findAll()); }
  catch (error) {
    console.error("Erro ao listar etapas:", error);
    return NextResponse.json({ error: "Erro interno ao listar etapas." }, { status: 500 });
  }
}
export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "O corpo da requisição deve ser um JSON válido." }, { status: 400 }); }
  const input = parseCreateEtapaCronogramaInput(body);
  if (!input.success) return NextResponse.json({ error: input.error }, { status: 400 });
  try { return NextResponse.json(await service.create(input.data), { status: 201 }); }
  catch (error: unknown) {
    if (isProjetoNotFound(error)) return NextResponse.json({ error: error.message }, { status: 404 });
    console.error("Erro ao criar etapa:", error);
    return NextResponse.json({ error: "Erro interno ao criar etapa." }, { status: 500 });
  }
}
