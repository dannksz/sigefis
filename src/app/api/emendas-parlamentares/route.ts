import { NextResponse } from "next/server";
import { EmendaParlamentarService } from "@/services/emenda-parlamentar.service";
import { parseCreateEmendaParlamentarInput } from "@/lib/emenda-parlamentar-validation";

const service = new EmendaParlamentarService();

function isVerbaNotFound(error: unknown): error is Error {
  return error instanceof Error && error.message === "Verba pública não encontrada.";
}

export async function GET() {
  try {
    return NextResponse.json(await service.findAll(), { status: 200 });
  } catch (error: unknown) {
    console.error("Erro ao listar emendas parlamentares:", error);
    return NextResponse.json(
      { error: "Erro interno ao listar emendas parlamentares." },
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
  const input = parseCreateEmendaParlamentarInput(body);
  if (!input.success) return NextResponse.json({ error: input.error }, { status: 400 });

  try {
    return NextResponse.json(await service.create(input.data), { status: 201 });
  } catch (error: unknown) {
    if (isVerbaNotFound(error)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Erro ao criar emenda parlamentar:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar emenda parlamentar." },
      { status: 500 },
    );
  }
}
