import { NextResponse } from "next/server";
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
