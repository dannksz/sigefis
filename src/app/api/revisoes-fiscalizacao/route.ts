import { parseListQuery } from "@/lib/pagination";
import { NextResponse } from "next/server";
import { parseCreateRevisaoFiscalizacaoInput } from "@/lib/revisao-fiscalizacao-validation";
import { RevisaoFiscalizacaoService } from "@/services/revisao-fiscalizacao.service";
import { auditSuccess } from "@/lib/audit-request";

const service = new RevisaoFiscalizacaoService();

export async function GET(request: Request) {
  try {
    return NextResponse.json(await service.findAll(parseListQuery(request)));
  } catch (error: unknown) {
    console.error("Erro ao listar revisões:", error);
    return NextResponse.json({ error: "Erro interno ao listar revisões." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "O corpo da requisição deve ser um JSON válido." }, { status: 400 });
  }
  const input = parseCreateRevisaoFiscalizacaoInput(body);
  if (!input.success) return NextResponse.json({ error: input.error }, { status: 400 });
  const usuarioId = Number(request.headers.get("x-auth-user-id"));
  if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) {
    return NextResponse.json({ error: "Usuário autenticado inválido." }, { status: 401 });
  }
  if (input.data.fiscalExternoId !== usuarioId) {
    return NextResponse.json({ error: "Somente o fiscal autenticado pode assinar a revisão." }, { status: 403 });
  }
  try {
    const result = await service.create(input.data);
    await auditSuccess({
      acao: "CRIAR_REVISAO_FISCALIZACAO",
      pathname: "/api/revisoes-fiscalizacao",
      usuarioId,
      ipOrigem: request.headers.get("x-auth-client-ip") || "unknown",
      registroId: result.id,
      detalhes: { fiscalizacaoId: result.fiscalizacaoId, statusRevisao: result.statusRevisao },
    }).catch((error: unknown) => console.error("Erro ao auditar revisão:", error));
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && [
      "Fiscalização não encontrada.",
      "O fiscal não pode revisar a própria fiscalização.",
      "Fiscal externo não encontrado.",
      "Usuário informado não possui o papel FISCAL.",
      "O fiscal externo não está designado para esta obra.",
    ].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Erro ao criar revisão:", error);
    return NextResponse.json({ error: "Erro interno ao criar revisão." }, { status: 500 });
  }
}
