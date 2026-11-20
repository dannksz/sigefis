import type {
  CreateContaBancariaDTO,
  UpdateContaBancariaDTO,
} from "@/types/conta-bancaria";

type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function id(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function text(value: unknown, maxLength: number): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= maxLength
  );
}

const allowedFields = [
  "banco",
  "agencia",
  "numeroConta",
  "tipoConta",
  "orgaoPublicoId",
  "projetoObraId",
];

function hasOnlyFields(value: Record<string, unknown>): boolean {
  return Object.keys(value).every((key) => allowedFields.includes(key));
}

export function parseCreateContaBancariaInput(
  value: unknown,
): Result<CreateContaBancariaDTO> {
  if (!record(value) || !hasOnlyFields(value)) {
    return { success: false, error: "Dados inválidos ou campos não permitidos." };
  }

  if (
    !text(value.banco, 100) ||
    !text(value.agencia, 20) ||
    !text(value.numeroConta, 30) ||
    !text(value.tipoConta, 45) ||
    !id(value.orgaoPublicoId) ||
    !id(value.projetoObraId)
  ) {
    return { success: false, error: "Informe banco, conta, tipo e referências válidos." };
  }

  return {
    success: true,
    data: {
      banco: value.banco.trim(),
      agencia: value.agencia.trim(),
      numeroConta: value.numeroConta.trim(),
      tipoConta: value.tipoConta.trim(),
      orgaoPublicoId: value.orgaoPublicoId,
      projetoObraId: value.projetoObraId,
    },
  };
}

export function parseUpdateContaBancariaInput(
  value: unknown,
): Result<UpdateContaBancariaDTO> {
  if (!record(value) || !hasOnlyFields(value)) {
    return { success: false, error: "Dados inválidos ou campos não permitidos." };
  }
  if (Object.keys(value).length === 0) {
    return { success: false, error: "Informe ao menos um campo para atualizar." };
  }

  const data: Partial<UpdateContaBancariaDTO> = {};
  const textFields = [
    ["banco", 100],
    ["agencia", 20],
    ["numeroConta", 30],
    ["tipoConta", 45],
  ] as const;

  for (const [field, maxLength] of textFields) {
    if (field in value) {
      if (!text(value[field], maxLength)) {
        return { success: false, error: `Campo ${field} inválido.` };
      }
      data[field] = value[field].trim();
    }
  }

  for (const field of ["orgaoPublicoId", "projetoObraId"] as const) {
    if (field in value) {
      if (!id(value[field])) {
        return { success: false, error: `ID de ${field} inválido.` };
      }
      data[field] = value[field];
    }
  }

  return { success: true, data: data as UpdateContaBancariaDTO };
}
