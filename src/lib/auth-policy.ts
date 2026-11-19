import jwt from "jsonwebtoken";
import type { UserRole } from "../types/user";

const JWT_ALGORITHM = "HS256";
const MINIMUM_JWT_SECRET_BYTES = 32;

export function getJwtSecret(): string | null {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret, "utf8") < MINIMUM_JWT_SECRET_BYTES) {
    return null;
  }
  return secret;
}

export function isUserRole(value: unknown): value is UserRole {
  return (
    value === "ADMIN" ||
    value === "FISCAL" ||
    value === "GESTOR" ||
    value === "USER"
  );
}

export function canManageUsers(role: UserRole): boolean {
  return role === "ADMIN";
}

export function canApproveFinancialOperation(role: UserRole): boolean {
  return role === "ADMIN";
}

type Permission = "read" | "write";

const readRoles: Record<string, UserRole[]> = {
  "/api/estados": ["ADMIN", "GESTOR", "FISCAL", "USER"],
  "/api/cidades": ["ADMIN", "GESTOR", "FISCAL", "USER"],
  "/api/enderecos": ["ADMIN", "GESTOR", "FISCAL", "USER"],
  "/api/orgaos": ["ADMIN", "GESTOR", "FISCAL", "USER"],
  "/api/empresas": ["ADMIN", "GESTOR", "FISCAL", "USER"],
  "/api/projetos": ["ADMIN", "GESTOR", "FISCAL", "USER"],
  "/api/contratos": ["ADMIN", "GESTOR", "FISCAL", "USER"],
  "/api/verbas-publicas": ["ADMIN", "GESTOR", "FISCAL", "USER"],
  "/api/emendas-parlamentares": ["ADMIN", "GESTOR", "FISCAL", "USER"],
  "/api/projetos-verbas": ["ADMIN", "GESTOR", "FISCAL", "USER"],
  "/api/etapas-cronograma": ["ADMIN", "GESTOR", "FISCAL", "USER"],
  "/api/obras-fiscais": ["ADMIN", "GESTOR", "FISCAL", "USER"],
  "/api/fiscalizacoes": ["ADMIN", "GESTOR", "FISCAL", "USER"],
  "/api/evidencias-fiscalizacao": ["ADMIN", "GESTOR", "FISCAL", "USER"],
  "/api/liberacoes-recursos": ["ADMIN", "GESTOR", "FISCAL", "USER"],
  "/api/pagamentos": ["ADMIN", "GESTOR", "FISCAL", "USER"],
  "/api/contas-bancarias": ["ADMIN", "GESTOR", "FISCAL", "USER"],
  "/api/alertas-fiscalizacao": ["ADMIN", "GESTOR", "FISCAL", "USER"],
  "/api/bloqueios-repasse": ["ADMIN", "GESTOR", "FISCAL", "USER"],
  "/api/processos-regularizacao": ["ADMIN", "GESTOR", "FISCAL", "USER"],
  "/api/decisoes-financeiras": ["ADMIN", "GESTOR"],
  "/api/revisoes-fiscalizacao": ["ADMIN", "GESTOR", "FISCAL", "USER"],
};

const writeRoles: Record<string, UserRole[]> = {
  "/api/estados": ["ADMIN", "GESTOR"],
  "/api/cidades": ["ADMIN", "GESTOR"],
  "/api/enderecos": ["ADMIN", "GESTOR"],
  "/api/orgaos": ["ADMIN", "GESTOR"],
  "/api/empresas": ["ADMIN", "GESTOR"],
  "/api/projetos": ["ADMIN", "GESTOR"],
  "/api/contratos": ["ADMIN", "GESTOR"],
  "/api/verbas-publicas": ["ADMIN", "GESTOR"],
  "/api/emendas-parlamentares": ["ADMIN", "GESTOR"],
  "/api/projetos-verbas": ["ADMIN", "GESTOR"],
  "/api/etapas-cronograma": ["ADMIN", "GESTOR"],
  "/api/obras-fiscais": ["ADMIN", "GESTOR"],
  "/api/fiscalizacoes": ["ADMIN", "FISCAL"],
  "/api/evidencias-fiscalizacao": ["ADMIN", "FISCAL"],
  "/api/alertas-fiscalizacao": ["ADMIN", "FISCAL"],
  "/api/processos-regularizacao": ["ADMIN", "FISCAL", "GESTOR"],
  "/api/liberacoes-recursos": ["ADMIN", "GESTOR"],
  "/api/pagamentos": ["ADMIN", "GESTOR"],
  "/api/contas-bancarias": ["ADMIN", "GESTOR"],
  "/api/bloqueios-repasse": ["ADMIN", "GESTOR"],
  "/api/decisoes-financeiras": ["ADMIN"],
  "/api/revisoes-fiscalizacao": ["ADMIN", "FISCAL"],
};

function resourcePath(pathname: string): string {
  const segments = pathname.split("/");
  return `/${segments[1]}/${segments[2]}`;
}

export function canAccessResource(
  role: UserRole,
  pathname: string,
  method: string,
): boolean {
  if (role === "ADMIN") return true;
  const resource = resourcePath(pathname);
  const permission: Permission = method === "GET" ? "read" : "write";
  const roles = permission === "read" ? readRoles[resource] : writeRoles[resource];
  if (!roles?.includes(role)) return false;
  return permission === "read" || method === "POST" || method === "PUT";
}

export function getBearerToken(header: string | null): string | null {
  if (!header) {
    return null;
  }
  const match = /^Bearer ([^\s]+)$/i.exec(header);
  return match?.[1] ?? null;
}

export interface AccessTokenClaims {
  id: number;
  role: UserRole;
}

export function verifyAccessToken(
  token: string,
  secret: string,
): AccessTokenClaims | null {
  try {
    const payload = jwt.verify(token, secret, {
      algorithms: [JWT_ALGORITHM],
    });
    if (
      typeof payload === "string" ||
      typeof payload.id !== "number" ||
      !Number.isSafeInteger(payload.id) ||
      !isUserRole(payload.role)
    ) {
      return null;
    }

    return {
      id: payload.id,
      role: payload.role,
    };
  } catch (error: unknown) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return null;
    }
    throw error;
  }
}

export function signAccessToken(
  claims: AccessTokenClaims & { email: string },
  secret: string,
): string {
  return jwt.sign(claims, secret, {
    algorithm: JWT_ALGORITHM,
    expiresIn: "12h",
  });
}
