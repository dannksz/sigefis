import { NextResponse } from 'next/server';
import { UserService } from '@/services/user.service';

const userService = new UserService();

//1. GET: Listar todos os usuários
export async function GET() {
    try {
        const users = await userService.findAll();
        return NextResponse.json(users, { status: 200 }); 
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erro desconhecido';
        return NextResponse.json({ error: message }, { status: 500} );
    }
}

//2. POST: Criar um novo usuário
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const newUser = await userService.create(body);
        return NextResponse.json(newUser, { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erro desconhecido';
        return NextResponse.json({ error:message }, { status: 400 });
    }
}