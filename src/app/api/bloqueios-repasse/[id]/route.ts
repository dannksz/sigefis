import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { auditRequestSuccess } from "@/lib/audit-request";
import { parseUpdateBloqueioRepasseInput } from "@/lib/bloqueio-repasse-validation";
import { BloqueioRepasseService } from "@/services/bloqueio-repasse.service";

const service = new BloqueioRepasseService();
const referenceErrors = [
  "Bloqueio de repasse não encontrado.",
  "Projeto não encontrado.",
  "Alerta de fiscalização não encontrado.",
  "O alerta não pertence ao projeto informado.",
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
  if (id === null) return NextResponse.json({ error: "ID de bloqueio inválido." }, { status: 400 });
  try {
    return NextResponse.json(await service.findById(id));
  } catch (error: unknown) {
    if (isReferenceError(error)) return NextResponse.json({ error: error.message }, { status: 404 });
    console.error("Erro ao buscar bloqueio:", error);
    return NextResponse.json({ error: "Erro interno ao buscar bloqueio." }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "ID de bloqueio inválido." }, { status: 400 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "O corpo da requisição deve ser um JSON válido." }, { status: 400 });
  }
  const input = parseUpdateBloqueioRepasseInput(body);
  if (!input.success) return NextResponse.json({ error: input.error }, { status: 400 });
  try {
    const result = await service.update(id, input.data);
    await auditRequestSuccess(request, "ATUALIZAR_BLOQUEIO_REPASSE", result.id ?? id);
    return NextResponse.json(result);
  } catch (error: unknown) {
    if (isReferenceError(error)) return NextResponse.json({ error: error.message }, { status: 404 });
    console.error("Erro ao atualizar bloqueio:", error);
    return NextResponse.json({ error: "Erro interno ao atualizar bloqueio." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "ID de bloqueio inválido." }, { status: 400 });
  try {
    await service.delete(id);
    await auditRequestSuccess(_request, "EXCLUIR_BLOQUEIO_REPASSE", id);
    return NextResponse.json({ message: "Bloqueio excluído com sucesso." });
  } catch (error: unknown) {
    if (isReferenceError(error)) return NextResponse.json({ error: error.message }, { status: 404 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json(
        { error: "Não é possível excluir um bloqueio com processos de regularização associados." },
        { status: 409 },
      );
    }
    console.error("Erro ao excluir bloqueio:", error);
    return NextResponse.json({ error: "Erro interno ao excluir bloqueio." }, { status: 500 });
  }
}
