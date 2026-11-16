import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { parseUpdateAlertaFiscalizacaoInput } from "@/lib/alerta-fiscalizacao-validation";
import { AlertaFiscalizacaoService } from "@/services/alerta-fiscalizacao.service";

const service = new AlertaFiscalizacaoService();
const referenceErrors = [
  "Alerta de fiscalização não encontrado.",
  "Projeto não encontrado.",
  "Fiscalização não encontrada.",
  "A fiscalização não pertence ao projeto informado.",
];

interface Params {
  params: Promise<{ id: string }>;
}

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function isReferenceError(error: unknown): error is Error {
  return error instanceof Error && referenceErrors.includes(error.message);
}

export async function GET(_request: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "ID de alerta inválido." }, { status: 400 });
  try {
    return NextResponse.json(await service.findById(id));
  } catch (error: unknown) {
    if (isReferenceError(error)) return NextResponse.json({ error: error.message }, { status: 404 });
    console.error("Erro ao buscar alerta:", error);
    return NextResponse.json({ error: "Erro interno ao buscar alerta." }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "ID de alerta inválido." }, { status: 400 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "O corpo da requisição deve ser um JSON válido." }, { status: 400 });
  }
  const input = parseUpdateAlertaFiscalizacaoInput(body);
  if (!input.success) return NextResponse.json({ error: input.error }, { status: 400 });
  try {
    return NextResponse.json(await service.update(id, input.data));
  } catch (error: unknown) {
    if (isReferenceError(error)) return NextResponse.json({ error: error.message }, { status: 404 });
    console.error("Erro ao atualizar alerta:", error);
    return NextResponse.json({ error: "Erro interno ao atualizar alerta." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "ID de alerta inválido." }, { status: 400 });
  try {
    await service.delete(id);
    return NextResponse.json({ message: "Alerta excluído com sucesso." });
  } catch (error: unknown) {
    if (isReferenceError(error)) return NextResponse.json({ error: error.message }, { status: 404 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json(
        { error: "Não é possível excluir um alerta com bloqueios associados." },
        { status: 409 },
      );
    }
    console.error("Erro ao excluir alerta:", error);
    return NextResponse.json({ error: "Erro interno ao excluir alerta." }, { status: 500 });
  }
}
