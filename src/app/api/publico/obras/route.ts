import { NextResponse } from "next/server";
import { TransparenciaService } from "@/services/transparencia.service";

const service = new TransparenciaService();

export async function GET() {
  try {
    return NextResponse.json(await service.findAll());
  } catch (error: unknown) {
    console.error("Erro ao listar obras públicas:", error);
    return NextResponse.json(
      { error: "Erro interno ao listar informações públicas." },
      { status: 500 },
    );
  }
}
