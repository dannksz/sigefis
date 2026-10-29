import { describe, expect, it } from "vitest";
import { parseCreateUserInput, parseLoginInput, parseUpdateUserInput } from "./user-validation";

const validRegistration = {
  nome: " Ana Souza ",
  email: "ANA@example.com",
  senha: "SenhaForte123!",
  cpf: "12345678901",
};

describe("user request validation", () => {
  it("normalizes valid public registration data and excludes role assignment", () => {
    expect(parseCreateUserInput(validRegistration)).toEqual({
      success: true,
      data: {
        nome: "Ana Souza",
        email: "ana@example.com",
        senha: "SenhaForte123!",
        cpf: "12345678901",
      },
    });
  });

  it("rejects attempts to choose a role or pass unknown fields at registration", () => {
    expect(
      parseCreateUserInput({ ...validRegistration, role: "ADMIN" }),
    ).toMatchObject({ success: false });
    expect(
      parseCreateUserInput({ ...validRegistration, endereco: {} }),
    ).toMatchObject({ success: false });
  });

  it("validates optional CNPJ, address id, and date fields", () => {
    expect(
      parseCreateUserInput({
        ...validRegistration,
        cnpj: "12345678000199",
        enderecoId: 1,
        dataNascimento: "2000-01-02",
      }).success,
    ).toBe(true);
    expect(
      parseCreateUserInput({ ...validRegistration, cnpj: "123" }),
    ).toMatchObject({ success: false });
    expect(
      parseCreateUserInput({ ...validRegistration, enderecoId: -1 }),
    ).toMatchObject({ success: false });
    expect(
      parseCreateUserInput({ ...validRegistration, dataNascimento: "not-a-date" }),
    ).toMatchObject({ success: false });
    expect(
      parseCreateUserInput({ ...validRegistration, dataNascimento: "2025-02-31" }),
    ).toMatchObject({ success: false });
  });

  it("enforces password length within bcrypt's supported byte range", () => {
    expect(
      parseCreateUserInput({ ...validRegistration, senha: "1234567" }),
    ).toMatchObject({ success: false });
    expect(
      parseCreateUserInput({ ...validRegistration, senha: "a".repeat(73) }),
    ).toMatchObject({ success: false });
  });

  it("validates login payloads without applying registration password rules", () => {
    expect(parseLoginInput({ email: " ANA@example.com ", senha: "x" })).toEqual({
      success: true,
      data: { email: "ana@example.com", senha: "x" },
    });
    expect(parseLoginInput({ email: "invalid", senha: "x" })).toMatchObject({
      success: false,
    });
  });

  it("validates non-empty partial updates and permitted roles", () => {
    expect(parseUpdateUserInput({ nome: "Novo nome" })).toEqual({
      success: true,
      data: { nome: "Novo nome" },
    });
    expect(parseUpdateUserInput({})).toMatchObject({ success: false });
    expect(parseUpdateUserInput({ role: "ROOT" })).toMatchObject({
      success: false,
    });
    expect(parseUpdateUserInput({ role: "GESTOR" })).toEqual({
      success: true,
      data: { role: "GESTOR" },
    });
  });
});
