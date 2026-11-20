import { parseListQuery } from "@/lib/pagination";
import { NextResponse } from "next/server";
import { DecisaoFinanceiraService } from "@/services/decisao-financeira.service";

const service = new DecisaoFinanceiraService();

export async function GET(request: Request) {
  try {
    return NextResponse.json(await service.findAll(parseListQuery(request)));
  } catch (error: unknown) {
    console.error("Erro ao listar decisões financeiras:", error);
    return NextResponse.json(
      { error: "Erro interno ao listar decisões financeiras." },
      { status: 500 },
    );
  }
}
