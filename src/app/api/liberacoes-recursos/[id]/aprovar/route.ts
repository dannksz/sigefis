import { NextResponse } from "next/server";
import { LiberacaoRecursoService } from "@/services/liberacao-recurso.service";

const service = new LiberacaoRecursoService();

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Params) {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return NextResponse.json({ error: "ID de liberação inválido." }, { status: 400 });
  }
  const aprovadoPorUsuarioId = Number(request.headers.get("x-auth-user-id"));
  if (!Number.isSafeInteger(aprovadoPorUsuarioId) || aprovadoPorUsuarioId <= 0) {
    return NextResponse.json({ error: "Usuário autenticado inválido." }, { status: 401 });
  }
  try {
    return NextResponse.json(
      await service.approve(id, aprovadoPorUsuarioId),
    );
  } catch (error: unknown) {
    if (error instanceof Error && [
      "Liberação de recurso não encontrada.",
      "Quem criou a liberação não pode aprová-la.",
      "A liberação não está pendente.",
    ].includes(error.message)) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "Liberação de recurso não encontrada." ? 404 : 409 },
      );
    }
    console.error("Erro ao aprovar liberação:", error);
    return NextResponse.json(
      { error: "Erro interno ao aprovar liberação." },
      { status: 500 },
    );
  }
}
