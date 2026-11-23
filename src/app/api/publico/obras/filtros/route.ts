import { connection, NextResponse } from "next/server";
import { TransparenciaService } from "@/services/transparencia.service";

const service = new TransparenciaService();

function parseId(value: string | null) {
  return value && /^[1-9]\d*$/.test(value) ? Number(value) : undefined;
}

export async function GET(request: Request) {
  await connection();
  try {
    const params = new URL(request.url).searchParams;
    const entrega = params.get("entrega") || undefined;
    return NextResponse.json(await service.listFilterOptions({
      busca: params.get("busca")?.trim() || undefined,
      buscaDetalhada: true,
      regiao: params.get("regiao")?.trim() || undefined,
      estadoId: parseId(params.get("estadoId")),
      cidadeId: parseId(params.get("cidadeId")),
      finalidade: params.get("finalidade")?.trim() || undefined,
      status: params.get("status")?.trim() || undefined,
      ...(entrega && /^\d{4}-\d{2}-\d{2}$/.test(entrega) && {
        entregaInicio: new Date(`${entrega}T00:00:00.000Z`),
        entregaFim: new Date(`${entrega}T00:00:00.000Z`),
      }),
    }), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error: unknown) {
    console.error("Erro ao listar filtros de obras públicas:", error);
    return NextResponse.json({ error: "Erro interno ao listar filtros." }, { status: 500 });
  }
}
