import { describe, expect, it } from "vitest";
import {
  parseCreateVerbaPublicaInput,
  parseUpdateVerbaPublicaInput,
} from "./verba-publica-validation";

describe("public fund request validation", () => {
  const validFund = {
    valor: "150000.5",
    origem: "Fundo estadual",
    finalidade: "Execução de obra pública",
    orgaoId: 1,
  };

  it("normalizes valid values", () => {
    expect(parseCreateVerbaPublicaInput(validFund)).toEqual({
      success: true,
      data: { ...validFund, valor: "150000.50" },
    });
  });

  it("rejects invalid values and unknown fields", () => {
    expect(
      parseCreateVerbaPublicaInput({ ...validFund, valor: "0" }),
    ).toMatchObject({ success: false });
    expect(
      parseCreateVerbaPublicaInput({ ...validFund, finalidade: "a".repeat(66) }),
    ).toMatchObject({ success: false });
    expect(
      parseCreateVerbaPublicaInput({ ...validFund, extra: true }),
    ).toMatchObject({ success: false });
  });

  it("accepts valid partial updates", () => {
    expect(parseUpdateVerbaPublicaInput({ origem: "Fundo federal" })).toEqual({
      success: true,
      data: { origem: "Fundo federal" },
    });
    expect(parseUpdateVerbaPublicaInput({})).toMatchObject({ success: false });
  });
});
