import { NextResponse } from "next/server";
import { parseCreateRevisaoFiscalizacaoInput } from "@/lib/revisao-fiscalizacao-validation";
import { RevisaoFiscalizacaoService } from "@/services/revisao-fiscalizacao.service";

const service = new RevisaoFiscalizacaoService();

export async function GET() {
  try {
    return NextResponse.json(await service.findAll());
  } catch (error: unknown) {
    console.error("Erro ao listar revisões:", error);
    return NextResponse.json({ error: "Erro interno ao listar revisões." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "O corpo da requisição deve ser um JSON válido." }, { status: 400 });
  }
  const input = parseCreateRevisaoFiscalizacaoInput(body);
  if (!input.success) return NextResponse.json({ error: input.error }, { status: 400 });
  try {
    return NextResponse.json(await service.create(input.data), { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && [
      "Fiscalização não encontrada.",
      "O fiscal não pode revisar a própria fiscalização.",
      "Fiscal externo não encontrado.",
      "Usuário informado não possui o papel FISCAL.",
      "O fiscal externo não está designado para esta obra.",
    ].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Erro ao criar revisão:", error);
    return NextResponse.json({ error: "Erro interno ao criar revisão." }, { status: 500 });
  }
}
