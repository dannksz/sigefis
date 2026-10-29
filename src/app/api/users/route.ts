import { NextResponse } from 'next/server';
import { UserService } from '@/services/user.service';
import { parseCreateUserInput } from '@/lib/user-validation';

const userService = new UserService();

export async function GET() {
    try {
        const users = await userService.findAll();
        return NextResponse.json(users, { status: 200 });
    } catch (error: unknown) {
        console.error('Erro ao listar usuários:', error);
        return NextResponse.json({ error: 'Erro interno ao listar usuários.' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
          { error: 'O corpo da requisição deve ser um JSON válido.' },
          { status: 400 },
        );
    }

    const input = parseCreateUserInput(body);
    if (!input.success) {
        return NextResponse.json({ error: input.error }, { status: 400 });
    }

    try {
        const newUser = await userService.create({ ...input.data, role: 'USER' });
        return NextResponse.json(newUser, { status: 201 });
    } catch (error: unknown) {
        if (
          error instanceof Error &&
          error.message === 'Já existe um usuário cadastrado com esse e-mail.'
        ) {
          return NextResponse.json({ error: error.message }, { status: 409 });
        }
        console.error('Erro ao criar usuário:', error);
        return NextResponse.json({ error: 'Erro interno ao criar usuário.' }, { status: 500 });
    }
}