import { parseListQuery } from "@/lib/pagination";
import { NextResponse } from "next/server";
import { parseCreateBloqueioRepasseInput } from "@/lib/bloqueio-repasse-validation";
import { BloqueioRepasseService } from "@/services/bloqueio-repasse.service";

const service = new BloqueioRepasseService();
const referenceErrors = [
  "Projeto não encontrado.",
  "Alerta de fiscalização não encontrado.",
  "O alerta não pertence ao projeto informado.",
];

export async function GET(request: Request) {
  try {
    return NextResponse.json(await service.findAll(parseListQuery(request)));
  } catch (error: unknown) {
    console.error("Erro ao listar bloqueios:", error);
    return NextResponse.json(
      { error: "Erro interno ao listar bloqueios." },
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
  const input = parseCreateBloqueioRepasseInput(body);
  if (!input.success) return NextResponse.json({ error: input.error }, { status: 400 });
  try {
    return NextResponse.json(await service.create(input.data), { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && referenceErrors.includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Erro ao criar bloqueio:", error);
    return NextResponse.json({ error: "Erro interno ao criar bloqueio." }, { status: 500 });
  }
}
