import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { FiscalizacaoService } from "@/services/fiscalizacao.service";
import { parseUpdateFiscalizacaoInput } from "@/lib/fiscalizacao-validation";

const service = new FiscalizacaoService();
interface Params {
  params: Promise<{ id: string }>;
}

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function isNotFound(error: unknown): error is Error {
  return error instanceof Error && error.message === "Fiscalização não encontrada.";
}

function isReferenceError(error: unknown): error is Error {
  return (
    error instanceof Error &&
    [
      "Projeto não encontrado.",
      "Usuário não encontrado.",
      "Etapa do cronograma não encontrada.",
      "A etapa não pertence ao projeto informado.",
    ].includes(error.message)
  );
}

export async function GET(_request: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) {
    return NextResponse.json({ error: "ID de fiscalização inválido." }, { status: 400 });
  }
  try {
    return NextResponse.json(await service.findById(id));
  } catch (error: unknown) {
    if (isNotFound(error)) return NextResponse.json({ error: error.message }, { status: 404 });
    console.error("Erro ao buscar fiscalização:", error);
    return NextResponse.json({ error: "Erro interno ao buscar fiscalização." }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) {
    return NextResponse.json({ error: "ID de fiscalização inválido." }, { status: 400 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "O corpo da requisição deve ser um JSON válido." }, { status: 400 });
  }
  const input = parseUpdateFiscalizacaoInput(body);
  if (!input.success) return NextResponse.json({ error: input.error }, { status: 400 });
  try {
    return NextResponse.json(await service.update(id, input.data));
  } catch (error: unknown) {
    if (isNotFound(error) || isReferenceError(error)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Erro ao atualizar fiscalização:", error);
    return NextResponse.json({ error: "Erro interno ao atualizar fiscalização." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) {
    return NextResponse.json({ error: "ID de fiscalização inválido." }, { status: 400 });
  }
  try {
    await service.delete(id);
    return NextResponse.json({ message: "Fiscalização excluída com sucesso." });
  } catch (error: unknown) {
    if (isNotFound(error)) return NextResponse.json({ error: error.message }, { status: 404 });
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        { error: "Não é possível excluir uma fiscalização com alertas ou evidências associadas." },
        { status: 409 },
      );
    }
    console.error("Erro ao excluir fiscalização:", error);
    return NextResponse.json({ error: "Erro interno ao excluir fiscalização." }, { status: 500 });
  }
}
