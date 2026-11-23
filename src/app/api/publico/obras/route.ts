import { NextResponse } from "next/server";
import { TransparenciaService } from "@/services/transparencia.service";

const service = new TransparenciaService();

function parseDate(value: string | null): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value < "1000-01-01") return;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value) return date;
}

function parseId(value: string | null): number | undefined {
  if (value && /^[1-9]\d*$/.test(value) && Number(value) <= 2147483647) return Number(value);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cidadeParam = searchParams.get("cidadeId");
  const estadoParam = searchParams.get("estadoId");
  const cidadeId = parseId(cidadeParam);
  const estadoId = parseId(estadoParam);
  const regiao = searchParams.get("regiao")?.trim();
  const inicioParam = searchParams.get("dataInicio");
  const fimParam = searchParams.get("dataFim");
  const dataInicio = parseDate(inicioParam);
  const dataFim = parseDate(fimParam);
  const conclusaoInicioParam = searchParams.get("conclusaoInicio");
  const conclusaoFimParam = searchParams.get("conclusaoFim");
  const conclusaoInicio = parseDate(conclusaoInicioParam);
  const conclusaoFim = parseDate(conclusaoFimParam);
  const entregaInicioParam = searchParams.get("entregaInicio");
  const entregaFimParam = searchParams.get("entregaFim");
  const entregaInicio = parseDate(entregaInicioParam);
  const entregaFim = parseDate(entregaFimParam);
  const status = searchParams.get("status")?.trim();
  const ordemParam = searchParams.get("ordem");
  if (
    (cidadeParam !== null && !cidadeId) ||
    (estadoParam !== null && !estadoId) ||
    (regiao !== undefined && (!regiao || regiao.length > 45)) ||
    (inicioParam !== null && !dataInicio) ||
    (fimParam !== null && !dataFim) ||
    (dataInicio && dataFim && dataInicio > dataFim) ||
    (conclusaoInicioParam !== null && !conclusaoInicio) ||
    (conclusaoFimParam !== null && !conclusaoFim) ||
    (conclusaoInicio && conclusaoFim && conclusaoInicio > conclusaoFim) ||
    (entregaInicioParam !== null && !entregaInicio) ||
    (entregaFimParam !== null && !entregaFim) ||
    (entregaInicio && entregaFim && entregaInicio > entregaFim) ||
    (status !== undefined && (!status || status.length > 45)) ||
    (ordemParam !== null && ordemParam !== "antiga" && ordemParam !== "recente")
  ) {
    return NextResponse.json(
      { error: "Informe localização, datas e status válidos." },
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
      regiao,
      estadoId,
      cidadeId,
      dataInicio,
      dataFim,
      conclusaoInicio,
      conclusaoFim,
      entregaInicio,
      entregaFim,
      status,
      ordem: ordemParam === "recente" ? "recente" : "antiga",
      buscaDetalhada: true,
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
