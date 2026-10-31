import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { OrgaoPublicoService } from "@/services/orgao-publico.service";
import { parseCreateOrgaoPublicoInput } from "@/lib/orgao-publico-validation";

const orgaoPublicoService = new OrgaoPublicoService();

function isEnderecoNotFound(error: unknown): error is Error {
  return error instanceof Error && error.message === "Endereço não encontrado.";
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
    const orgaosPublicos = await orgaoPublicoService.findAll();
    return NextResponse.json(orgaosPublicos, { status: 200 });
  } catch (error: unknown) {
    console.error("Erro ao listar órgãos públicos:", error);
    return NextResponse.json(
      { error: "Erro interno ao listar órgãos públicos." },
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

  const input = parseCreateOrgaoPublicoInput(body);
  if (!input.success) {
    return NextResponse.json({ error: input.error }, { status: 400 });
  }

  try {
    const orgaoPublico = await orgaoPublicoService.create(input.data);
    return NextResponse.json(orgaoPublico, { status: 201 });
  } catch (error: unknown) {
    if (isEnderecoNotFound(error) || isForeignKeyConstraintError(error)) {
      return NextResponse.json(
        { error: "Endereço não encontrado." },
        { status: 404 },
      );
    }

    console.error("Erro ao criar órgão público:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar órgão público." },
      { status: 500 },
    );
  }
}
