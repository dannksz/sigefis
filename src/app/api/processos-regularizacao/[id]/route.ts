import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { auditRequestSuccess } from "@/lib/audit-request";
import { parseUpdateProcessoRegularizacaoInput } from "@/lib/processo-regularizacao-validation";
import { ProcessoRegularizacaoService } from "@/services/processo-regularizacao.service";

const service = new ProcessoRegularizacaoService();
const referenceErrors = [
  "Processo de regularização não encontrado.",
  "Bloqueio de repasse não encontrado.",
  "Usuário não encontrado.",
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
  if (id === null) {
    return NextResponse.json(
      { error: "ID de processo de regularização inválido." },
      { status: 400 },
    );
  }
  try {
    return NextResponse.json(await service.findById(id));
  } catch (error: unknown) {
    if (isReferenceError(error)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Erro ao buscar processo de regularização:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar processo de regularização." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) {
    return NextResponse.json(
      { error: "ID de processo de regularização inválido." },
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
  const input = parseUpdateProcessoRegularizacaoInput(body);
  if (!input.success) {
    return NextResponse.json({ error: input.error }, { status: 400 });
  }
  try {
    const result = await service.update(id, input.data);
    await auditRequestSuccess(request, "ATUALIZAR_PROCESSO_REGULARIZACAO", result.id ?? id);
    return NextResponse.json(result);
  } catch (error: unknown) {
    if (isReferenceError(error)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Erro ao atualizar processo de regularização:", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar processo de regularização." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) {
    return NextResponse.json(
      { error: "ID de processo de regularização inválido." },
      { status: 400 },
    );
  }
  try {
    await service.delete(id);
    await auditRequestSuccess(_request, "EXCLUIR_PROCESSO_REGULARIZACAO", id);
    return NextResponse.json({
      message: "Processo de regularização excluído com sucesso.",
    });
  } catch (error: unknown) {
    if (isReferenceError(error)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        { error: "Não é possível excluir este processo de regularização por causa de vínculos associados." },
        { status: 409 },
      );
    }
    console.error("Erro ao excluir processo de regularização:", error);
    return NextResponse.json(
      { error: "Erro interno ao excluir processo de regularização." },
      { status: 500 },
    );
  }
}
