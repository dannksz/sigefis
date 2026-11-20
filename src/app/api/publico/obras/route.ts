import { NextResponse } from "next/server";
import { TransparenciaService } from "@/services/transparencia.service";

const service = new TransparenciaService();

function parseDate(value: string | null): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value < "1000-01-01") return;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value) return date;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cidadeParam = searchParams.get("cidadeId");
  const cidadeId = cidadeParam === null ? undefined : Number(cidadeParam);
  const inicioParam = searchParams.get("dataInicio");
  const fimParam = searchParams.get("dataFim");
  const dataInicio = parseDate(inicioParam);
  const dataFim = parseDate(fimParam);
  const status = searchParams.get("status")?.trim();
  if (
    (cidadeParam !== null && (!/^[1-9]\d*$/.test(cidadeParam) || Number(cidadeId) > 2147483647)) ||
    (inicioParam !== null && !dataInicio) ||
    (fimParam !== null && !dataFim) ||
    (dataInicio && dataFim && dataInicio > dataFim) ||
    (status !== undefined && (!status || status.length > 45))
  ) {
    return NextResponse.json(
      { error: "Informe município, período e status válidos." },
      { status: 400 },
    );
  }
  try {
    const busca = searchParams.get("busca")?.trim() || undefined;
    const finalidade = searchParams.get("finalidade")?.trim() || undefined;
    const pageValue = Number(searchParams.get("page") ?? "1");
    const pageSizeValue = Number(searchParams.get("pageSize") ?? "10");
    const page =
      Number.isSafeInteger(pageValue) && pageValue > 0 ? pageValue : 1;
    const pageSize =
      Number.isSafeInteger(pageSizeValue) &&
      pageSizeValue > 0 &&
      pageSizeValue <= 100
        ? pageSizeValue
        : 10;
    const result = await service.findAll({
      busca,
      finalidade,
      cidadeId,
      dataInicio,
      dataFim,
      status,
      page,
      pageSize,
    });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error: unknown) {
    console.error("Erro ao listar obras públicas:", error);
    return NextResponse.json(
      { error: "Erro interno ao listar informações públicas." },
      { status: 500 },
    );
  }
}
