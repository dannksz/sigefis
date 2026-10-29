import { NextResponse, type NextRequest } from "next/server";
import {
  canManageUsers,
  getBearerToken,
  getJwtSecret,
  verifyAccessToken,
} from "./lib/auth-policy";

export function proxy(request: NextRequest) {
  const isPublicRegistration =
    request.nextUrl.pathname === "/api/users" && request.method === "POST";
  if (isPublicRegistration) {
    return NextResponse.next();
  }

  const secret = getJwtSecret();
  if (!secret) {
    console.error("JWT_SECRET ausente ou menor que 32 bytes.");
    return NextResponse.json(
      { error: "A autenticação não está configurada corretamente." },
      { status: 500 },
    );
  }

  const token = getBearerToken(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json(
      { error: "Autenticação obrigatória." },
      { status: 401 },
    );
  }

  const claims = verifyAccessToken(token, secret);
  if (!claims) {
    return NextResponse.json(
      { error: "Token inválido ou expirado." },
      { status: 401 },
    );
  }
  if (!canManageUsers(claims.role)) {
    return NextResponse.json(
      { error: "Você não tem permissão para gerenciar usuários." },
      { status: 403 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/users/:path*"],
};
