import { parseListQuery } from "@/lib/pagination";
import { NextResponse } from "next/server";
import { auditRequestSuccess } from "@/lib/audit-request";
import { parseCreateProcessoRegularizacaoInput } from "@/lib/processo-regularizacao-validation";
import { ProcessoRegularizacaoService } from "@/services/processo-regularizacao.service";

const service = new ProcessoRegularizacaoService();
const referenceErrors = [
  "Bloqueio de repasse não encontrado.",
  "Usuário não encontrado.",
];

export async function GET(request: Request) {
  try {
    return NextResponse.json(await service.findAll(parseListQuery(request)));
  } catch (error: unknown) {
    console.error("Erro ao listar processos de regularização:", error);
    return NextResponse.json(
      { error: "Erro interno ao listar processos de regularização." },
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
  const input = parseCreateProcessoRegularizacaoInput(body);
  if (!input.success) {
    return NextResponse.json({ error: input.error }, { status: 400 });
  }
  try {
    const result = await service.create(input.data);
    await auditRequestSuccess(request, "CRIAR_PROCESSO_REGULARIZACAO", result.id);
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && referenceErrors.includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Erro ao criar processo de regularização:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar processo de regularização." },
      { status: 500 },
    );
  }
}
