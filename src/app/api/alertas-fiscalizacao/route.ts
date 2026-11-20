import { parseListQuery } from "@/lib/pagination";
import { NextResponse } from "next/server";
import { auditRequestSuccess } from "@/lib/audit-request";
import { parseCreateAlertaFiscalizacaoInput } from "@/lib/alerta-fiscalizacao-validation";
import { AlertaFiscalizacaoService } from "@/services/alerta-fiscalizacao.service";

const service = new AlertaFiscalizacaoService();
const referenceErrors = [
  "Projeto não encontrado.",
  "Fiscalização não encontrada.",
  "A fiscalização não pertence ao projeto informado.",
];

export async function GET(request: Request) {
  try {
    return NextResponse.json(await service.findAll(parseListQuery(request)));
  } catch (error: unknown) {
    console.error("Erro ao listar alertas:", error);
    return NextResponse.json(
      { error: "Erro interno ao listar alertas." },
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
  const input = parseCreateAlertaFiscalizacaoInput(body);
  if (!input.success) return NextResponse.json({ error: input.error }, { status: 400 });
  try {
    const result = await service.create(input.data);
    await auditRequestSuccess(request, "CRIAR_ALERTA_FISCALIZACAO", result.id);
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && referenceErrors.includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Erro ao criar alerta:", error);
    return NextResponse.json({ error: "Erro interno ao criar alerta." }, { status: 500 });
  }
}
