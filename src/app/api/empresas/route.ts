import { NextResponse } from "next/server";
import { EmpresaService } from "@/services/empresa.service";
import { parseCreateEmpresaInput } from "@/lib/empresa-validation";
import { isEmpresaCnpjConflict } from "@/lib/empresa-errors";

const empresaService = new EmpresaService();

function isEnderecoNotFound(error: unknown): error is Error {
  return error instanceof Error && error.message === "Endereço não encontrado.";
}

export async function GET() {
  try {
    const empresas = await empresaService.findAll();
    return NextResponse.json(empresas, { status: 200 });
  } catch (error: unknown) {
    console.error("Erro ao listar empresas:", error);
    return NextResponse.json(
      { error: "Erro interno ao listar empresas." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "O corpo da requisição deve ser um JSON válido." },
      { status: 400 },
    );
  }

  const input = parseCreateEmpresaInput(body);
  if (!input.success) {
    return NextResponse.json({ error: input.error }, { status: 400 });
  }

  try {
    const empresa = await empresaService.create(input.data);
    return NextResponse.json(empresa, { status: 201 });
  } catch (error: unknown) {
    if (isEnderecoNotFound(error)) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (isEmpresaCnpjConflict(error)) {
      return NextResponse.json(
        { error: "Já existe uma empresa cadastrada com esse CNPJ." },
        { status: 409 },
      );
    }

    console.error("Erro ao criar empresa:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar empresa." },
      { status: 500 },
    );
  }
}
