import { parseListQuery } from "@/lib/pagination";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { parseCreatePagamentoInput } from "@/lib/pagamento-validation";
import { PagamentoService } from "@/services/pagamento.service";
import { auditSuccess } from "@/lib/audit-request";

const service = new PagamentoService();
const notFound = ["Contrato não encontrado.", "Etapa do cronograma não encontrada.", "A etapa não pertence ao projeto do contrato."];
export async function GET(request: Request) {
  try { return NextResponse.json(await service.findAll(parseListQuery(request))); }
  catch (error: unknown) { console.error("Erro ao listar pagamentos:", error); return NextResponse.json({ error: "Erro interno ao listar pagamentos." }, { status: 500 }); }
}
export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "O corpo da requisição deve ser um JSON válido." }, { status: 400 }); }
  const input = parseCreatePagamentoInput(body);
  if (!input.success) return NextResponse.json({ error: input.error }, { status: 400 });
  const usuarioId = Number(request.headers.get("x-auth-user-id"));
  if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) {
    return NextResponse.json({ error: "Usuário autenticado inválido." }, { status: 401 });
  }
  try {
    const result = await service.create(input.data, usuarioId);
    await auditSuccess({
      acao: "CRIAR_PAGAMENTO",
      pathname: "/api/pagamentos",
      usuarioId,
      ipOrigem: request.headers.get("x-auth-client-ip") || "unknown",
      registroId: result.id,
    }).catch((error: unknown) => console.error("Erro ao auditar pagamento:", error));
    return NextResponse.json(result, { status: 201 });
  }
  catch (error: unknown) {
    if (error instanceof Error && error.message === "A etapa precisa de fiscalização revisada externamente.") {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof Error && notFound.includes(error.message)) return NextResponse.json({ error: error.message }, { status: 404 });
    if (error instanceof Error && ["A nota fiscal já está cadastrada.", "O total de pagamentos excede o valor do contrato.", "O pagamento excede o recurso liberado para a etapa."].includes(error.message)) return NextResponse.json({ error: error.message }, { status: 409 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ error: "A nota fiscal já está cadastrada." }, { status: 409 });
    console.error("Erro ao criar pagamento:", error); return NextResponse.json({ error: "Erro interno ao criar pagamento." }, { status: 500 });
  }
}
