import { NextResponse } from "next/server";
import { ObraFiscalService } from "@/services/obra-fiscal.service";

const service = new ObraFiscalService();

export async function GET(request: Request) {
  const role = request.headers.get("x-auth-role");
  if (role !== "ADMIN" && role !== "GESTOR") {
    return NextResponse.json({ error: "Sem permissão para consultar fiscais disponíveis." }, { status: 403 });
  }
  try {
    return NextResponse.json(await service.listFiscalOptions());
  } catch (error) {
    console.error("Erro ao consultar fiscais disponíveis:", error);
    return NextResponse.json({ error: "Não foi possível consultar os fiscais." }, { status: 500 });
  }
}
