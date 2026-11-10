import { describe, expect, it } from "vitest";
import {
  parseCreateProjetoVerbaInput,
  parseUpdateProjetoVerbaInput,
} from "./projeto-verba-validation";

describe("project fund link validation", () => {
  it("normalizes valid allocation", () => {
    expect(
      parseCreateProjetoVerbaInput({
        projetoObraId: 1,
        verbaPublicaId: 2,
        valorAlocado: "1000.5",
      }),
    ).toMatchObject({
      success: true,
      data: { valorAlocado: "1000.50" },
    });
  });

  it("rejects invalid values and empty updates", () => {
    expect(
      parseCreateProjetoVerbaInput({
        projetoObraId: 0,
        verbaPublicaId: 2,
        valorAlocado: "10",
      }),
    ).toMatchObject({ success: false });
    expect(parseUpdateProjetoVerbaInput({})).toMatchObject({ success: false });
  });
});
