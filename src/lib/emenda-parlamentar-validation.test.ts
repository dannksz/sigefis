import { describe, expect, it } from "vitest";
import {
  parseCreateEmendaParlamentarInput,
  parseUpdateEmendaParlamentarInput,
} from "./emenda-parlamentar-validation";

describe("parliamentary amendment validation", () => {
  const validAmendment = {
    numero: "EM-2026-001",
    autor: "Deputado Ana Souza",
    valor: "25000.5",
    verbaId: 1,
  };

  it("normalizes valid values", () => {
    expect(parseCreateEmendaParlamentarInput(validAmendment)).toEqual({
      success: true,
      data: { ...validAmendment, valor: "25000.50" },
    });
  });

  it("rejects invalid and unknown values", () => {
    expect(
      parseCreateEmendaParlamentarInput({ ...validAmendment, valor: "0" }),
    ).toMatchObject({ success: false });
    expect(
      parseCreateEmendaParlamentarInput({ ...validAmendment, unknown: true }),
    ).toMatchObject({ success: false });
  });

  it("accepts partial updates", () => {
    expect(parseUpdateEmendaParlamentarInput({ autor: "Novo autor" })).toEqual({
      success: true,
      data: { autor: "Novo autor" },
    });
  });
});
