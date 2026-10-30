import { NextResponse } from "next/server";
import { EnderecoService } from "@/services/endereco.service";
import { parseCreateEnderecoInput } from "@/lib/endereco-validation";

const enderecoService = new EnderecoService();

function isCidadeNotFound(error: unknown): error is Error {
  return error instanceof Error && error.message === "Cidade não encontrada.";
}

export async function GET() {
  try {
    const enderecos = await enderecoService.findAll();
    return NextResponse.json(enderecos, { status: 200 });
  } catch (error: unknown) {
    console.error("Erro ao listar endereços:", error);
    return NextResponse.json(
      { error: "Erro interno ao listar endereços." },
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

  const input = parseCreateEnderecoInput(body);
  if (!input.success) {
    return NextResponse.json({ error: input.error }, { status: 400 });
  }

  try {
    const endereco = await enderecoService.create(input.data);
    return NextResponse.json(endereco, { status: 201 });
  } catch (error: unknown) {
    if (isCidadeNotFound(error)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error("Erro ao criar endereço:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar endereço." },
      { status: 500 },
    );
  }
}
