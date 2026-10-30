import type {
  CreateEnderecoDTO,
  UpdateEnderecoDTO,
} from "@/types/endereco";

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyFields(value: Record<string, unknown>): boolean {
  const allowedFields = [
    "logradouro",
    "numero",
    "complemento",
    "bairro",
    "cep",
    "cidadeId",
  ];
  return Object.keys(value).every((key) => allowedFields.includes(key));
}

function isValidText(value: unknown, maxLength: number): value is string {
  return (
    typeof value === "string" &&
    value.trim().length >= 1 &&
    value.trim().length <= maxLength
  );
}

function isValidComplemento(value: unknown): value is string | null {
  return (
    value === null ||
    (typeof value === "string" &&
      value.trim().length >= 1 &&
      value.trim().length <= 45)
  );
}

function isValidCep(value: unknown): value is string {
  return typeof value === "string" && /^\d{5}-?\d{3}$/.test(value.trim());
}

function isValidCidadeId(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0
  );
}

function normalizeCep(cep: string): string {
  return cep.trim().replace("-", "");
}

function invalidFields(): ValidationResult<never> {
  return {
    success: false,
    error: "Dados inválidos ou campos não permitidos.",
  };
}

export function parseCreateEnderecoInput(
  value: unknown,
): ValidationResult<CreateEnderecoDTO> {
  if (!isRecord(value) || !hasOnlyFields(value)) {
    return invalidFields();
  }

  if (!isValidText(value.logradouro, 191)) {
    return {
      success: false,
      error: "Logradouro deve ter de 1 a 191 caracteres.",
    };
  }

  if (!isValidText(value.numero, 10)) {
    return {
      success: false,
      error: "Número deve ter de 1 a 10 caracteres.",
    };
  }

  if (!isValidText(value.bairro, 45)) {
    return {
      success: false,
      error: "Bairro deve ter de 1 a 45 caracteres.",
    };
  }

  if (!isValidCep(value.cep)) {
    return {
      success: false,
      error: "CEP deve conter oito dígitos, com hífen opcional.",
    };
  }

  if (!isValidCidadeId(value.cidadeId)) {
    return {
      success: false,
      error: "Cidade deve ser um ID inteiro positivo.",
    };
  }

  if ("complemento" in value && !isValidComplemento(value.complemento)) {
    return {
      success: false,
      error: "Complemento deve ter de 1 a 45 caracteres ou ser nulo.",
    };
  }

  const data: CreateEnderecoDTO = {
    logradouro: value.logradouro.trim(),
    numero: value.numero.trim(),
    bairro: value.bairro.trim(),
    cep: normalizeCep(value.cep),
    cidadeId: value.cidadeId,
  };

  if ("complemento" in value) {
    if (value.complemento === null) {
      data.complemento = null;
    } else if (typeof value.complemento === "string") {
      data.complemento = value.complemento.trim();
    }
  }

  return { success: true, data };
}

export function parseUpdateEnderecoInput(
  value: unknown,
): ValidationResult<UpdateEnderecoDTO> {
  if (!isRecord(value) || !hasOnlyFields(value)) {
    return invalidFields();
  }

  if (Object.keys(value).length === 0) {
    return {
      success: false,
      error: "Informe ao menos um campo para atualizar.",
    };
  }

  const data: UpdateEnderecoDTO = {};

  if ("logradouro" in value) {
    if (!isValidText(value.logradouro, 191)) {
      return {
        success: false,
        error: "Logradouro deve ter de 1 a 191 caracteres.",
      };
    }
    data.logradouro = value.logradouro.trim();
  }

  if ("numero" in value) {
    if (!isValidText(value.numero, 10)) {
      return {
        success: false,
        error: "Número deve ter de 1 a 10 caracteres.",
      };
    }
    data.numero = value.numero.trim();
  }

  if ("complemento" in value) {
    if (!isValidComplemento(value.complemento)) {
      return {
        success: false,
        error: "Complemento deve ter de 1 a 45 caracteres ou ser nulo.",
      };
    }
    data.complemento =
      typeof value.complemento === "string"
        ? value.complemento.trim()
        : value.complemento;
  }

  if ("bairro" in value) {
    if (!isValidText(value.bairro, 45)) {
      return {
        success: false,
        error: "Bairro deve ter de 1 a 45 caracteres.",
      };
    }
    data.bairro = value.bairro.trim();
  }

  if ("cep" in value) {
    if (!isValidCep(value.cep)) {
      return {
        success: false,
        error: "CEP deve conter oito dígitos, com hífen opcional.",
      };
    }
    data.cep = normalizeCep(value.cep);
  }

  if ("cidadeId" in value) {
    if (!isValidCidadeId(value.cidadeId)) {
      return {
        success: false,
        error: "Cidade deve ser um ID inteiro positivo.",
      };
    }
    data.cidadeId = value.cidadeId;
  }

  return { success: true, data };
}
