import { snapshotAuditWork } from "@/lib/audit-work";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { auditRequestSuccess } from "@/lib/audit-request";
import { parseUpdateRevisaoFiscalizacaoInput } from "@/lib/revisao-fiscalizacao-validation";
import { REVISAO_OUTRO_AUTOR, RevisaoFiscalizacaoService } from "@/services/revisao-fiscalizacao.service";

const service = new RevisaoFiscalizacaoService();
interface Params { params: Promise<{ id: string }> }

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function GET(_request: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "ID de revisão inválido." }, { status: 400 });
  try {
    return NextResponse.json(await service.findById(id));
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Revisão de fiscalização não encontrada.") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Erro ao buscar revisão:", error);
    return NextResponse.json({ error: "Erro interno ao buscar revisão." }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "ID de revisão inválido." }, { status: 400 });
  const usuarioId = Number(request.headers.get("x-auth-user-id"));
  if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) {
    return NextResponse.json({ error: "Usuário autenticado inválido." }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "O corpo da requisição deve ser um JSON válido." }, { status: 400 });
  }
  const input = parseUpdateRevisaoFiscalizacaoInput(body);
  if (!input.success) return NextResponse.json({ error: input.error }, { status: 400 });
  try {
    const result = await service.update(id, input.data, usuarioId);
    await auditRequestSuccess(request, "ATUALIZAR_REVISAO_FISCALIZACAO", result.id ?? id);
    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === REVISAO_OUTRO_AUTOR) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof Error && error.message === "Revisão de fiscalização não encontrada.") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Erro ao atualizar revisão:", error);
    return NextResponse.json({ error: "Erro interno ao atualizar revisão." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "ID de revisão inválido." }, { status: 400 });
  try {
    const work = await snapshotAuditWork("revisao_fiscalizacao", id);
    await service.delete(id);
    await auditRequestSuccess(_request, "EXCLUIR_REVISAO_FISCALIZACAO", id, work);
    return NextResponse.json({ message: "Revisão excluída com sucesso." });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Revisão de fiscalização não encontrada.") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json({ error: "Não é possível excluir esta revisão." }, { status: 409 });
    }
    console.error("Erro ao excluir revisão:", error);
    return NextResponse.json({ error: "Erro interno ao excluir revisão." }, { status: 500 });
  }
}
