import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { CidadeService } from "@/services/cidade.service";
import { parseUpdateCidadeInput } from "@/lib/cidade-validation";

const cidadeService = new CidadeService();

interface Params {
  params: Promise<{
    id: string;
  }>;
}

function parseCidadeId(value: string): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function isCidadeNotFound(error: unknown): error is Error {
  return error instanceof Error && error.message === "Cidade não encontrada.";
}

function isEstadoNotFound(error: unknown): error is Error {
  return error instanceof Error && error.message === "Estado não encontrado.";
}

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

export async function GET(_request: Request, { params }: Params) {
  const { id: rawId } = await params;
  const id = parseCidadeId(rawId);

  if (id === null) {
    return NextResponse.json(
      { error: "ID de cidade inválido." },
      { status: 400 },
    );
  }

  try {
    const cidade = await cidadeService.findById(id);
    return NextResponse.json(cidade, { status: 200 });
  } catch (error: unknown) {
    if (isCidadeNotFound(error)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error("Erro ao buscar cidade:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar cidade." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, { params }: Params) {
  const { id: rawId } = await params;
  const id = parseCidadeId(rawId);

  if (id === null) {
    return NextResponse.json(
      { error: "ID de cidade inválido." },
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

  const input = parseUpdateCidadeInput(body);
  if (!input.success) {
    return NextResponse.json({ error: input.error }, { status: 400 });
  }

  try {
    const cidade = await cidadeService.update(id, input.data);
    return NextResponse.json(cidade, { status: 200 });
  } catch (error: unknown) {
    if (isCidadeNotFound(error) || isEstadoNotFound(error)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (isCidadeNameConflict(error)) {
      return NextResponse.json(
        { error: "Já existe uma cidade com esse nome nesse estado." },
        { status: 409 },
      );
    }

    console.error("Erro ao atualizar cidade:", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar cidade." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id: rawId } = await params;
  const id = parseCidadeId(rawId);

  if (id === null) {
    return NextResponse.json(
      { error: "ID de cidade inválido." },
      { status: 400 },
    );
  }

  try {
    await cidadeService.delete(id);
    return NextResponse.json(
      { message: "Cidade deletada com sucesso." },
      { status: 200 },
    );
  } catch (error: unknown) {
    if (isCidadeNotFound(error)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        { error: "Não é possível excluir uma cidade que possui endereços associados." },
        { status: 409 },
      );
    }

    console.error("Erro ao excluir cidade:", error);
    return NextResponse.json(
      { error: "Erro interno ao excluir cidade." },
      { status: 500 },
    );
  }
}