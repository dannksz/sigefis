import type { CreateUserDTO, UpdateUserDTO } from "../types/user";
import { isUserRole } from "./auth-policy";

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

type CreateUserInput = Omit<CreateUserDTO, "role">;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ISO_DATE_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})(?:T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?(?:Z|[+-](?:0\d|1[0-4]):[0-5]\d)?)?$/;
const CREATE_FIELDS = new Set([
  "nome",
  "email",
  "senha",
  "cpf",
  "cnpj",
  "dataNascimento",
  "enderecoId",
]);
const UPDATE_FIELDS = new Set([...CREATE_FIELDS, "role"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyFields(
  value: Record<string, unknown>,
  allowedFields: Set<string>,
): boolean {
  return Object.keys(value).every((key) => allowedFields.has(key));
}

function validEmail(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= 191 &&
    EMAIL_PATTERN.test(value.trim())
  );
}

function validPassword(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= 8 &&
    Buffer.byteLength(value, "utf8") <= 72
  );
}

function validName(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= 191
  );
}

function validCpf(value: unknown): value is string {
  return typeof value === "string" && /^\d{11}$/.test(value);
}

function validCnpj(value: unknown): value is string {
  return typeof value === "string" && /^\d{14}$/.test(value);
}

function validDate(value: unknown): value is string | Date | null {
  if (value === null || value instanceof Date) {
    return value === null || !Number.isNaN(value.getTime());
  }
  if (typeof value !== "string") {
    return false;
  }
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match || Number.isNaN(Date.parse(value))) {
    return false;
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const calendarDate = new Date(Date.UTC(year, month - 1, day));
  return (
    calendarDate.getUTCFullYear() === year &&
    calendarDate.getUTCMonth() === month - 1 &&
    calendarDate.getUTCDate() === day
  );
}

function validAddressId(value: unknown): value is number | null {
  return (
    value === null ||
    (typeof value === "number" && Number.isSafeInteger(value) && value > 0)
  );
}

export function parseLoginInput(
  value: unknown,
): ValidationResult<{ email: string; senha: string }> {
  if (
    !isRecord(value) ||
    !validEmail(value.email) ||
    typeof value.senha !== "string" ||
    value.senha.length === 0
  ) {
    return { success: false, error: "Email e senha válidos são obrigatórios." };
  }

  return {
    success: true,
    data: { email: value.email.trim().toLowerCase(), senha: value.senha },
  };
}

export function parseCreateUserInput(
  value: unknown,
): ValidationResult<CreateUserInput> {
  if (!isRecord(value) || !hasOnlyFields(value, CREATE_FIELDS)) {
    return {
      success: false,
      error: "Dados inválidos ou campos não permitidos no cadastro.",
    };
  }

  if (
    !validName(value.nome) ||
    !validEmail(value.email) ||
    !validPassword(value.senha) ||
    !validCpf(value.cpf)
  ) {
    return {
      success: false,
      error: "Nome, email, senha ou CPF inválido.",
    };
  }

  const cnpj = value.cnpj;
  if (cnpj !== undefined && cnpj !== null && !validCnpj(cnpj)) {
    return { success: false, error: "CNPJ deve conter 14 dígitos." };
  }
  let dataNascimento: CreateUserInput["dataNascimento"];
  if ("dataNascimento" in value) {
    if (!validDate(value.dataNascimento)) {
      return { success: false, error: "Data de nascimento inválida." };
    }
    dataNascimento = value.dataNascimento;
  }
  let enderecoId: CreateUserInput["enderecoId"];
  if ("enderecoId" in value) {
    if (!validAddressId(value.enderecoId)) {
      return { success: false, error: "ID de endereço inválido." };
    }
    enderecoId = value.enderecoId;
  }

  return {
    success: true,
    data: {
      nome: value.nome.trim(),
      email: value.email.trim().toLowerCase(),
      senha: value.senha,
      cpf: value.cpf,
      ...("cnpj" in value && { cnpj }),
      ...(dataNascimento !== undefined && { dataNascimento }),
      ...(enderecoId !== undefined && { enderecoId }),
    },
  };
}

export function parseUpdateUserInput(
  value: unknown,
): ValidationResult<UpdateUserDTO> {
  if (!isRecord(value) || !hasOnlyFields(value, UPDATE_FIELDS)) {
    return {
      success: false,
      error: "Dados inválidos ou campos não permitidos na atualização.",
    };
  }
  if (Object.keys(value).length === 0) {
    return { success: false, error: "Informe ao menos um campo para atualizar." };
  }

  const data: UpdateUserDTO = {};
  if ("nome" in value) {
    if (!validName(value.nome)) {
      return { success: false, error: "Nome inválido." };
    }
    data.nome = value.nome.trim();
  }
  if ("email" in value) {
    if (!validEmail(value.email)) {
      return { success: false, error: "Email inválido." };
    }
    data.email = value.email.trim().toLowerCase();
  }
  if ("senha" in value) {
    if (!validPassword(value.senha)) {
      return {
        success: false,
        error: "A senha deve ter ao menos 8 caracteres e no máximo 72 bytes.",
      };
    }
    data.senha = value.senha;
  }
  if ("cpf" in value) {
    if (!validCpf(value.cpf)) {
      return { success: false, error: "CPF deve conter 11 dígitos." };
    }
    data.cpf = value.cpf;
  }
  if ("cnpj" in value) {
    if (value.cnpj !== null && !validCnpj(value.cnpj)) {
      return { success: false, error: "CNPJ deve conter 14 dígitos." };
    }
    data.cnpj = value.cnpj;
  }
  if ("dataNascimento" in value) {
    if (!validDate(value.dataNascimento)) {
      return { success: false, error: "Data de nascimento inválida." };
    }
    data.dataNascimento = value.dataNascimento;
  }
  if ("enderecoId" in value) {
    if (!validAddressId(value.enderecoId)) {
      return { success: false, error: "ID de endereço inválido." };
    }
    data.enderecoId = value.enderecoId;
  }
  if ("role" in value) {
    if (!isUserRole(value.role)) {
      return { success: false, error: "Papel de usuário inválido." };
    }
    data.role = value.role;
  }

  return { success: true, data };
}
