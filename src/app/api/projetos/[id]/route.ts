import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { auditRequestSuccess } from "@/lib/audit-request";
import { ProjetoService } from "@/services/projeto.service";
import { parseUpdateProjetoInput } from "@/lib/projeto-validation";

const projetoService = new ProjetoService();

interface Params {
  params: Promise<{
    id: string;
  }>;
}

function parseProjetoId(value: string): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function isProjetoNotFound(error: unknown): error is Error {
  return error instanceof Error && error.message === "Projeto não encontrado.";
}

function isEnderecoNotFound(error: unknown): error is Error {
  return error instanceof Error && ["Endereço não encontrado.", "Cidade não encontrada.", "Estado não encontrado."].includes(error.message);
}

export async function GET(_request: Request, { params }: Params) {
  const { id: rawId } = await params;
  const id = parseProjetoId(rawId);

  if (id === null) {
    return NextResponse.json(
      { error: "ID de projeto inválido." },
      { status: 400 },
    );
  }

  try {
    const projeto = await projetoService.findById(id);
    return NextResponse.json(projeto, { status: 200 });
  } catch (error: unknown) {
    if (isProjetoNotFound(error)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error("Erro ao buscar projeto:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar projeto." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, { params }: Params) {
  const { id: rawId } = await params;
  const id = parseProjetoId(rawId);

  if (id === null) {
    return NextResponse.json(
      { error: "ID de projeto inválido." },
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

  const input = parseUpdateProjetoInput(body);
  if (!input.success) {
    return NextResponse.json({ error: input.error }, { status: 400 });
  }
  if (input.data.publicado !== undefined && request.headers.get("x-auth-role") !== "ADMIN") {
    return NextResponse.json({ error: "Somente ADMIN pode alterar a publicação da obra." }, { status: 403 });
  }

  try {
    const projeto = await projetoService.update(id, input.data);
    await auditRequestSuccess(request, "ATUALIZAR_PROJETO", projeto.id ?? id, { obraNome: projeto.nome });
    return NextResponse.json(projeto, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Uma obra publicada precisa de um órgão responsável.") {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "O cadastro mudou durante a edição. Recarregue e tente novamente." }, { status: 409 });
    }
    if (isProjetoNotFound(error) || isEnderecoNotFound(error) || (error instanceof Error && error.message === "Órgão responsável não encontrado.")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error("Erro ao atualizar projeto:", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar projeto." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id: rawId } = await params;
  const id = parseProjetoId(rawId);

  if (id === null) {
    return NextResponse.json(
      { error: "ID de projeto inválido." },
      { status: 400 },
    );
  }

  try {
    const projeto = await projetoService.delete(id);
    await auditRequestSuccess(_request, "EXCLUIR_PROJETO", id, { obraNome: projeto.nome });
    return NextResponse.json(
      { message: "Projeto excluído com sucesso." },
      { status: 200 },
    );
  } catch (error: unknown) {
    if (isProjetoNotFound(error)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        {
          error:
            "Não é possível excluir um projeto que possui registros associados.",
        },
        { status: 409 },
      );
    }

    console.error("Erro ao excluir projeto:", error);
    return NextResponse.json(
      { error: "Erro interno ao excluir projeto." },
      { status: 500 },
    );
  }
}
