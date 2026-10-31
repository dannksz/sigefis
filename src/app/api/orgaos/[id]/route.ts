import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { OrgaoPublicoService } from "@/services/orgao-publico.service";
import { parseUpdateOrgaoPublicoInput } from "@/lib/orgao-publico-validation";

const orgaoPublicoService = new OrgaoPublicoService();

interface Params {
  params: Promise<{
    id: string;
  }>;
}

function parseOrgaoPublicoId(value: string): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function isOrgaoPublicoNotFound(error: unknown): error is Error {
  return (
    error instanceof Error &&
    error.message === "Órgão público não encontrado."
  );
}

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

export async function GET(_request: Request, { params }: Params) {
  const { id: rawId } = await params;
  const id = parseOrgaoPublicoId(rawId);

  if (id === null) {
    return NextResponse.json(
      { error: "ID de órgão público inválido." },
      { status: 400 },
    );
  }

  try {
    const orgaoPublico = await orgaoPublicoService.findById(id);
    return NextResponse.json(orgaoPublico, { status: 200 });
  } catch (error: unknown) {
    if (isOrgaoPublicoNotFound(error)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error("Erro ao buscar órgão público:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar órgão público." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, { params }: Params) {
  const { id: rawId } = await params;
  const id = parseOrgaoPublicoId(rawId);

  if (id === null) {
    return NextResponse.json(
      { error: "ID de órgão público inválido." },
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

  const input = parseUpdateOrgaoPublicoInput(body);
  if (!input.success) {
    return NextResponse.json({ error: input.error }, { status: 400 });
  }

  try {
    const orgaoPublico = await orgaoPublicoService.update(id, input.data);
    return NextResponse.json(orgaoPublico, { status: 200 });
  } catch (error: unknown) {
    if (isOrgaoPublicoNotFound(error)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (isEnderecoNotFound(error) || isForeignKeyConstraintError(error)) {
      return NextResponse.json(
        { error: "Endereço não encontrado." },
        { status: 404 },
      );
    }

    console.error("Erro ao atualizar órgão público:", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar órgão público." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id: rawId } = await params;
  const id = parseOrgaoPublicoId(rawId);

  if (id === null) {
    return NextResponse.json(
      { error: "ID de órgão público inválido." },
      { status: 400 },
    );
  }

  try {
    await orgaoPublicoService.delete(id);
    return NextResponse.json(
      { message: "Órgão público excluído com sucesso." },
      { status: 200 },
    );
  } catch (error: unknown) {
    if (isOrgaoPublicoNotFound(error)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (isForeignKeyConstraintError(error)) {
      return NextResponse.json(
        {
          error:
            "Não é possível excluir um órgão público que possui verbas ou contas bancárias associadas.",
        },
        { status: 409 },
      );
    }

    console.error("Erro ao excluir órgão público:", error);
    return NextResponse.json(
      { error: "Erro interno ao excluir órgão público." },
      { status: 500 },
    );
  }
}
