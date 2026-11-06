import { NextResponse } from "next/server";
import { ProjetoService } from "@/services/projeto.service";
import { parseCreateProjetoInput } from "@/lib/projeto-validation";

const projetoService = new ProjetoService();

function isEnderecoNotFound(error: unknown): error is Error {
  return error instanceof Error && error.message === "Endereço não encontrado.";
}

export async function GET() {
  try {
    const projetos = await projetoService.findAll();
    return NextResponse.json(projetos, { status: 200 });
  } catch (error: unknown) {
    console.error("Erro ao listar projetos:", error);
    return NextResponse.json(
      { error: "Erro interno ao listar projetos." },
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

  const input = parseCreateProjetoInput(body);
  if (!input.success) {
    return NextResponse.json({ error: input.error }, { status: 400 });
  }

  try {
    const projeto = await projetoService.create(input.data);
    return NextResponse.json(projeto, { status: 201 });
  } catch (error: unknown) {
    if (isEnderecoNotFound(error)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error("Erro ao criar projeto:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar projeto." },
      { status: 500 },
    );
  }
}
