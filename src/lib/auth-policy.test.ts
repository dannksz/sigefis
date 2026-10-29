import { describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import {
  canManageUsers,
  getBearerToken,
  getJwtSecret,
  isUserRole,
  verifyAccessToken,
} from "./auth-policy";

describe("user access policy", () => {
  it("recognizes only the four supported roles", () => {
    expect(isUserRole("ADMIN")).toBe(true);
    expect(isUserRole("FISCAL")).toBe(true);
    expect(isUserRole("GESTOR")).toBe(true);
    expect(isUserRole("USER")).toBe(true);
    expect(isUserRole("ROOT")).toBe(false);
    expect(isUserRole(null)).toBe(false);
  });

  it("allows only ADMIN to manage users", () => {
    expect(canManageUsers("ADMIN")).toBe(true);
    expect(canManageUsers("GESTOR")).toBe(false);
    expect(canManageUsers("FISCAL")).toBe(false);
    expect(canManageUsers("USER")).toBe(false);
  });

  it("accepts only a well-formed bearer authorization header", () => {
    expect(getBearerToken("Bearer abc.def.ghi")).toBe("abc.def.ghi");
    expect(getBearerToken("bearer token")).toBe("token");
    expect(getBearerToken(null)).toBeNull();
    expect(getBearerToken("Basic abc")).toBeNull();
    expect(getBearerToken("Bearer token extra")).toBeNull();
  });

  it("requires a JWT secret of at least 32 bytes", () => {
    const previousSecret = process.env.JWT_SECRET;
    try {
      process.env.JWT_SECRET = "too-short";
      expect(getJwtSecret()).toBeNull();
      process.env.JWT_SECRET = "a".repeat(32);
      expect(getJwtSecret()).toBe("a".repeat(32));
    } finally {
      if (previousSecret === undefined) {
        delete process.env.JWT_SECRET;
      } else {
        process.env.JWT_SECRET = previousSecret;
      }
    }
  });

  it("accepts signed access tokens and rejects invalid roles or algorithms", () => {
    const secret = "s".repeat(32);
    const token = jwt.sign(
      { id: 8, role: "ADMIN" },
      secret,
      { algorithm: "HS256", expiresIn: "12h" },
    );
    const invalidRoleToken = jwt.sign(
      { id: 8, role: "ROOT" },
      secret,
      { algorithm: "HS256", expiresIn: "12h" },
    );
    const wrongAlgorithmToken = jwt.sign(
      { id: 8, role: "ADMIN" },
      secret,
      { algorithm: "HS384", expiresIn: "12h" },
    );

    expect(verifyAccessToken(token, secret)).toEqual({ id: 8, role: "ADMIN" });
    expect(verifyAccessToken(invalidRoleToken, secret)).toBeNull();
    expect(verifyAccessToken(wrongAlgorithmToken, secret)).toBeNull();
    expect(verifyAccessToken(token, "x".repeat(32))).toBeNull();
  });
});
