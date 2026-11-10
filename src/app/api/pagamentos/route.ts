import { NextResponse } from "next/server";
import { parseCreatePagamentoInput } from "@/lib/pagamento-validation";
import { PagamentoService } from "@/services/pagamento.service";

const service = new PagamentoService();
const notFound = ["Contrato não encontrado.", "Etapa do cronograma não encontrada.", "A etapa não pertence ao projeto do contrato."];
export async function GET() {
  try { return NextResponse.json(await service.findAll()); }
  catch (error: unknown) { console.error("Erro ao listar pagamentos:", error); return NextResponse.json({ error: "Erro interno ao listar pagamentos." }, { status: 500 }); }
}
export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "O corpo da requisição deve ser um JSON válido." }, { status: 400 }); }
  const input = parseCreatePagamentoInput(body);
  if (!input.success) return NextResponse.json({ error: input.error }, { status: 400 });
  try { return NextResponse.json(await service.create(input.data), { status: 201 }); }
  catch (error: unknown) {
    if (error instanceof Error && notFound.includes(error.message)) return NextResponse.json({ error: error.message }, { status: 404 });
    if (error instanceof Error && ["A nota fiscal já está cadastrada.", "O total de pagamentos excede o valor do contrato.", "O pagamento excede o recurso liberado para a etapa."].includes(error.message)) return NextResponse.json({ error: error.message }, { status: 409 });
    console.error("Erro ao criar pagamento:", error); return NextResponse.json({ error: "Erro interno ao criar pagamento." }, { status: 500 });
  }
}
