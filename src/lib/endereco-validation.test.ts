import { describe, expect, it } from "vitest";
import {
  parseCreateEnderecoInput,
  parseUpdateEnderecoInput,
} from "./endereco-validation";

const validAddress = {
  logradouro: " Rua das Flores ",
  numero: " 10 ",
  bairro: " Centro ",
  cep: "01001-000",
  cidadeId: 1,
};

describe("address request validation", () => {
  it("trims text and stores CEP as eight digits", () => {
    expect(parseCreateEnderecoInput(validAddress)).toEqual({
      success: true,
      data: {
        logradouro: "Rua das Flores",
        numero: "10",
        bairro: "Centro",
        cep: "01001000",
        cidadeId: 1,
      },
    });
  });

  it("accepts a CEP without a hyphen and nullable complement", () => {
    expect(
      parseCreateEnderecoInput({
        ...validAddress,
        cep: "01001000",
        complemento: null,
      }),
    ).toEqual({
      success: true,
      data: {
        logradouro: "Rua das Flores",
        numero: "10",
        bairro: "Centro",
        cep: "01001000",
        cidadeId: 1,
        complemento: null,
      },
    });
  });

  it("rejects malformed CEPs, invalid city IDs, and unknown fields", () => {
    expect(
      parseCreateEnderecoInput({ ...validAddress, cep: "1234-567" }),
    ).toMatchObject({ success: false });
    expect(
      parseCreateEnderecoInput({ ...validAddress, cidadeId: 0 }),
    ).toMatchObject({ success: false });
    expect(
      parseCreateEnderecoInput({ ...validAddress, role: "ADMIN" }),
    ).toMatchObject({ success: false });
  });

  it("rejects fields exceeding database column lengths", () => {
    expect(
      parseCreateEnderecoInput({
        ...validAddress,
        logradouro: "a".repeat(192),
      }),
    ).toMatchObject({ success: false });
    expect(
      parseCreateEnderecoInput({ ...validAddress, numero: "1".repeat(11) }),
    ).toMatchObject({ success: false });
    expect(
      parseCreateEnderecoInput({ ...validAddress, bairro: "a".repeat(46) }),
    ).toMatchObject({ success: false });
  });

  it("allows clearing the complement and rejects empty updates", () => {
    expect(parseUpdateEnderecoInput({ complemento: null })).toEqual({
      success: true,
      data: { complemento: null },
    });
    expect(parseUpdateEnderecoInput({})).toMatchObject({ success: false });
    expect(parseUpdateEnderecoInput({ cep: "123" })).toMatchObject({
      success: false,
    });
  });
});
