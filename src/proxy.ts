import { NextResponse, type NextRequest } from "next/server";
import {
  canAccessResource,
  canApproveFinancialOperation,
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
  if (!canAccessResource(claims.role, request.nextUrl.pathname, request.method)) {
    return NextResponse.json(
      { error: "Você não tem permissão para acessar este recurso." },
      { status: 403 },
    );
  }
  if (
    (request.nextUrl.pathname.includes("/aprovar") ||
      request.nextUrl.pathname.includes("/rejeitar")) &&
    !canApproveFinancialOperation(claims.role)
  ) {
    return NextResponse.json(
      { error: "Somente ADMIN pode aprovar operações financeiras." },
      { status: 403 },
    );
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-auth-user-id", String(claims.id));
  requestHeaders.set("x-auth-role", claims.role);
  requestHeaders.set(
    "x-auth-client-ip",
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "unknown",
  );
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/api/users/:path*",
    "/api/meu-perfil",
    "/api/estados/:path*",
    "/api/cidades/:path*",
    "/api/enderecos/:path*",
    "/api/orgaos/:path*",
    "/api/empresas/:path*",
    "/api/projetos/:path*",
    "/api/contratos/:path*",
    "/api/verbas-publicas/:path*",
    "/api/emendas-parlamentares/:path*",
    "/api/projetos-verbas/:path*",
    "/api/etapas-cronograma/:path*",
    "/api/obras-fiscais/:path*",
    "/api/revisoes-fiscalizacao/:path*",
    "/api/fiscalizacoes/:path*",
    "/api/evidencias-fiscalizacao/:path*",
    "/api/liberacoes-recursos/:path*",
    "/api/pagamentos/:path*",
    "/api/contas-bancarias/:path*",
    "/api/alertas-fiscalizacao/:path*",
    "/api/bloqueios-repasse/:path*",
    "/api/processos-regularizacao/:path*",
    "/api/decisoes-financeiras/:path*",
    "/api/logs-auditoria/:path*",
    "/api/mensagens-contato/:path*",
  ],
};
