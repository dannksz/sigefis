import { NextResponse } from 'next/server';
import { UserService } from '@/services/user.service';
import { parseUpdateUserInput } from '@/lib/user-validation';

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
        if (error instanceof Error && error.message === 'Usuário não encontrado.') {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }
        console.error('Erro ao buscar usuário:', error);
        return NextResponse.json({ error: 'Erro interno ao buscar usuário.' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: Params) {
    try {
        const { id: rawId } = await params;
        const id = parseUserId(rawId);
        if (id === null) {
            return NextResponse.json({ error: 'ID de usuário inválido.' }, { status: 400 });
        }
        let body: unknown;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { error: 'O corpo da requisição deve ser um JSON válido.' },
                { status: 400 },
            );
        }
        const input = parseUpdateUserInput(body);
        if (!input.success) {
            return NextResponse.json({ error: input.error }, { status: 400 });
        }
        const updatedUser = await userService.update(id, input.data);
        return NextResponse.json(updatedUser, { status: 200 });
    } catch (error: unknown) {
        if (error instanceof Error && error.message === 'Usuário não encontrado.') {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }
        console.error('Erro ao atualizar usuário:', error);
        return NextResponse.json({ error: 'Erro interno ao atualizar usuário.' }, { status: 500 });
    }
}

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
        if (error instanceof Error && error.message === 'Usuário não encontrado.') {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }
        console.error('Erro ao excluir usuário:', error);
        return NextResponse.json({ error: 'Erro interno ao excluir usuário.' }, { status: 500 });
    }
}