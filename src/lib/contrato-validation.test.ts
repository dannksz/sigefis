import { describe, expect, it } from "vitest";
import {
  parseCreateContratoInput,
  parseUpdateContratoInput,
} from "./contrato-validation";

describe("contract request validation", () => {
  const validContract = {
    numeroContrato: "CT-2026/001",
    valorContrato: "125000.5",
    dataAssinatura: "2026-01-10",
    dataInicio: "2026-02-01",
    dataFim: "2026-12-31",
    projetoObraId: 1,
    empresaId: 1,
    verbaPublicaId: 1,
  };

  it("normalizes valid money and text values", () => {
    expect(
      parseCreateContratoInput({
        ...validContract,
        numeroContrato: " CT-2026/001 ",
      }),
    ).toEqual({
      success: true,
      data: { ...validContract, numeroContrato: "CT-2026/001", valorContrato: "125000.50" },
    });
  });

  it("rejects invalid dates, references, money, and date order", () => {
    expect(
      parseCreateContratoInput({ ...validContract, dataFim: "2026-02-30" }),
    ).toMatchObject({ success: false });
    expect(
      parseCreateContratoInput({ ...validContract, dataInicio: "2027-01-01" }),
    ).toMatchObject({ success: false });
    expect(
      parseCreateContratoInput({ ...validContract, valorContrato: "10000000000.00" }),
    ).toMatchObject({ success: false });
    expect(
      parseCreateContratoInput({ ...validContract, empresaId: 0 }),
    ).toMatchObject({ success: false });
  });

  it("accepts partial updates and rejects empty updates", () => {
    expect(parseUpdateContratoInput({ valorContrato: 100.25 })).toEqual({
      success: true,
      data: { valorContrato: "100.25" },
    });
    expect(parseUpdateContratoInput({})).toMatchObject({ success: false });
  });
});
