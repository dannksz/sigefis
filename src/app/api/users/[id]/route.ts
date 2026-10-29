import { NextResponse } from 'next/server';
import { UserService } from '@/services/user.service';

const userService = new UserService();

interface Params {
    params: Promise<{
        id: string;   
    }>;
}

function parseUserId(value: string): number | null {
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

//1. GET: Buscar usuário por ID
export async function GET(request: Request, { params }: Params) {
    try {
        const { id: rawId } = await params;
        const id = parseUserId(rawId);
        if (id === null) {
            return NextResponse.json({ error: 'ID de usuário inválido.' }, { status: 400 });
        }
        const user = await userService.findById(id);
        return NextResponse.json(user, { status: 200 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erro desconhecido';
        return NextResponse.json({ error: message }, { status: 404 });
    }
}

//2. PUT: Atualizar usuário
export async function PUT(request: Request, { params }: Params) {
    try {
        const { id: rawId } = await params;
        const id = parseUserId(rawId);
        if (id === null) {
            return NextResponse.json({ error: 'ID de usuário inválido.' }, { status: 400 });
        }
        const body = await request.json();
        const updatedUser = await userService.update(id, body);
        return NextResponse.json(updatedUser, { status: 200 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erro desconhecido';
        return NextResponse.json({ error: message }, { status: 400 });
    }
}

//3. DELETE: Deletar usuário
export async function DELETE(request: Request, { params }: Params) {
    try {
        const { id: rawId } = await params;
        const id = parseUserId(rawId);
        if (id === null) {
            return NextResponse.json({ error: 'ID de usuário inválido.' }, { status: 400 });
        }
        await userService.delete(id);
        return NextResponse.json({ message: 'Usuário deletado com sucesso.' }, { status: 200 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erro desconhecido';
        return NextResponse.json({ error: message }, { status: 400 });
    }
}