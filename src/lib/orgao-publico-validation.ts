import type {
  CreateOrgaoPublicoDTO,
  UpdateOrgaoPublicoDTO,
} from "@/types/orgao-publico";

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyFields(value: Record<string, unknown>): boolean {
  const allowedFields = ["nome", "sigla", "enderecoId"];
  return Object.keys(value).every((key) => allowedFields.includes(key));
}

function isValidText(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length >= 1 &&
    value.trim().length <= 45
  );
}

function isValidEnderecoId(value: unknown): value is number | null {
  return (
    value === null ||
    (typeof value === "number" &&
      Number.isSafeInteger(value) &&
      value > 0)
  );
}

function invalidFields(): ValidationResult<never> {
  return {
    success: false,
    error: "Dados inválidos ou campos não permitidos.",
  };
}

export function parseCreateOrgaoPublicoInput(
  value: unknown,
): ValidationResult<CreateOrgaoPublicoDTO> {
  if (!isRecord(value) || !hasOnlyFields(value)) {
    return invalidFields();
  }

  if (!isValidText(value.nome)) {
    return {
      success: false,
      error: "Nome deve ter de 1 a 45 caracteres.",
    };
  }

  if (!isValidText(value.sigla)) {
    return {
      success: false,
      error: "Sigla deve ter de 1 a 45 caracteres.",
    };
  }

  if (
    "enderecoId" in value &&
    !isValidEnderecoId(value.enderecoId)
  ) {
    return {
      success: false,
      error: "Endereço deve ser um ID inteiro positivo ou nulo.",
    };
  }

  const data: CreateOrgaoPublicoDTO = {
    nome: value.nome.trim(),
    sigla: value.sigla.trim(),
  };

  if ("enderecoId" in value) {
    const enderecoId = value.enderecoId;

    if (enderecoId === null) {
      data.enderecoId = null;
    } else if (
      typeof enderecoId === "number" &&
      Number.isSafeInteger(enderecoId) &&
      enderecoId > 0
    ) {
      data.enderecoId = enderecoId;
    }
  }

  return { success: true, data };
}

export function parseUpdateOrgaoPublicoInput(
  value: unknown,
): ValidationResult<UpdateOrgaoPublicoDTO> {
  if (!isRecord(value) || !hasOnlyFields(value)) {
    return invalidFields();
  }

  if (Object.keys(value).length === 0) {
    return {
      success: false,
      error: "Informe ao menos um campo para atualizar.",
    };
  }

  const data: UpdateOrgaoPublicoDTO = {};

  if ("nome" in value) {
    if (!isValidText(value.nome)) {
      return {
        success: false,
        error: "Nome deve ter de 1 a 45 caracteres.",
      };
    }
    data.nome = value.nome.trim();
  }

  if ("sigla" in value) {
    if (!isValidText(value.sigla)) {
      return {
        success: false,
        error: "Sigla deve ter de 1 a 45 caracteres.",
      };
    }
    data.sigla = value.sigla.trim();
  }

  if ("enderecoId" in value) {
    const enderecoId = value.enderecoId;

    if (enderecoId === null) {
      data.enderecoId = null;
    } else if (
      typeof enderecoId === "number" &&
      Number.isSafeInteger(enderecoId) &&
      enderecoId > 0
    ) {
      data.enderecoId = enderecoId;
    } else {
      return {
        success: false,
        error: "Endereço deve ser um ID inteiro positivo ou nulo.",
      };
    }
  }

  return { success: true, data };
}