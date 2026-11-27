import { ContatoRepository } from "@/repositories/contato.repository";
import type { ListQuery } from "@/lib/pagination";
import { motivosContato, type MotivoContato } from "@/types/contato";

const repository = new ContatoRepository();

export function parseContato(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const text = (key: string) => {
    const value = (body as Record<string, unknown>)[key];
    return typeof value === "string" ? value.trim() : "";
  };
  const nome = text("nome");
  const email = text("email");
  const phone = text("telefone");
  const telefone = phone.replace(/\D/g, "");
  const motivo = text("motivo");
  const mensagem = text("mensagem");
  if (
    nome.length < 2 || nome.length > 120 ||
    email.length > 191 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !/^[\d()\s-]+$/.test(phone) || !/^\d{10,11}$/.test(telefone) ||
    !Object.hasOwn(motivosContato, motivo) || !mensagem || mensagem.length > 3000
  ) return null;
  return { nome, email, telefone, motivo: motivo as MotivoContato, mensagem };
}

export function createContact(data: NonNullable<ReturnType<typeof parseContato>>) {
  return repository.create(data);
}

export function listContacts(query: ListQuery) {
  return repository.findAll(query);
}
