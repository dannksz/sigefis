import { NextResponse } from "next/server";
import { DecisaoFinanceiraService } from "@/services/decisao-financeira.service";

const service = new DecisaoFinanceiraService();

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return NextResponse.json(
      { error: "ID de decisão financeira inválido." },
      { status: 400 },
    );
  }
  try {
    return NextResponse.json(await service.findById(id));
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Decisão financeira não encontrada.") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Erro ao buscar decisão financeira:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar decisão financeira." },
      { status: 500 },
    );
  }
}
