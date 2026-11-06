import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { VerbaPublicaService } from "@/services/verba-publica.service";
import { parseUpdateVerbaPublicaInput } from "@/lib/verba-publica-validation";

const verbaPublicaService = new VerbaPublicaService();

interface Params {
  params: Promise<{ id: string }>;
}

function parseVerbaId(value: string): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function isVerbaNotFound(error: unknown): error is Error {
  return error instanceof Error && error.message === "Verba pública não encontrada.";
}

function isOrgaoNotFound(error: unknown): error is Error {
  return error instanceof Error && error.message === "Órgão público não encontrado.";
}

export async function GET(_request: Request, { params }: Params) {
  const id = parseVerbaId((await params).id);
  if (id === null) {
    return NextResponse.json({ error: "ID de verba pública inválido." }, { status: 400 });
  }

  try {
    return NextResponse.json(await verbaPublicaService.findById(id), { status: 200 });
  } catch (error: unknown) {
    if (isVerbaNotFound(error)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Erro ao buscar verba pública:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar verba pública." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, { params }: Params) {
  const id = parseVerbaId((await params).id);
  if (id === null) {
    return NextResponse.json({ error: "ID de verba pública inválido." }, { status: 400 });
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

  const input = parseUpdateVerbaPublicaInput(body);
  if (!input.success) {
    return NextResponse.json({ error: input.error }, { status: 400 });
  }

  try {
    return NextResponse.json(
      await verbaPublicaService.update(id, input.data),
      { status: 200 },
    );
  } catch (error: unknown) {
    if (isVerbaNotFound(error) || isOrgaoNotFound(error)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Erro ao atualizar verba pública:", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar verba pública." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const id = parseVerbaId((await params).id);
  if (id === null) {
    return NextResponse.json({ error: "ID de verba pública inválido." }, { status: 400 });
  }

  try {
    await verbaPublicaService.delete(id);
    return NextResponse.json(
      { message: "Verba pública excluída com sucesso." },
      { status: 200 },
    );
  } catch (error: unknown) {
    if (isVerbaNotFound(error)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        {
          error:
            "Não é possível excluir uma verba pública que possui contratos, emendas, liberações ou projetos associados.",
        },
        { status: 409 },
      );
    }
    console.error("Erro ao excluir verba pública:", error);
    return NextResponse.json(
      { error: "Erro interno ao excluir verba pública." },
      { status: 500 },
    );
  }
}
