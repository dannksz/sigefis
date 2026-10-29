import { NextResponse } from "next/server";
import { UserService } from "@/services/user.service";
import { getJwtSecret, signAccessToken } from "@/lib/auth-policy";
import { parseLoginInput } from "@/lib/user-validation";

const userService = new UserService();

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

    const credentials = parseLoginInput(body);
    if (!credentials.success) {
      return NextResponse.json(
        { error: credentials.error },
        { status: 400 },
      );
    }

    const jwtSecret = getJwtSecret();
    if (!jwtSecret) {
      console.error("JWT_SECRET ausente ou menor que 32 bytes.");
      return NextResponse.json(
        { error: "A autenticação não está configurada corretamente." },
        { status: 500 },
      );
    }

    const user = await userService.authenticate(credentials.data);

    if (!user) {
      return NextResponse.json(
        { error: "Credenciais inválidas." },
        { status: 401 },
      );
    }

    const token = signAccessToken(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
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
