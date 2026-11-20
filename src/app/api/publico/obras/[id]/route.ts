import { NextResponse } from "next/server";
import { TransparenciaService } from "@/services/transparencia.service";

const service = new TransparenciaService();

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return NextResponse.json(
      { error: "ID de obra inválido." },
      { status: 400 },
    );
  }
  try {
    const obra = await service.findById(id);
    return NextResponse.json(obra, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Obra pública não encontrada.") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Erro ao buscar obra pública:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar informações públicas." },
      { status: 500 },
    );
  }
}
