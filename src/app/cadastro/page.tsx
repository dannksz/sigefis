"use client";

import { useToast } from "@/components/Toast/ToastContext";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import MainTemplate from "@/templates/MainTemplate/Index";

type FormData = {
  nome: string;
  email: string;
  cpf: string;
  cnpj: string;
  dataNascimento: string;
  senha: string;
  confirmarSenha: string;
};

const initialForm: FormData = { nome: "", email: "", cpf: "", cnpj: "", dataNascimento: "", senha: "", confirmarSenha: "" };

function digits(value: string, maxLength: number) { return value.replace(/\D/g, "").slice(0, maxLength); }
function formatCpf(value: string) {
  return digits(value, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
function formatCnpj(value: string) {
  return digits(value, 14).replace(/(\d{2})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1/$2").replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}
function responseError(value: unknown) {
  if (value && typeof value === "object" && "error" in value && typeof value.error === "string") return value.error;
  return "Não foi possível realizar o cadastro.";
}

const inputClass = "peer w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition-all duration-200 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-wait disabled:opacity-70";
const labelClass = "absolute -top-3 left-3 bg-white px-2 text-sm font-medium text-gray-600";

export default function CadastroPage() {
  const { showToast } = useToast();
  const [form, setForm] = useState<FormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  function update(field: keyof FormData, value: string) {
    const formatted = field === "cpf" ? formatCpf(value) : field === "cnpj" ? formatCnpj(value) : value;
    setForm((current) => ({ ...current, [field]: formatted }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setMessage("");
    setSuccess(false);

    const cpf = digits(form.cpf, 11);
    const cnpj = digits(form.cnpj, 14);
    if (cpf.length !== 11) return setMessage("O CPF deve conter 11 dígitos.");
    if (cnpj && cnpj.length !== 14) return setMessage("O CNPJ deve conter 14 dígitos.");
    if (form.senha !== form.confirmarSenha) return setMessage("As senhas não coincidem.");
    if (form.senha.length < 8) return setMessage("A senha deve ter pelo menos 8 caracteres.");
    if (new TextEncoder().encode(form.senha).length > 72) return setMessage("A senha deve ter no máximo 72 bytes.");

    setLoading(true);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome.trim(),
          email: form.email.trim().toLocaleLowerCase("pt-BR"),
          senha: form.senha,
          cpf,
          ...(cnpj && { cnpj }),
          ...(form.dataNascimento && { dataNascimento: form.dataNascimento }),
        }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(responseError(data));
        return;
      }
      showToast("Cadastro realizado com sucesso.", "success");
      setSuccess(true);
      setMessage("Cadastro realizado com sucesso! Você já pode fazer login.");
      setForm(initialForm);
    } catch {
      setMessage("Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <MainTemplate>
      <div className="flex min-h-[calc(100dvh-238px)] w-full flex-col items-center bg-white px-4 py-16">
        <div className="w-full max-w-5xl">
          <h1 className="mb-8 text-3xl font-bold text-gray-800 md:mb-12 md:text-4xl lg:text-5xl">Cadastre-se</h1>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md md:p-8">
            <form onSubmit={handleSubmit}>
              {message && <div role="alert" aria-live="polite" className={`mb-8 rounded-md border p-4 text-center ${success ? "border-green-300 bg-green-100 text-green-800" : "border-red-300 bg-red-100 text-red-800"}`}>{message}</div>}

              <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
                <div className="relative"><input id="cadastro-nome" name="nome" type="text" autoComplete="name" value={form.nome} onChange={(event) => update("nome", event.target.value)} required maxLength={191} disabled={loading} className={inputClass} placeholder=" " /><label htmlFor="cadastro-nome" className={labelClass}>Nome completo <span className="text-red-500">*</span></label></div>
                <div className="relative"><input id="cadastro-email" name="email" type="email" autoComplete="email" value={form.email} onChange={(event) => update("email", event.target.value)} required maxLength={191} disabled={loading} className={inputClass} placeholder=" " /><label htmlFor="cadastro-email" className={labelClass}>E-mail <span className="text-red-500">*</span></label></div>
              </div>

              <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
                <div className="relative"><input id="cadastro-cpf" name="cpf" type="text" inputMode="numeric" autoComplete="off" value={form.cpf} onChange={(event) => update("cpf", event.target.value)} required maxLength={14} disabled={loading} className={inputClass} placeholder=" " /><label htmlFor="cadastro-cpf" className={labelClass}>CPF <span className="text-red-500">*</span></label></div>
                <div className="relative"><input id="cadastro-cnpj" name="cnpj" type="text" inputMode="numeric" autoComplete="off" value={form.cnpj} onChange={(event) => update("cnpj", event.target.value)} maxLength={18} disabled={loading} className={inputClass} placeholder=" " /><label htmlFor="cadastro-cnpj" className={labelClass}>CNPJ (opcional)</label></div>
                <div className="relative"><input id="cadastro-nascimento" name="dataNascimento" type="date" autoComplete="bday" value={form.dataNascimento} onChange={(event) => update("dataNascimento", event.target.value)} disabled={loading} className={inputClass} /><label htmlFor="cadastro-nascimento" className={labelClass}>Data de nascimento</label></div>
              </div>

              <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
                <div className="relative"><input id="cadastro-senha" name="senha" type="password" autoComplete="new-password" value={form.senha} onChange={(event) => update("senha", event.target.value)} required minLength={8} disabled={loading} className={inputClass} placeholder=" " /><label htmlFor="cadastro-senha" className={labelClass}>Senha <span className="text-red-500">*</span></label></div>
                <div className="relative"><input id="cadastro-confirmar-senha" name="confirmarSenha" type="password" autoComplete="new-password" value={form.confirmarSenha} onChange={(event) => update("confirmarSenha", event.target.value)} required minLength={8} disabled={loading} className={inputClass} placeholder=" " /><label htmlFor="cadastro-confirmar-senha" className={labelClass}>Confirmar senha <span className="text-red-500">*</span></label></div>
              </div>

              <div className="flex w-full justify-center md:justify-end">
                <button type="submit" disabled={loading} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 text-base font-semibold text-secondary shadow-lg transition-all duration-300 hover:gap-3 hover:bg-primary-dark hover:shadow-xl disabled:cursor-wait disabled:bg-gray-400 disabled:text-white md:w-auto md:px-12 md:text-lg">{loading ? "CADASTRANDO..." : "CADASTRAR"}<ChevronRight className="size-5" aria-hidden="true" /></button>
              </div>
            </form>
          </div>

          <div className="mt-8 text-center text-gray-600">Já possui uma conta?&nbsp;<Link href="/login" className="font-semibold text-blue-600 underline transition-colors hover:text-blue-800">Faça login</Link></div>
        </div>
      </div>
    </MainTemplate>
  );
}
