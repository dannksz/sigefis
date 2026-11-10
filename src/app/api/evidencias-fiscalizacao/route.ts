import { NextResponse } from "next/server";
import { parseCreateEvidenciaFiscalizacaoInput } from "@/lib/evidencia-fiscalizacao-validation";
import { EvidenciaFiscalizacaoService } from "@/services/evidencia-fiscalizacao.service";

const service = new EvidenciaFiscalizacaoService();

export async function GET() {
  try {
    return NextResponse.json(await service.findAll());
  } catch (error: unknown) {
    console.error("Erro ao listar evidências:", error);
    return NextResponse.json(
      { error: "Erro interno ao listar evidências." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "O corpo da requisição deve ser um JSON válido." },
      { status: 400 },
    );
  }
  const input = parseCreateEvidenciaFiscalizacaoInput(body);
  if (!input.success) return NextResponse.json({ error: input.error }, { status: 400 });
  try {
    return NextResponse.json(await service.create(input.data), { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Fiscalização não encontrada.") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Erro ao criar evidência:", error);
    return NextResponse.json({ error: "Erro interno ao criar evidência." }, { status: 500 });
  }
}
