import { NextResponse } from "next/server";
import { ProjetoVerbaService } from "@/services/projeto-verba.service";
import { parseCreateProjetoVerbaInput } from "@/lib/projeto-verba-validation";

const service = new ProjetoVerbaService();

function isReferenceNotFound(error: unknown): error is Error {
  return (
    error instanceof Error &&
    ["Projeto não encontrado.", "Verba pública não encontrada."].includes(
      error.message,
    )
  );
}

export async function GET() {
  try {
    return NextResponse.json(await service.findAll());
  } catch (error: unknown) {
    console.error("Erro ao listar vínculos projeto-verba:", error);
    return NextResponse.json({ error: "Erro interno ao listar vínculos." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "O corpo da requisição deve ser um JSON válido." }, { status: 400 });
  }
  const input = parseCreateProjetoVerbaInput(body);
  if (!input.success) return NextResponse.json({ error: input.error }, { status: 400 });
  try {
    return NextResponse.json(await service.create(input.data), { status: 201 });
  } catch (error: unknown) {
    if (isReferenceNotFound(error)) return NextResponse.json({ error: error.message }, { status: 404 });
    console.error("Erro ao criar vínculo projeto-verba:", error);
    return NextResponse.json({ error: "Erro interno ao criar vínculo." }, { status: 500 });
  }
}
