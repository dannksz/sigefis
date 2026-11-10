import { NextResponse } from "next/server";
import { ObraFiscalService } from "@/services/obra-fiscal.service";
import { parseCreateObraFiscalInput } from "@/lib/obra-fiscal-validation";

const service = new ObraFiscalService();

function isReferenceNotFound(error: unknown): error is Error {
  return (
    error instanceof Error &&
    ["Usuário não encontrado.", "Projeto não encontrado."].includes(
      error.message,
    )
  );
}

export async function GET() {
  try {
    return NextResponse.json(await service.findAll());
  } catch (error: unknown) {
    console.error("Erro ao listar obras fiscais:", error);
    return NextResponse.json(
      { error: "Erro interno ao listar obras fiscais." },
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
  const input = parseCreateObraFiscalInput(body);
  if (!input.success) {
    return NextResponse.json({ error: input.error }, { status: 400 });
  }
  try {
    return NextResponse.json(await service.create(input.data), { status: 201 });
  } catch (error: unknown) {
    if (isReferenceNotFound(error)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Erro ao criar obra fiscal:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar obra fiscal." },
      { status: 500 },
    );
  }
}
