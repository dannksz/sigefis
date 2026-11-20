import { parseListQuery } from "@/lib/pagination";
import { NextResponse } from "next/server";
import { parseCreateContaBancariaInput } from "@/lib/conta-bancaria-validation";
import { ContaBancariaService } from "@/services/conta-bancaria.service";
import {
  getResponseRole,
  sanitizeContaBancariaList,
} from "@/lib/response-sanitizer";

const service = new ContaBancariaService();
const referenceErrors = [
  "Órgão público não encontrado.",
  "Projeto não encontrado.",
];

export async function GET(request: Request) {
  try {
    const items = await service.findAll(parseListQuery(request));
    return NextResponse.json(
      { ...items, data: sanitizeContaBancariaList(items.data, getResponseRole(request)) },
    );
  } catch (error: unknown) {
    console.error("Erro ao listar contas bancárias:", error);
    return NextResponse.json(
      { error: "Erro interno ao listar contas bancárias." },
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

  const input = parseCreateContaBancariaInput(body);
  if (!input.success) {
    return NextResponse.json({ error: input.error }, { status: 400 });
  }

  try {
    return NextResponse.json(await service.create(input.data), { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && referenceErrors.includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Erro ao criar conta bancária:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar conta bancária." },
      { status: 500 },
    );
  }
}
