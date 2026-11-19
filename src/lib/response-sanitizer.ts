import type { UserRole } from "@/types/user";

export type ResponseRole = UserRole | null;

export function getResponseRole(request: Request): ResponseRole {
  const role = request.headers.get("x-auth-role");
  return role === "ADMIN" || role === "GESTOR" ||
    role === "FISCAL" || role === "USER"
    ? role
    : null;
}

export function sanitizeContaBancaria<T extends {
  banco: string;
  agencia: string;
  numeroConta: string;
  tipoConta: string;
  orgaoPublicoId: number;
  projetoObraId: number;
  id?: number;
}>(item: T, role: ResponseRole): T {
  if (role === "ADMIN" || role === "GESTOR") return item;
  return {
    ...item,
    agencia: "***",
    numeroConta: "***",
  };
}

export function sanitizeContaBancariaList<
  T extends {
    banco: string;
    agencia: string;
    numeroConta: string;
    tipoConta: string;
    orgaoPublicoId: number;
    projetoObraId: number;
    id?: number;
  },
>(items: T[], role: ResponseRole): T[] {
  return items.map((item) => sanitizeContaBancaria(item, role));
}

export function sanitizeEmpresa<T extends {
  id: number;
  nome: string;
  cnpj: string;
  representanteLegal: string;
  telefone: string;
  email: string;
  enderecoId: number;
}>(item: T, role: ResponseRole): T {
  if (role === "ADMIN" || role === "GESTOR") return item;
  return {
    ...item,
    cnpj: `${item.cnpj.slice(0, 2)}.***.***/****-${item.cnpj.slice(-2)}`,
    representanteLegal: "***",
    telefone: "***",
    email: "***",
  };
}

export function sanitizeEmpresaList<
  T extends {
    id: number;
    nome: string;
    cnpj: string;
    representanteLegal: string;
    telefone: string;
    email: string;
    enderecoId: number;
  },
>(items: T[], role: ResponseRole): T[] {
  return items.map((item) => sanitizeEmpresa(item, role));
}
