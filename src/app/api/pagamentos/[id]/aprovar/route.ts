import { NextResponse } from "next/server";
import { PagamentoService } from "@/services/pagamento.service";

const service = new PagamentoService();

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: Params) {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return NextResponse.json({ error: "ID de pagamento inválido." }, { status: 400 });
  }
  const aprovadoPorUsuarioId = Number(_request.headers.get("x-auth-user-id"));
  if (!Number.isSafeInteger(aprovadoPorUsuarioId) || aprovadoPorUsuarioId <= 0) {
    return NextResponse.json({ error: "Usuário autenticado inválido." }, { status: 401 });
  }
  try {
    return NextResponse.json(
      await service.approve(id, aprovadoPorUsuarioId),
    );
  } catch (error: unknown) {
    if (error instanceof Error && [
      "Pagamento não encontrado.",
      "Quem criou o pagamento não pode aprová-lo.",
      "O pagamento não está pendente.",
    ].includes(error.message)) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "Pagamento não encontrado." ? 404 : 409 },
      );
    }
    console.error("Erro ao aprovar pagamento:", error);
    return NextResponse.json(
      { error: "Erro interno ao aprovar pagamento." },
      { status: 500 },
    );
  }
}
