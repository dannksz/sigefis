import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ContratoService } from "@/services/contrato.service";
import { parseCreateContratoInput } from "@/lib/contrato-validation";

const contratoService = new ContratoService();

function isReferenceNotFound(error: unknown): error is Error {
  return (
    error instanceof Error &&
    [
      "Empresa não encontrada.",
      "Projeto não encontrado.",
      "Verba pública não encontrada.",
    ].includes(error.message)
  );
}

function isForeignKeyConstraintError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  );
}

export async function GET() {
  try {
    const contratos = await contratoService.findAll();
    return NextResponse.json(contratos, { status: 200 });
  } catch (error: unknown) {
    console.error("Erro ao listar contratos:", error);
    return NextResponse.json(
      { error: "Erro interno ao listar contratos." },
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

  const input = parseCreateContratoInput(body);
  if (!input.success) {
    return NextResponse.json({ error: input.error }, { status: 400 });
  }

  try {
    const contrato = await contratoService.create(input.data);
    return NextResponse.json(contrato, { status: 201 });
  } catch (error: unknown) {
    if (isReferenceNotFound(error)) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 },
      );
    }
    if (isForeignKeyConstraintError(error)) {
      return NextResponse.json(
        { error: "Referência relacionada não encontrada." },
        { status: 404 },
      );
    }
    console.error("Erro ao criar contrato:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar contrato." },
      { status: 500 },
    );
  }
}
