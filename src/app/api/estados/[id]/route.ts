import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { EstadoService } from "@/services/estado.service";
import { parseUpdateEstadoInput } from "@/lib/estado-validation";
import { isEstadoSiglaConflict } from "@/lib/estado-errors";

const estadoService = new EstadoService();

interface Params {
    params: Promise<{
        id: string;
    }>;
}

function parseEstadoId(value: string): number | null {
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function isEstadoNotFound(error: unknown): error is Error {
    return error instanceof Error && error.message === "Estado não encontrado.";
}

export async function GET(_request: Request, { params }: Params) {
    const { id: rawId } = await params;
    const id = parseEstadoId(rawId);

    if (id === null) {
      return NextResponse.json(
        { error: "ID de estado inválido." },
        { status: 400 },
      );
    }

    try {
      const estado = await estadoService.findById(id);
      return NextResponse.json(estado, { status: 200 });
    } catch (error: unknown) {
      if (isEstadoNotFound(error)) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }

      console.error("Erro ao buscar estado:", error);
      return NextResponse.json(
        { error: "Erro interno ao buscar estado." },
        { status: 500 },
      );
    }
}

export async function PUT(request: Request, { params }: Params) {
  const { id: rawId } = await params;
  const id = parseEstadoId(rawId);

  if (id === null) {
    return NextResponse.json(
      { error: "ID de estado inválido." },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "O corpo da requisição deve ser um JSON válido." },
      { status: 400 },
    );
  }

  const input = parseUpdateEstadoInput(body);
  if (!input.success) {
    return NextResponse.json({ error: input.error }, { status: 400 });
  }

  try {
    const estado = await estadoService.update(id, input.data);
    return NextResponse.json(estado, { status: 200 });
  } catch (error: unknown) {
    if (isEstadoNotFound(error)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (isEstadoSiglaConflict(error)) {
      return NextResponse.json(
        { error: "Já existe um estado cadastrado com essa sigla." },
        { status: 409 },
      );
    }

    console.error("Erro ao atualizar estado:", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar estado." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id: rawId } = await params;
  const id = parseEstadoId(rawId);

  if (id === null) {
    return NextResponse.json(
      { error: "ID de estado inválido." },
      { status: 400 },
    );
  }

  try {
    await estadoService.delete(id);
    return NextResponse.json(
      { message: "Estado deletado com sucesso." },
      { status: 200 },
    );
  } catch (error: unknown) {
    if (isEstadoNotFound(error)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        { error: "Não é possível excluir um estado que possui cidades associadas." },
        { status: 409 },
      );
    }

    console.error("Erro ao excluir estado:", error);
    return NextResponse.json(
      { error: "Erro interno ao excluir estado." },
      { status: 500 },
    );
  }
}