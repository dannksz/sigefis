import { NextResponse } from "next/server";
import { RevisaoFiscalizacaoService } from "@/services/revisao-fiscalizacao.service";
import { parseListQuery } from "@/lib/pagination";

const service = new RevisaoFiscalizacaoService();

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Params) {
  const fiscalizacaoId = Number((await params).id);
  if (!Number.isSafeInteger(fiscalizacaoId) || fiscalizacaoId <= 0) {
    return NextResponse.json(
      { error: "ID de fiscalização inválido." },
      { status: 400 },
    );
  }
  try {
    return NextResponse.json(
      await service.findByFiscalizacao(fiscalizacaoId, parseListQuery(request)),
    );
  } catch (error: unknown) {
    console.error("Erro ao listar revisões da fiscalização:", error);
    return NextResponse.json(
      { error: "Erro interno ao listar revisões da fiscalização." },
      { status: 500 },
    );
  }
}
