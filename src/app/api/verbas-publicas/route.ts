import { NextResponse } from "next/server";
import { VerbaPublicaService } from "@/services/verba-publica.service";
import { parseCreateVerbaPublicaInput } from "@/lib/verba-publica-validation";

const verbaPublicaService = new VerbaPublicaService();

function isOrgaoNotFound(error: unknown): error is Error {
  return error instanceof Error && error.message === "Órgão público não encontrado.";
}

export async function GET() {
  try {
    return NextResponse.json(await verbaPublicaService.findAll(), { status: 200 });
  } catch (error: unknown) {
    console.error("Erro ao listar verbas públicas:", error);
    return NextResponse.json(
      { error: "Erro interno ao listar verbas públicas." },
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

  const input = parseCreateVerbaPublicaInput(body);
  if (!input.success) {
    return NextResponse.json({ error: input.error }, { status: 400 });
  }

  try {
    return NextResponse.json(
      await verbaPublicaService.create(input.data),
      { status: 201 },
    );
  } catch (error: unknown) {
    if (isOrgaoNotFound(error)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Erro ao criar verba pública:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar verba pública." },
      { status: 500 },
    );
  }
}
