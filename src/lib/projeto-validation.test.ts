import { describe, expect, it } from "vitest";
import {
  parseCreateProjetoInput,
  parseUpdateProjetoInput,
} from "./projeto-validation";

describe("project request validation", () => {
  const validProject = {
    nome: "Obra de mobilidade",
    descricao: "Implantação de melhorias viárias",
    finalidade: "Mobilidade urbana",
    enderecoId: 1,
  };

  it("normalizes valid project data", () => {
    expect(
      parseCreateProjetoInput({
        ...validProject,
        nome: " Obra de mobilidade ",
      }),
    ).toEqual({
      success: true,
      data: {
        ...validProject,
        nome: "Obra de mobilidade",
      },
    });
  });

  it("rejects missing, oversized, and invalid fields", () => {
    expect(
      parseCreateProjetoInput({ ...validProject, enderecoId: 0 }),
    ).toMatchObject({ success: false });
    expect(
      parseCreateProjetoInput({ ...validProject, descricao: " " }),
    ).toMatchObject({ success: false });
    expect(
      parseCreateProjetoInput({
        ...validProject,
        nome: "a".repeat(46),
      }),
    ).toMatchObject({ success: false });
    expect(
      parseCreateProjetoInput({ ...validProject, status: "ATIVO" }),
    ).toMatchObject({ success: false });
  });

  it("accepts valid partial updates and rejects empty updates", () => {
    expect(
      parseUpdateProjetoInput({ finalidade: "Infraestrutura" }),
    ).toEqual({
      success: true,
      data: { finalidade: "Infraestrutura" },
    });
    expect(parseUpdateProjetoInput({})).toMatchObject({ success: false });
  });
});
