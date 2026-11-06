import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { EmpresaService } from "@/services/empresa.service";
import { parseUpdateEmpresaInput } from "@/lib/empresa-validation";
import { isEmpresaCnpjConflict } from "@/lib/empresa-errors";

const empresaService = new EmpresaService();

interface Params {
  params: Promise<{
    id: string;
  }>;
}

function parseEmpresaId(value: string): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function isEmpresaNotFound(error: unknown): error is Error {
  return error instanceof Error && error.message === "Empresa não encontrada.";
}

function isEnderecoNotFound(error: unknown): error is Error {
  return error instanceof Error && error.message === "Endereço não encontrado.";
}

export async function GET(_request: Request, { params }: Params) {
  const { id: rawId } = await params;
  const id = parseEmpresaId(rawId);

  if (id === null) {
    return NextResponse.json(
      { error: "ID de empresa inválido." },
      { status: 400 },
    );
  }

  try {
    const empresa = await empresaService.findById(id);
    return NextResponse.json(empresa, { status: 200 });
  } catch (error: unknown) {
    if (isEmpresaNotFound(error)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error("Erro ao buscar empresa:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar empresa." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, { params }: Params) {
  const { id: rawId } = await params;
  const id = parseEmpresaId(rawId);

  if (id === null) {
    return NextResponse.json(
      { error: "ID de empresa inválido." },
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

  const input = parseUpdateEmpresaInput(body);
  if (!input.success) {
    return NextResponse.json({ error: input.error }, { status: 400 });
  }

  try {
    const empresa = await empresaService.update(id, input.data);
    return NextResponse.json(empresa, { status: 200 });
  } catch (error: unknown) {
    if (isEmpresaNotFound(error) || isEnderecoNotFound(error)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (isEmpresaCnpjConflict(error)) {
      return NextResponse.json(
        { error: "Já existe uma empresa cadastrada com esse CNPJ." },
        { status: 409 },
      );
    }

    console.error("Erro ao atualizar empresa:", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar empresa." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id: rawId } = await params;
  const id = parseEmpresaId(rawId);

  if (id === null) {
    return NextResponse.json(
      { error: "ID de empresa inválido." },
      { status: 400 },
    );
  }

  try {
    await empresaService.delete(id);
    return NextResponse.json(
      { message: "Empresa excluída com sucesso." },
      { status: 200 },
    );
  } catch (error: unknown) {
    if (isEmpresaNotFound(error)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        { error: "Não é possível excluir uma empresa que possui contratos associados." },
        { status: 409 },
      );
    }

    console.error("Erro ao excluir empresa:", error);
    return NextResponse.json(
      { error: "Erro interno ao excluir empresa." },
      { status: 500 },
    );
  }
}
