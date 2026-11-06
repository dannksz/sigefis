import type { CreateEmpresaDTO, UpdateEmpresaDTO } from "@/types/empresa";

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyFields(value: Record<string, unknown>): boolean {
  const allowedFields = [
    "nome",
    "cnpj",
    "representanteLegal",
    "telefone",
    "email",
    "enderecoId",
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

function isValidEnderecoId(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0
  );
}

function normalizeCnpj(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  return digits.length === 14 ? digits : null;
}

function isValidEmail(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length <= 191 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  );
}

function isValidCnpj(value: unknown): value is string {
  return typeof value === "string" && normalizeCnpj(value) !== null;
}

function invalidFields(): ValidationResult<never> {
  return {
    success: false,
    error: "Dados inválidos ou campos não permitidos.",
  };
}

function parseCnpj(value: unknown): string | null {
  return isValidCnpj(value) ? normalizeCnpj(value) : null;
}

export function parseCreateEmpresaInput(
  value: unknown,
): ValidationResult<CreateEmpresaDTO> {
  if (!isRecord(value) || !hasOnlyFields(value)) {
    return invalidFields();
  }

  const cnpj = parseCnpj(value.cnpj);
  if (
    !isValidText(value.nome, 191) ||
    !isValidText(value.representanteLegal, 191) ||
    !isValidText(value.telefone, 20) ||
    !isValidEmail(value.email) ||
    cnpj === null ||
    !isValidEnderecoId(value.enderecoId)
  ) {
    return {
      success: false,
      error:
        "Informe nome, representante legal, telefone, e-mail, CNPJ e endereço válidos.",
    };
  }

  return {
    success: true,
    data: {
      nome: value.nome.trim(),
      cnpj,
      representanteLegal: value.representanteLegal.trim(),
      telefone: value.telefone.trim(),
      email: value.email.trim().toLowerCase(),
      enderecoId: value.enderecoId,
    },
  };
}

export function parseUpdateEmpresaInput(
  value: unknown,
): ValidationResult<UpdateEmpresaDTO> {
  if (!isRecord(value) || !hasOnlyFields(value)) {
    return invalidFields();
  }

  if (Object.keys(value).length === 0) {
    return {
      success: false,
      error: "Informe ao menos um campo para atualizar.",
    };
  }

  const data: UpdateEmpresaDTO = {};

  if ("nome" in value) {
    if (!isValidText(value.nome, 191)) {
      return { success: false, error: "Nome deve ter de 1 a 191 caracteres." };
    }
    data.nome = value.nome.trim();
  }

  if ("cnpj" in value) {
    const cnpj = parseCnpj(value.cnpj);
    if (cnpj === null) {
      return { success: false, error: "CNPJ deve conter 14 dígitos." };
    }
    data.cnpj = cnpj;
  }

  if ("representanteLegal" in value) {
    if (!isValidText(value.representanteLegal, 191)) {
      return {
        success: false,
        error: "Representante legal deve ter de 1 a 191 caracteres.",
      };
    }
    data.representanteLegal = value.representanteLegal.trim();
  }

  if ("telefone" in value) {
    if (!isValidText(value.telefone, 20)) {
      return { success: false, error: "Telefone deve ter de 1 a 20 caracteres." };
    }
    data.telefone = value.telefone.trim();
  }

  if ("email" in value) {
    if (!isValidEmail(value.email)) {
      return { success: false, error: "E-mail inválido." };
    }
    data.email = value.email.trim().toLowerCase();
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

  return { success: true, data };
}
