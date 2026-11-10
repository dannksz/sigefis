import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { EmendaParlamentarService } from "@/services/emenda-parlamentar.service";
import { parseUpdateEmendaParlamentarInput } from "@/lib/emenda-parlamentar-validation";

const service = new EmendaParlamentarService();

interface Params {
  params: Promise<{ id: string }>;
}

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function isAmendmentNotFound(error: unknown): error is Error {
  return error instanceof Error && error.message === "Emenda parlamentar não encontrada.";
}

function isVerbaNotFound(error: unknown): error is Error {
  return error instanceof Error && error.message === "Verba pública não encontrada.";
}

export async function GET(_request: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "ID de emenda parlamentar inválido." }, { status: 400 });
  try {
    return NextResponse.json(await service.findById(id), { status: 200 });
  } catch (error: unknown) {
    if (isAmendmentNotFound(error)) return NextResponse.json({ error: error.message }, { status: 404 });
    console.error("Erro ao buscar emenda parlamentar:", error);
    return NextResponse.json({ error: "Erro interno ao buscar emenda parlamentar." }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "ID de emenda parlamentar inválido." }, { status: 400 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "O corpo da requisição deve ser um JSON válido." }, { status: 400 });
  }
  const input = parseUpdateEmendaParlamentarInput(body);
  if (!input.success) return NextResponse.json({ error: input.error }, { status: 400 });

  try {
    return NextResponse.json(await service.update(id, input.data), { status: 200 });
  } catch (error: unknown) {
    if (isAmendmentNotFound(error) || isVerbaNotFound(error)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Erro ao atualizar emenda parlamentar:", error);
    return NextResponse.json({ error: "Erro interno ao atualizar emenda parlamentar." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "ID de emenda parlamentar inválido." }, { status: 400 });
  try {
    await service.delete(id);
    return NextResponse.json({ message: "Emenda parlamentar excluída com sucesso." }, { status: 200 });
  } catch (error: unknown) {
    if (isAmendmentNotFound(error)) return NextResponse.json({ error: error.message }, { status: 404 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json({ error: "Não é possível excluir uma emenda parlamentar associada a outros registros." }, { status: 409 });
    }
    console.error("Erro ao excluir emenda parlamentar:", error);
    return NextResponse.json({ error: "Erro interno ao excluir emenda parlamentar." }, { status: 500 });
  }
}
