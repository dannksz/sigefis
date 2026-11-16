import { NextResponse } from "next/server";
import { parseCreateLogAuditoriaInput } from "@/lib/log-auditoria-validation";
import { LogAuditoriaService } from "@/services/log-auditoria.service";

const service = new LogAuditoriaService();

export async function GET() {
  try {
    return NextResponse.json(await service.findAll());
  } catch (error: unknown) {
    console.error("Erro ao listar logs de auditoria:", error);
    return NextResponse.json(
      { error: "Erro interno ao listar logs de auditoria." },
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
  const input = parseCreateLogAuditoriaInput(body);
  if (!input.success) return NextResponse.json({ error: input.error }, { status: 400 });
  const usuarioId = Number(request.headers.get("x-auth-user-id"));
  if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) {
    return NextResponse.json({ error: "Usuário autenticado inválido." }, { status: 401 });
  }
  const ipOrigem =
    request.headers.get("x-auth-client-ip")?.trim() || "unknown";
  try {
    return NextResponse.json(
      await service.create({ ...input.data, usuarioId, ipOrigem }),
      { status: 201 },
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Usuário não encontrado.") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Erro ao criar log de auditoria:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar log de auditoria." },
      { status: 500 },
    );
  }
}
