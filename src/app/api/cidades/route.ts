import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { CidadeService } from "@/services/cidade.service";
import { parseCreateCidadeInput } from "@/lib/cidade-validation";

const cidadeService = new CidadeService();

function isCidadeNameConflict(error: unknown): boolean {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== "P2002"
  ) {
    return false;
  }

  const target = error.meta?.target;
  return (
    target === "cidade_nome_estadoId_key" ||
    (Array.isArray(target) &&
      target.includes("nome") &&
      target.includes("estadoId"))
  );
}

function isEstadoNotFound(error: unknown): error is Error {
  return error instanceof Error && error.message === "Estado não encontrado.";
}

export async function GET() {
  try {
    const cidades = await cidadeService.findAll();
    return NextResponse.json(cidades, { status: 200 });
  } catch (error: unknown) {
    console.error("Erro ao listar cidades:", error);
    return NextResponse.json(
      { error: "Erro interno ao listar cidades." },
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

  const input = parseCreateCidadeInput(body);
  if (!input.success) {
    return NextResponse.json({ error: input.error }, { status: 400 });
  }

  try {
    const cidade = await cidadeService.create(input.data);
    return NextResponse.json(cidade, { status: 201 });
  } catch (error: unknown) {
    if (isEstadoNotFound(error)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (isCidadeNameConflict(error)) {
      return NextResponse.json(
        { error: "Já existe uma cidade com esse nome nesse estado." },
        { status: 409 },
      );
    }

    console.error("Erro ao criar cidade:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar cidade." },
      { status: 500 },
    );
  }
}
