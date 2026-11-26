import { describe, expect, it } from "vitest";
import { stageDateError } from "./etapa-cronograma-validation";

const planned = { dataInicioPrevista: "2026-11-25", dataFimPrevista: "2026-11-26" };

describe("datas do cronograma", () => {
  it("exige fim previsto estritamente posterior ao início", () => {
    expect(stageDateError(planned)).toBeNull();
    expect(stageDateError({ ...planned, dataFimPrevista: "2026-11-25" })).toBeTruthy();
    expect(stageDateError({ ...planned, dataFimPrevista: "2026-11-24" })).toBeTruthy();
  });

  it("exige início real anterior quando há fim real", () => {
    expect(stageDateError({ ...planned, dataFimReal: "2026-11-26" })).toBeTruthy();
    expect(stageDateError({ ...planned, dataInicioReal: "2026-11-26", dataFimReal: "2026-11-26" })).toBeTruthy();
    expect(stageDateError({ ...planned, dataInicioReal: "2026-11-25", dataFimReal: "2026-11-26" })).toBeNull();
  });
});
