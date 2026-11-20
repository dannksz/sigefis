import { isIP } from "node:net";
import { NextResponse } from "next/server";
import { UserService } from "@/services/user.service";
import { getJwtSecret, signAccessToken } from "@/lib/auth-policy";
import { parseLoginInput } from "@/lib/user-validation";
import { auditFailedLogin, auditSuccess } from "@/lib/audit-request";

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
    const forwardedIp = request.headers.get("x-forwarded-for")?.split(",")[0].trim();
    const realIp = request.headers.get("x-real-ip")?.trim();
    const ipOrigem = [forwardedIp, realIp].find((ip) => ip && isIP(ip)) ?? "unknown";

    if (!user) {
      await auditFailedLogin(ipOrigem).catch((error: unknown) => {
        console.error("Erro ao registrar auditoria de login malsucedido:", error);
      });
      return NextResponse.json(
        { error: "Credenciais inválidas." },
        { status: 401 },
      );
    }

    const token = signAccessToken(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
    );
    await auditSuccess({
      acao: "LOGIN",
      pathname: "/api/auth/login",
      usuarioId: user.id,
      ipOrigem,
      registroId: user.id,
      detalhes: { role: user.role },
    }).catch((error: unknown) => {
      console.error("Erro ao registrar auditoria de login:", error);
    });
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
