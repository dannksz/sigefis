import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ContratoService } from "@/services/contrato.service";
import { parseUpdateContratoInput } from "@/lib/contrato-validation";

const contratoService = new ContratoService();

interface Params {
  params: Promise<{ id: string }>;
}

function parseContratoId(value: string): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function isContratoNotFound(error: unknown): error is Error {
  return error instanceof Error && error.message === "Contrato não encontrado.";
}

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

function isDateOrderError(error: unknown): error is Error {
  return (
    error instanceof Error &&
    error.message === "A data de início não pode ser posterior à data de fim."
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

export async function GET(_request: Request, { params }: Params) {
  const { id: rawId } = await params;
  const id = parseContratoId(rawId);
  if (id === null) {
    return NextResponse.json({ error: "ID de contrato inválido." }, { status: 400 });
  }

  try {
    return NextResponse.json(await contratoService.findById(id), { status: 200 });
  } catch (error: unknown) {
    if (isContratoNotFound(error)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Erro ao buscar contrato:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar contrato." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, { params }: Params) {
  const { id: rawId } = await params;
  const id = parseContratoId(rawId);
  if (id === null) {
    return NextResponse.json({ error: "ID de contrato inválido." }, { status: 400 });
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

  const input = parseUpdateContratoInput(body);
  if (!input.success) {
    return NextResponse.json({ error: input.error }, { status: 400 });
  }

  try {
    return NextResponse.json(
      await contratoService.update(id, input.data),
      { status: 200 },
    );
  } catch (error: unknown) {
    if (
      isContratoNotFound(error) ||
      isReferenceNotFound(error) ||
      isDateOrderError(error)
    ) {
      const status = isDateOrderError(error) ? 400 : 404;
      return NextResponse.json({ error: error.message }, { status });
    }
    if (isForeignKeyConstraintError(error)) {
      return NextResponse.json(
        { error: "Referência relacionada não encontrada." },
        { status: 404 },
      );
    }
    console.error("Erro ao atualizar contrato:", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar contrato." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id: rawId } = await params;
  const id = parseContratoId(rawId);
  if (id === null) {
    return NextResponse.json({ error: "ID de contrato inválido." }, { status: 400 });
  }

  try {
    await contratoService.delete(id);
    return NextResponse.json(
      { message: "Contrato excluído com sucesso." },
      { status: 200 },
    );
  } catch (error: unknown) {
    if (isContratoNotFound(error)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        { error: "Não é possível excluir um contrato que possui pagamentos associados." },
        { status: 409 },
      );
    }
    console.error("Erro ao excluir contrato:", error);
    return NextResponse.json(
      { error: "Erro interno ao excluir contrato." },
      { status: 500 },
    );
  }
}
