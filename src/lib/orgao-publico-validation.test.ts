import { describe, expect, it } from "vitest";
import {
  parseCreateOrgaoPublicoInput,
  parseUpdateOrgaoPublicoInput,
} from "./orgao-publico-validation";

describe("public organization request validation", () => {
  it("trims valid fields and accepts an optional address", () => {
    expect(
      parseCreateOrgaoPublicoInput({
        nome: " Secretaria de Obras ",
        sigla: " SO ",
        enderecoId: 3,
      }),
    ).toEqual({
      success: true,
      data: {
        nome: "Secretaria de Obras",
        sigla: "SO",
        enderecoId: 3,
      },
    });
  });

  it("accepts an organization without an address or with a null address", () => {
    expect(
      parseCreateOrgaoPublicoInput({ nome: "Secretaria", sigla: "SEC" }),
    ).toEqual({
      success: true,
      data: { nome: "Secretaria", sigla: "SEC" },
    });
    expect(
      parseCreateOrgaoPublicoInput({
        nome: "Secretaria",
        sigla: "SEC",
        enderecoId: null,
      }),
    ).toEqual({
      success: true,
      data: { nome: "Secretaria", sigla: "SEC", enderecoId: null },
    });
  });

  it("rejects empty or oversized text and invalid address IDs", () => {
    expect(
      parseCreateOrgaoPublicoInput({ nome: " ", sigla: "SEC" }),
    ).toMatchObject({ success: false });
    expect(
      parseCreateOrgaoPublicoInput({
        nome: "a".repeat(46),
        sigla: "SEC",
      }),
    ).toMatchObject({ success: false });
    expect(
      parseCreateOrgaoPublicoInput({
        nome: "Secretaria",
        sigla: "SEC",
        enderecoId: 0,
      }),
    ).toMatchObject({ success: false });
  });

  it("rejects unknown fields and empty updates", () => {
    expect(
      parseCreateOrgaoPublicoInput({
        nome: "Secretaria",
        sigla: "SEC",
        role: "ADMIN",
      }),
    ).toMatchObject({ success: false });
    expect(parseUpdateOrgaoPublicoInput({})).toMatchObject({
      success: false,
    });
  });

  it("allows clearing the address on update", () => {
    expect(parseUpdateOrgaoPublicoInput({ enderecoId: null })).toEqual({
      success: true,
      data: { enderecoId: null },
    });
  });
});
