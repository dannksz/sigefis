import { parseListQuery } from "@/lib/pagination";
import { connection, NextResponse } from "next/server";
import { EvidenciaFiscalizacaoService } from "@/services/evidencia-fiscalizacao.service";

const service = new EvidenciaFiscalizacaoService();

export async function GET(request: Request) {
  await connection();
  try {
    return NextResponse.json(await service.findAll(parseListQuery(request)));
  } catch (error: unknown) {
    console.error("Erro ao listar evidências:", error);
    return NextResponse.json(
      { error: "Erro interno ao listar evidências." },
      { status: 500 },
    );
  }
}
