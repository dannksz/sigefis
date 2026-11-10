import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ObraFiscalService } from "@/services/obra-fiscal.service";
import { parseUpdateObraFiscalInput } from "@/lib/obra-fiscal-validation";

const service = new ObraFiscalService();
interface Params {
  params: Promise<{ id: string }>;
}

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function isNotFound(error: unknown): error is Error {
  return error instanceof Error && error.message === "Obra fiscal não encontrada.";
}

function isReferenceNotFound(error: unknown): error is Error {
  return (
    error instanceof Error &&
    ["Usuário não encontrado.", "Projeto não encontrado."].includes(
      error.message,
    )
  );
}

export async function GET(_request: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) {
    return NextResponse.json({ error: "ID de obra fiscal inválido." }, { status: 400 });
  }
  try {
    return NextResponse.json(await service.findById(id));
  } catch (error: unknown) {
    if (isNotFound(error)) return NextResponse.json({ error: error.message }, { status: 404 });
    console.error("Erro ao buscar obra fiscal:", error);
    return NextResponse.json({ error: "Erro interno ao buscar obra fiscal." }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) {
    return NextResponse.json({ error: "ID de obra fiscal inválido." }, { status: 400 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "O corpo da requisição deve ser um JSON válido." }, { status: 400 });
  }
  const input = parseUpdateObraFiscalInput(body);
  if (!input.success) return NextResponse.json({ error: input.error }, { status: 400 });
  try {
    return NextResponse.json(await service.update(id, input.data));
  } catch (error: unknown) {
    if (isNotFound(error) || isReferenceNotFound(error)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Erro ao atualizar obra fiscal:", error);
    return NextResponse.json({ error: "Erro interno ao atualizar obra fiscal." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) {
    return NextResponse.json({ error: "ID de obra fiscal inválido." }, { status: 400 });
  }
  try {
    await service.delete(id);
    return NextResponse.json({ message: "Obra fiscal excluída com sucesso." });
  } catch (error: unknown) {
    if (isNotFound(error)) return NextResponse.json({ error: error.message }, { status: 404 });
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        { error: "Não é possível excluir uma obra fiscal associada a fiscalizações." },
        { status: 409 },
      );
    }
    console.error("Erro ao excluir obra fiscal:", error);
    return NextResponse.json({ error: "Erro interno ao excluir obra fiscal." }, { status: 500 });
  }
}
