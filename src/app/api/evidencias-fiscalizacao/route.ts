import { parseListQuery } from "@/lib/pagination";
import { NextResponse } from "next/server";
import { parseCreateEvidenciaFiscalizacaoInput } from "@/lib/evidencia-fiscalizacao-validation";
import { EvidenciaFiscalizacaoService } from "@/services/evidencia-fiscalizacao.service";
import { auditSuccess } from "@/lib/audit-request";

const service = new EvidenciaFiscalizacaoService();

export async function GET(request: Request) {
  try {
    return NextResponse.json(await service.findAll(parseListQuery(request)));
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
    const result = await service.create(input.data);
    const usuarioId = Number(request.headers.get("x-auth-user-id"));
    if (Number.isSafeInteger(usuarioId) && usuarioId > 0) {
      await auditSuccess({
        acao: "CRIAR_EVIDENCIA",
        pathname: "/api/evidencias-fiscalizacao",
        usuarioId,
        ipOrigem: request.headers.get("x-auth-client-ip") || "unknown",
        registroId: result.id,
      }).catch((error: unknown) => console.error("Erro ao auditar evidência:", error));
    }
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Fiscalização não encontrada.") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Erro ao criar evidência:", error);
    return NextResponse.json({ error: "Erro interno ao criar evidência." }, { status: 500 });
  }
}
