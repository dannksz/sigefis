import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { EnderecoService } from "@/services/endereco.service";
import { parseUpdateEnderecoInput } from "@/lib/endereco-validation";

const enderecoService = new EnderecoService();

interface Params {
  params: Promise<{
    id: string;
  }>;
}

function parseEnderecoId(value: string): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function isEnderecoNotFound(error: unknown): error is Error {
  return error instanceof Error && error.message === "Endereço não encontrado.";
}

function isCidadeNotFound(error: unknown): error is Error {
  return error instanceof Error && error.message === "Cidade não encontrada.";
}

export async function GET(_request: Request, { params }: Params) {
  const { id: rawId } = await params;
  const id = parseEnderecoId(rawId);

  if (id === null) {
    return NextResponse.json(
      { error: "ID de endereço inválido." },
      { status: 400 },
    );
  }

  try {
    const endereco = await enderecoService.findById(id);
    return NextResponse.json(endereco, { status: 200 });
  } catch (error: unknown) {
    if (isEnderecoNotFound(error)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error("Erro ao buscar endereço:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar endereço." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, { params }: Params) {
  const { id: rawId } = await params;
  const id = parseEnderecoId(rawId);

  if (id === null) {
    return NextResponse.json(
      { error: "ID de endereço inválido." },
      { status: 400 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "O corpo da requisição deve ser um JSON válido." },
      { status: 400 },
    );
  }

  const input = parseUpdateEnderecoInput(body);
  if (!input.success) {
    return NextResponse.json({ error: input.error }, { status: 400 });
  }

  try {
    const endereco = await enderecoService.update(id, input.data);
    return NextResponse.json(endereco, { status: 200 });
  } catch (error: unknown) {
    if (isEnderecoNotFound(error) || isCidadeNotFound(error)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error("Erro ao atualizar endereço:", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar endereço." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id: rawId } = await params;
  const id = parseEnderecoId(rawId);

  if (id === null) {
    return NextResponse.json(
      { error: "ID de endereço inválido." },
      { status: 400 },
    );
  }

  try {
    await enderecoService.delete(id);
    return NextResponse.json(
      { message: "Endereço excluído com sucesso." },
      { status: 200 },
    );
  } catch (error: unknown) {
    if (isEnderecoNotFound(error)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        {
          error:
            "Não é possível excluir um endereço que possui registros associados.",
        },
        { status: 409 },
      );
    }

    console.error("Erro ao excluir endereço:", error);
    return NextResponse.json(
      { error: "Erro interno ao excluir endereço." },
      { status: 500 },
    );
  }
}
