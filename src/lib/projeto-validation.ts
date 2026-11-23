import type { CreateProjetoDTO, UpdateProjetoDTO } from "@/types/projeto";

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyFields(value: Record<string, unknown>, update = false): boolean {
  const allowedFields = ["nome", "descricao", "finalidade", "enderecoId", "dataConclusao"];
  return Object.keys(value).every((key) => allowedFields.includes(key) || (update && key === "publicado"));
}

function isValidDataConclusao(value: unknown): value is string | null {
  if (value === null) return true;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value < "1000-01-01") {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isValidText(value: unknown, maxLength: number): value is string {
  return (
    typeof value === "string" &&
    value.trim().length >= 1 &&
    value.trim().length <= maxLength
  );
}

function isValidEnderecoId(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0
  );
}

function invalidFields(): ValidationResult<never> {
  return {
    success: false,
    error: "Dados inválidos ou campos não permitidos.",
  };
}

export function parseCreateProjetoInput(
  value: unknown,
): ValidationResult<CreateProjetoDTO> {
  if (!isRecord(value) || !hasOnlyFields(value)) {
    return invalidFields();
  }

  if (!isValidText(value.nome, 45)) {
    return { success: false, error: "Nome deve ter de 1 a 45 caracteres." };
  }

  if (!isValidText(value.descricao, 250)) {
    return {
      success: false,
      error: "Descrição deve ter de 1 a 250 caracteres.",
    };
  }

  if (!isValidText(value.finalidade, 45)) {
    return {
      success: false,
      error: "Finalidade deve ter de 1 a 45 caracteres.",
    };
  }

  if (!isValidEnderecoId(value.enderecoId)) {
    return {
      success: false,
      error: "Endereço deve ser um ID inteiro positivo.",
    };
  }
  const { dataConclusao } = value;
  if (dataConclusao !== undefined && !isValidDataConclusao(dataConclusao)) {
    return { success: false, error: "Informe uma data de conclusão válida em YYYY-MM-DD ou null." };
  }

  return {
    success: true,
    data: {
      nome: value.nome.trim(),
      descricao: value.descricao.trim(),
      finalidade: value.finalidade.trim(),
      enderecoId: value.enderecoId,
      ...(dataConclusao !== undefined && { dataConclusao }),
    },
  };
}

export function parseUpdateProjetoInput(
  value: unknown,
): ValidationResult<UpdateProjetoDTO> {
  if (!isRecord(value) || !hasOnlyFields(value, true)) {
    return invalidFields();
  }

  if (Object.keys(value).length === 0) {
    return {
      success: false,
      error: "Informe ao menos um campo para atualizar.",
    };
  }

  const data: Partial<UpdateProjetoDTO> = {};
  if ("dataConclusao" in value) {
    if (!isValidDataConclusao(value.dataConclusao)) {
      return { success: false, error: "Informe uma data de conclusão válida em YYYY-MM-DD ou null." };
    }
    data.dataConclusao = value.dataConclusao;
  }
  if ("publicado" in value) {
    if (typeof value.publicado !== "boolean") return invalidFields();
    data.publicado = value.publicado;
  }

  if ("nome" in value) {
    if (!isValidText(value.nome, 45)) {
      return { success: false, error: "Nome deve ter de 1 a 45 caracteres." };
    }
    data.nome = value.nome.trim();
  }

  if ("descricao" in value) {
    if (!isValidText(value.descricao, 250)) {
      return {
        success: false,
        error: "Descrição deve ter de 1 a 250 caracteres.",
      };
    }
    data.descricao = value.descricao.trim();
  }

  if ("finalidade" in value) {
    if (!isValidText(value.finalidade, 45)) {
      return {
        success: false,
        error: "Finalidade deve ter de 1 a 45 caracteres.",
      };
    }
    data.finalidade = value.finalidade.trim();
  }

  if ("enderecoId" in value) {
    if (!isValidEnderecoId(value.enderecoId)) {
      return {
        success: false,
        error: "Endereço deve ser um ID inteiro positivo.",
      };
    }
    data.enderecoId = value.enderecoId;
  }

  return { success: true, data: data as UpdateProjetoDTO };
}
