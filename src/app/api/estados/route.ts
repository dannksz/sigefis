import { NextResponse } from "next/server";
import { EstadoService } from "@/services/estado.service";
import { parseCreateEstadoInput } from "@/lib/estado-validation";
import { isEstadoSiglaConflict } from "@/lib/estado-errors";

const estadoService = new EstadoService();

export async function GET() {
    try {
        const estados = await estadoService.findAll();
        return NextResponse.json(estados, { status: 200 });
    } catch (error: unknown) {
        console.error("Erro ao listar estados:", error);
        return NextResponse.json(
            { error: "Erro interno ao listar estados." },
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
    const input = parseCreateEstadoInput(body);
    if (!input.success) {
        return NextResponse.json({ error: input.error }, { status: 400 });
    }

    try { 
        const estado = await estadoService.create(input.data);
        return NextResponse.json(estado, { status: 201 });
    } catch (error: unknown) {
        if (isEstadoSiglaConflict(error)) {
            return NextResponse.json(
                { error: "Já existe um estado cadastrado com essa sigla." },
                { status: 409 },
            );
        }
        console.error("Erro ao criar estado:", error);
        return NextResponse.json(
            { error: "Erro interno ao criar estado." },
            { status: 500 },
        );
    }

}
