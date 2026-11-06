import { describe, expect, it } from "vitest";
import {
  parseCreateEmpresaInput,
  parseUpdateEmpresaInput,
} from "./empresa-validation";

describe("company request validation", () => {
  const validCompany = {
    nome: " Construtora Exemplo ",
    cnpj: "12.345.678/0001-90",
    representanteLegal: " Joao Silva ",
    telefone: "11999999999",
    email: " CONTATO@EXEMPLO.COM ",
    enderecoId: 1,
  };

  it("normalizes valid company data", () => {
    expect(parseCreateEmpresaInput(validCompany)).toEqual({
      success: true,
      data: {
        nome: "Construtora Exemplo",
        cnpj: "12345678000190",
        representanteLegal: "Joao Silva",
        telefone: "11999999999",
        email: "contato@exemplo.com",
        enderecoId: 1,
      },
    });
  });

  it("rejects malformed required fields and unknown fields", () => {
    expect(
      parseCreateEmpresaInput({ ...validCompany, cnpj: "123" }),
    ).toMatchObject({ success: false });
    expect(
      parseCreateEmpresaInput({ ...validCompany, email: "invalid" }),
    ).toMatchObject({ success: false });
    expect(
      parseCreateEmpresaInput({ ...validCompany, enderecoId: 0 }),
    ).toMatchObject({ success: false });
    expect(
      parseCreateEmpresaInput({ ...validCompany, role: "ADMIN" }),
    ).toMatchObject({ success: false });
  });

  it("rejects empty updates and accepts valid partial updates", () => {
    expect(parseUpdateEmpresaInput({})).toMatchObject({ success: false });
    expect(
      parseUpdateEmpresaInput({
        cnpj: "12345678000190",
        email: "novo@exemplo.com",
      }),
    ).toEqual({
      success: true,
      data: {
        cnpj: "12345678000190",
        email: "novo@exemplo.com",
      },
    });
  });
});
