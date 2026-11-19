import { NextResponse } from "next/server";
import { LiberacaoRecursoService } from "@/services/liberacao-recurso.service";
import { auditSuccess } from "@/lib/audit-request";

const service = new LiberacaoRecursoService();

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Params) {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return NextResponse.json({ error: "ID de liberação inválido." }, { status: 400 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "O corpo da requisição deve ser um JSON válido." }, { status: 400 });
  }
  if (
    typeof body !== "object" ||
    body === null ||
    !("justificativa" in body) ||
    typeof body.justificativa !== "string" ||
    body.justificativa.trim().length === 0 ||
    body.justificativa.trim().length > 65535
  ) {
    return NextResponse.json({ error: "Justificativa da rejeição inválida." }, { status: 400 });
  }
  const usuarioId = Number(request.headers.get("x-auth-user-id"));
  if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) {
    return NextResponse.json({ error: "Usuário autenticado inválido." }, { status: 401 });
  }
  try {
    const result = await service.reject(id, usuarioId, body.justificativa.trim());
    await auditSuccess({
      acao: "REJEITAR_LIBERACAO",
      pathname: `/api/liberacoes-recursos/${id}/rejeitar`,
      usuarioId,
      ipOrigem: request.headers.get("x-auth-client-ip") || "unknown",
      registroId: id,
      detalhes: { justificativa: body.justificativa.trim() },
    }).catch((error: unknown) => console.error("Erro ao auditar rejeição:", error));
    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Liberação de recurso não encontrada.") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if ([
        "A liberação não está pendente.",
        "Quem criou a liberação não pode rejeitá-la.",
      ].includes(error.message)) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }
    console.error("Erro ao rejeitar liberação:", error);
    return NextResponse.json({ error: "Erro interno ao rejeitar liberação." }, { status: 500 });
  }
}
