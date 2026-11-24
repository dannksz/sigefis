import { describe, expect, it } from "vitest";
import {
  parseCreateProjetoInput,
  parseUpdateProjetoInput,
} from "./projeto-validation";

describe("project request validation", () => {
  it("valida o vínculo opcional com o órgão responsável", () => {
    expect(parseUpdateProjetoInput({ orgaoResponsavelId: 2 })).toMatchObject({
      success: true, data: { orgaoResponsavelId: 2 },
    });
    expect(parseUpdateProjetoInput({ orgaoResponsavelId: null })).toMatchObject({ success: true });
    expect(parseUpdateProjetoInput({ orgaoResponsavelId: "2" })).toMatchObject({ success: false });
  });
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

  it("accepts calendar dates and null for the expected completion date", () => {
    expect(parseCreateProjetoInput({ ...validProject, dataConclusao: "2028-02-29" }))
      .toMatchObject({ success: true, data: { dataConclusao: "2028-02-29" } });
    expect(parseCreateProjetoInput({ ...validProject, dataConclusao: "2027-02-29" }))
      .toMatchObject({ success: false });
    expect(parseUpdateProjetoInput({ dataConclusao: null }))
      .toEqual({ success: true, data: { dataConclusao: null } });
  });

  it("accepts a complete nested address and rejects ambiguous address input", () => {
    const project = {
      nome: validProject.nome,
      descricao: validProject.descricao,
      finalidade: validProject.finalidade,
    };
    const endereco = {
      logradouro: "Rua das Flores",
      numero: "100",
      complemento: "Bloco A",
      bairro: "Centro",
      cep: "13010-000",
      cidadeId: 1,
    };
    expect(parseCreateProjetoInput({ ...project, endereco })).toMatchObject({
      success: true,
      data: { endereco: { ...endereco, cep: "13010000" } },
    });
    expect(parseCreateProjetoInput({ ...validProject, endereco })).toMatchObject({ success: false });
    expect(parseCreateProjetoInput(project)).toMatchObject({ success: false });
    expect(parseUpdateProjetoInput({ endereco })).toMatchObject({ success: true });
    expect(parseCreateProjetoInput({
      ...project,
      endereco: {
        logradouro: "Rua Nova",
        numero: "10",
        bairro: "Centro",
        cep: "80000000",
        cidade: { nome: "Curitiba", estadoId: 18 },
      },
    })).toMatchObject({
      success: true,
      data: { endereco: { cidade: { nome: "Curitiba", estadoId: 18 } } },
    });
  });
});
