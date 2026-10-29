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
