import { NextResponse } from "next/server";
import { LogAuditoriaService } from "@/services/log-auditoria.service";

const service = new LogAuditoriaService();
interface Params {
  params: Promise<{ id: string }>;
}

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function GET(_request: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) {
    return NextResponse.json({ error: "ID de log inválido." }, { status: 400 });
  }
  try {
    return NextResponse.json(await service.findById(id));
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Log de auditoria não encontrado.") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Erro ao buscar log de auditoria:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar log de auditoria." },
      { status: 500 },
    );
  }
}
