"use client";

import { useToast } from "@/components/Toast/ToastContext";
import { useState, type FormEvent } from "react";
import AdminInput from "@/components/ADM/AdminInput";
import AdminAction from "@/components/ADM/AdminAction";
import { formatPhone } from "@/lib/input-masks";
import { motivosContato } from "@/types/contato";

export default function ContactForm() {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<{ error: boolean; text: string }>();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    if (!/^\d{10,11}$/.test(phone.replace(/\D/g, ""))) {
      setNotice({ error: true, text: "Informe um telefone válido com DDD." });
      return;
    }
    setSending(true);
    setNotice(undefined);
    try {
      const response = await fetch("/api/publico/contato", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(fields)),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? "Não foi possível enviar sua mensagem.");
      form.reset();
      setName("");
      setEmail("");
      setPhone("");
      showToast("Mensagem enviada com sucesso.", "success");
    } catch (error) {
      setNotice({ error: true, text: error instanceof Error ? error.message : "Não foi possível enviar sua mensagem." });
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-neutral-200 bg-white px-5 py-7 shadow-sm sm:px-8">
      <fieldset disabled={sending} className="space-y-7">
        <AdminInput label="Nome" name="nome" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={120} />
        <AdminInput label="E-mail" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" maxLength={191} />
        <AdminInput label="Telefone com DDD" name="telefone" type="tel" value={phone} onChange={(event) => setPhone(formatPhone(event.target.value))} autoComplete="tel-national" />
        <fieldset className="space-y-2.5">
          <legend className="mb-3 font-semibold">Qual o motivo do seu contato?</legend>
          {Object.entries(motivosContato).map(([key, label]) => (
            <label key={key} className="flex cursor-pointer items-center gap-2.5">
              <input type="radio" name="motivo" value={key} className="accent-secondary" required />{label}
            </label>
          ))}
        </fieldset>
        <label className="block font-medium">
          Mensagem <span className="text-red-700" aria-hidden="true">*</span>
          <textarea name="mensagem" rows={5} maxLength={3000} required className="mt-2 block w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 font-normal focus-visible:outline-2 focus-visible:outline-primary-dark" />
        </label>
        <div className="flex justify-center">
          <AdminAction type="submit" variant="primary" disabled={sending}>{sending ? "Enviando..." : "Enviar mensagem"}</AdminAction>
        </div>
      </fieldset>
      {notice && <p role={notice.error ? "alert" : "status"} className={`mt-4 rounded-lg p-3 ${notice.error ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>{notice.text}</p>}
    </form>
  );
}
