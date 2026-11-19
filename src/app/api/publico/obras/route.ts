import { NextResponse } from "next/server";
import { TransparenciaService } from "@/services/transparencia.service";

const service = new TransparenciaService();

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const busca = url.searchParams.get("busca")?.trim() || undefined;
    const finalidade = url.searchParams.get("finalidade")?.trim() || undefined;
    const pageValue = Number(url.searchParams.get("page") ?? "1");
    const pageSizeValue = Number(url.searchParams.get("pageSize") ?? "10");
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
      page,
      pageSize,
    });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (error: unknown) {
    console.error("Erro ao listar obras públicas:", error);
    return NextResponse.json(
      { error: "Erro interno ao listar informações públicas." },
      { status: 500 },
    );
  }
}
