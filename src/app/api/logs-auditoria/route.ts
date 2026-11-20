import { parseListQuery } from "@/lib/pagination";
import { NextResponse } from "next/server";
import { LogAuditoriaService } from "@/services/log-auditoria.service";
import { logAuditoriaCategorias } from "@/types/log-auditoria";

const service = new LogAuditoriaService();

export async function GET(request: Request) {
  const categorias = new URL(request.url).searchParams.getAll("categoria");
  const categoria = logAuditoriaCategorias.find((value) => value === categorias[0]);
  if (categorias.length > 1 || (categorias.length === 1 && !categoria)) {
    return NextResponse.json(
      { error: "Informe uma única categoria válida.", categoriasPermitidas: logAuditoriaCategorias },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(await service.findAll(parseListQuery(request), categoria));
  } catch (error: unknown) {
    console.error("Erro ao listar logs de auditoria:", error);
    return NextResponse.json(
      { error: "Erro interno ao listar logs de auditoria." },
      { status: 500 },
    );
  }
}
