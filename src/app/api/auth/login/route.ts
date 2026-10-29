import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { UserService } from "@/services/user.service";

const userService = new UserService();

interface LoginPayload {
  email: string;
  senha: string;
}

function isLoginPayload(value: unknown): value is LoginPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    "email" in value &&
    typeof value.email === "string" &&
    "senha" in value &&
    typeof value.senha === "string"
  );
}

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "O corpo da requisição deve ser um JSON válido." },
        { status: 400 },
      );
    }

    if (
      !isLoginPayload(body) ||
      !body.email.trim() ||
      !body.senha
    ) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios." },
        { status: 400 },
      );
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET não está configurado.");
      return NextResponse.json(
        { error: "A autenticação não está configurada corretamente." },
        { status: 500 },
      );
    }

    const user = await userService.authenticate({
      email: body.email.trim(),
      senha: body.senha,
    });

    if (!user) {
      return NextResponse.json(
        { error: "Credenciais inválidas." },
        { status: 401 },
      );
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: "12h" },
    );
    return NextResponse.json(
      {
        message: "Login efetuado com sucesso!",
        token,
        user,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Erro interno ao autenticar usuário:", error);
    return NextResponse.json(
      { error: "Erro interno ao tentar autenticar." },
      { status: 500 },
    );
  }
}
