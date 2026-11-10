import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { parseUpdatePagamentoInput } from "@/lib/pagamento-validation";
import { PagamentoService } from "@/services/pagamento.service";

const service = new PagamentoService();
interface Params { params: Promise<{ id: string }> }
const notFound = ["Pagamento não encontrado.", "Contrato não encontrado.", "Etapa do cronograma não encontrada.", "A etapa não pertence ao projeto do contrato."];
const conflict = ["A nota fiscal já está cadastrada.", "O total de pagamentos excede o valor do contrato.", "O pagamento excede o recurso liberado para a etapa."];
function parseId(value: string): number | null { const id = Number(value); return Number.isSafeInteger(id) && id > 0 ? id : null; }
export async function GET(_request: Request, { params }: Params) {
  const id = parseId((await params).id); if (id === null) return NextResponse.json({ error: "ID de pagamento inválido." }, { status: 400 });
  try { return NextResponse.json(await service.findById(id)); } catch (error: unknown) {
    if (error instanceof Error && notFound.includes(error.message)) return NextResponse.json({ error: error.message }, { status: 404 });
    console.error("Erro ao buscar pagamento:", error); return NextResponse.json({ error: "Erro interno ao buscar pagamento." }, { status: 500 });
  }
}
export async function PUT(request: Request, { params }: Params) {
  const id = parseId((await params).id); if (id === null) return NextResponse.json({ error: "ID de pagamento inválido." }, { status: 400 });
  let body: unknown; try { body = await request.json(); } catch { return NextResponse.json({ error: "O corpo da requisição deve ser um JSON válido." }, { status: 400 }); }
  const input = parseUpdatePagamentoInput(body); if (!input.success) return NextResponse.json({ error: input.error }, { status: 400 });
  try { return NextResponse.json(await service.update(id, input.data)); } catch (error: unknown) {
    if (error instanceof Error && notFound.includes(error.message)) return NextResponse.json({ error: error.message }, { status: 404 });
    if (error instanceof Error && conflict.includes(error.message)) return NextResponse.json({ error: error.message }, { status: 409 });
    console.error("Erro ao atualizar pagamento:", error); return NextResponse.json({ error: "Erro interno ao atualizar pagamento." }, { status: 500 });
  }
}
export async function DELETE(_request: Request, { params }: Params) {
  const id = parseId((await params).id); if (id === null) return NextResponse.json({ error: "ID de pagamento inválido." }, { status: 400 });
  try { await service.delete(id); return NextResponse.json({ message: "Pagamento excluído com sucesso." }); } catch (error: unknown) {
    if (error instanceof Error && error.message === "Pagamento não encontrado.") return NextResponse.json({ error: error.message }, { status: 404 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") return NextResponse.json({ error: "Não é possível excluir um pagamento associado a outros registros." }, { status: 409 });
    console.error("Erro ao excluir pagamento:", error); return NextResponse.json({ error: "Erro interno ao excluir pagamento." }, { status: 500 });
  }
}
