import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { parseUpdateContaBancariaInput } from "@/lib/conta-bancaria-validation";
import { ContaBancariaService } from "@/services/conta-bancaria.service";
import {
  getResponseRole,
  sanitizeContaBancaria,
} from "@/lib/response-sanitizer";

const service = new ContaBancariaService();
const referenceErrors = [
  "Órgão público não encontrado.",
  "Projeto não encontrado.",
];

interface Params {
  params: Promise<{ id: string }>;
}

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function isNotFound(error: unknown): error is Error {
  return (
    error instanceof Error &&
    ["Conta bancária não encontrada.", ...referenceErrors].includes(error.message)
  );
}

export async function GET(request: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) {
    return NextResponse.json(
      { error: "ID de conta bancária inválido." },
      { status: 400 },
    );
  }

  try {
    const item = await service.findById(id);
    return NextResponse.json(
      sanitizeContaBancaria(item, getResponseRole(request)),
    );
  } catch (error: unknown) {
    if (isNotFound(error)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Erro ao buscar conta bancária:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar conta bancária." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) {
    return NextResponse.json(
      { error: "ID de conta bancária inválido." },
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

  const input = parseUpdateContaBancariaInput(body);
  if (!input.success) {
    return NextResponse.json({ error: input.error }, { status: 400 });
  }

  try {
    return NextResponse.json(await service.update(id, input.data));
  } catch (error: unknown) {
    if (isNotFound(error)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Erro ao atualizar conta bancária:", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar conta bancária." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) {
    return NextResponse.json(
      { error: "ID de conta bancária inválido." },
      { status: 400 },
    );
  }

  try {
    await service.delete(id);
    return NextResponse.json({ message: "Conta bancária excluída com sucesso." });
  } catch (error: unknown) {
    if (isNotFound(error)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        { error: "Não é possível excluir uma conta bancária associada a outros registros." },
        { status: 409 },
      );
    }
    console.error("Erro ao excluir conta bancária:", error);
    return NextResponse.json(
      { error: "Erro interno ao excluir conta bancária." },
      { status: 500 },
    );
  }
}
