import { NextResponse } from "next/server";
import { FiscalizacaoService } from "@/services/fiscalizacao.service";
import { parseCreateFiscalizacaoInput } from "@/lib/fiscalizacao-validation";

const service = new FiscalizacaoService();

function isReferenceError(error: unknown): error is Error {
  return (
    error instanceof Error &&
    [
      "Projeto não encontrado.",
      "Usuário não encontrado.",
      "Etapa do cronograma não encontrada.",
      "A etapa não pertence ao projeto informado.",
    ].includes(error.message)
  );
}

export async function GET() {
  try {
    return NextResponse.json(await service.findAll());
  } catch (error: unknown) {
    console.error("Erro ao listar fiscalizações:", error);
    return NextResponse.json(
      { error: "Erro interno ao listar fiscalizações." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "O corpo da requisição deve ser um JSON válido." },
      { status: 400 },
    );
  }
  const input = parseCreateFiscalizacaoInput(body);
  if (!input.success) {
    return NextResponse.json({ error: input.error }, { status: 400 });
  }
  try {
    return NextResponse.json(await service.create(input.data), { status: 201 });
  } catch (error: unknown) {
    if (isReferenceError(error)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Erro ao criar fiscalização:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar fiscalização." },
      { status: 500 },
    );
  }
}
