"use client";

import { useToast } from "@/components/Toast/ToastContext";
import { MapPin, UserRound } from "lucide-react";
import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import AdminAction from "@/components/ADM/AdminAction";
import ProfileInput from "@/components/Profile/ProfileInput";
import ProfileSection from "@/components/Profile/ProfileSection";
import { formatCep, formatCnpj } from "@/lib/input-masks";
import type { Profile } from "@/types/profile";

type Section = "dados" | "email" | "senha" | "endereco";
const digits = (value: string) => value.replace(/\D/g, "");
const cpf = (value: string) => digits(value).slice(0, 11).replace(/^(\d{3})(\d)/, "$1.$2")
  .replace(/^(\d{3}\.\d{3})(\d)/, "$1.$2").replace(/(\.\d{3})(\d{1,2})$/, "$1-$2");
const birth = (value: string | null) => value?.split("-").reverse().join("/") ?? "Não informada";

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener("sigefis-auth", listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener("sigefis-auth", listener);
  };
}

function getToken() {
  return localStorage.getItem("sigefis_token") ?? sessionStorage.getItem("sigefis_token") ?? "";
}

async function loadProfile(token: string, options: RequestInit = {}): Promise<Profile> {
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (options.body) headers.set("Content-Type", "application/json");
  const response = await fetch("/api/meu-perfil", { ...options, headers, cache: "no-store" });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(response.status === 401 ? "Sua sessão expirou. Entre novamente." : result?.error ?? "Não foi possível acessar a conta.");
  return result;
}

function syncMenu(token: string, profile: Profile) {
  for (const storage of [localStorage, sessionStorage]) {
    if (storage.getItem("sigefis_token") !== token) continue;
    const stored = storage.getItem("sigefis_user");
    if (!stored) continue;
    try {
      const user = JSON.parse(stored);
      storage.setItem("sigefis_user", JSON.stringify({ ...user, nome: profile.nome, email: profile.email }));
    } catch {
      storage.removeItem("sigefis_user");
    }
  }
  window.dispatchEvent(new Event("sigefis-auth"));
}

export default function MyProfile() {
  const token = useSyncExternalStore(subscribe, getToken, () => null);
  if (token === null) return <p className="p-8" role="status">Carregando conta...</p>;
  if (!token) return <section className="mx-auto max-w-xl px-6 py-12">
    <h1 className="mb-4 text-2xl font-bold">Minhas informações</h1>
    <AdminAction href="/login" variant="primary">Entrar na minha conta</AdminAction>
  </section>;
  return <ProfileContent key={token} token={token} />;
}

function ProfileContent({ token }: { token: string }) {
  const { showToast } = useToast();
  const [profile, setProfile] = useState<Profile>();
  const [area, setArea] = useState<"dados" | "endereco">("dados");
  const [editing, setEditing] = useState<Section>();
  const [notice, setNotice] = useState<{ error: boolean; text: string }>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    loadProfile(token, { signal: controller.signal }).then((data) => {
      if (!controller.signal.aborted) setProfile(data);
    }).catch((error: Error) => {
      if (!controller.signal.aborted) setNotice({ error: true, text: error.message });
    });
    return () => controller.abort();
  }, [token]);

  async function save(payload: Record<string, unknown>) {
    if (saving) return;
    setSaving(true);
    setNotice(undefined);
    try {
      const next = await loadProfile(token, { method: "PUT", body: JSON.stringify(payload) });
      setProfile(next);
      syncMenu(token, next);
      setEditing(undefined);
      showToast("Alteração salva com sucesso.", "success");
    } catch (error) {
      setNotice({ error: true, text: error instanceof Error ? error.message : "Não foi possível salvar." });
    } finally {
      setSaving(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>, section: Section) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    if (section === "dados") {
      void save({ ...values, cpf: digits(values.cpf), cnpj: digits(values.cnpj) || null, dataNascimento: values.dataNascimento || null });
    } else if (section === "senha") {
      if (values.senha !== values.confirmacao) {
        setNotice({ error: true, text: "A confirmação da senha não confere." });
        return;
      }
      void save({ senha: values.senha, senhaAtual: values.senhaAtual });
    } else {
      void save(section === "endereco" ? { endereco: values } : values);
    }
  }

  function switchArea(value: "dados" | "endereco") {
    setArea(value);
    setEditing(undefined);
    setNotice(undefined);
  }

  function edit(section: Section) {
    setNotice(undefined);
    setEditing(section);
  }

  const controls = <div className="flex flex-wrap gap-2">
    <AdminAction disabled={saving} onClick={() => { setEditing(undefined); setNotice(undefined); }}>Cancelar</AdminAction>
    <AdminAction type="submit" variant="primary" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</AdminAction>
  </div>;
  const address = profile?.endereco;

  return (
    <div className="grid w-full flex-1 content-start md:grid-cols-[220px_minmax(0,1fr)] md:content-stretch">
      <nav aria-label="Minha conta" className="flex flex-wrap content-start gap-2 bg-secondary p-4 text-white md:flex-col">
        {([["dados", UserRound, "Dados pessoais"], ["endereco", MapPin, "Endereço"]] as const).map(([value, Icon, label]) => (
          <button key={value} type="button" disabled={saving} aria-pressed={area === value} onClick={() => switchArea(value)}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-left hover:bg-white/10 aria-pressed:bg-primary aria-pressed:text-secondary disabled:cursor-wait">
            <Icon size={18} aria-hidden="true" />{label}
          </button>
        ))}
      </nav>
      <section className="w-full max-w-5xl space-y-5 px-5 py-8 sm:px-8">
        <header>
          <h1 className="border-l-4 border-primary pl-3 text-2xl font-bold sm:text-3xl">{area === "dados" ? "Minhas informações" : "Meu endereço"}</h1>
          {profile && area === "dados" && <p className="mt-3 text-gray-700">Olá, {profile.nome.split(" ")[0]}.</p>}
        </header>
        {notice && <p role={notice.error ? "alert" : "status"} className={`rounded-lg p-4 ${notice.error ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>{notice.text}</p>}
        {!profile && (notice ? <AdminAction href="/login">Ir para o login</AdminAction> : <p role="status">Carregando informações...</p>)}
        {profile && area === "dados" && <>
          <ProfileSection title="Dados pessoais" showEdit={!editing} onEdit={() => edit("dados")}>
            {editing === "dados" ? <form onSubmit={(event) => submit(event, "dados")} className="space-y-4">
              <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
                <ProfileInput label="Nome completo" name="nome" defaultValue={profile.nome} maxLength={191} autoComplete="name" required />
                <ProfileInput label="Data de nascimento" name="dataNascimento" type="date" defaultValue={profile.dataNascimento ?? ""} autoComplete="bday" />
                <ProfileInput label="CPF" name="cpf" defaultValue={cpf(profile.cpf)} formatter={cpf} inputMode="numeric" required />
                <ProfileInput label="CNPJ" name="cnpj" defaultValue={formatCnpj(profile.cnpj ?? "")} formatter={formatCnpj} inputMode="numeric" />
              </fieldset>
              {controls}
            </form> : <div className="grid gap-4 sm:grid-cols-2">
              <ProfileInput label="Nome completo" name="nome" value={profile.nome} readOnly />
              <ProfileInput label="Data de nascimento" name="dataNascimento" value={birth(profile.dataNascimento)} readOnly />
              <ProfileInput label="CPF" name="cpf" value={cpf(profile.cpf)} readOnly />
              <ProfileInput label="CNPJ" name="cnpj" value={profile.cnpj ? formatCnpj(profile.cnpj) : "Não informado"} readOnly />
            </div>}
          </ProfileSection>
          <ProfileSection title="Detalhes de login" showEdit={!editing} onEdit={() => edit("email")}>
            {editing === "email" ? <form onSubmit={(event) => submit(event, "email")} className="space-y-4">
              <fieldset disabled={saving} className="space-y-4">
                <ProfileInput label="E-mail" name="email" type="email" defaultValue={profile.email} maxLength={191} autoComplete="email" required />
                <ProfileInput label="Senha atual" name="senhaAtual" type="password" autoComplete="current-password" required />
              </fieldset>
              {controls}
            </form> : <ProfileInput label="E-mail" name="email" value={profile.email} readOnly />}
          </ProfileSection>
          <ProfileSection title="Senha" showEdit={!editing} onEdit={() => edit("senha")}>
            {editing === "senha" ? <form onSubmit={(event) => submit(event, "senha")} className="space-y-4">
              <fieldset disabled={saving} className="space-y-4">
                <ProfileInput label="Senha atual" name="senhaAtual" type="password" autoComplete="current-password" required />
                <ProfileInput label="Nova senha" name="senha" type="password" autoComplete="new-password" minLength={8} required />
                <ProfileInput label="Confirme a nova senha" name="confirmacao" type="password" autoComplete="new-password" minLength={8} required />
              </fieldset>
              {controls}
            </form> : <span className="tracking-widest" aria-label="Senha oculta">••••••••••</span>}
          </ProfileSection>
        </>}
        {profile && area === "endereco" && <ProfileSection title="Endereço cadastrado" showEdit={!!address && !editing && !saving} onEdit={() => edit("endereco")}>
          {address ? editing === "endereco" ? <form onSubmit={(event) => submit(event, "endereco")} className="space-y-4">
            <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
              <ProfileInput label="CEP" name="cep" defaultValue={formatCep(address.cep)} formatter={formatCep} autoComplete="postal-code" inputMode="numeric" required />
              <ProfileInput label="Logradouro" name="logradouro" defaultValue={address.logradouro} maxLength={191} required />
              <ProfileInput label="Número" name="numero" defaultValue={address.numero} maxLength={10} required />
              <ProfileInput label="Complemento" name="complemento" defaultValue={address.complemento ?? ""} maxLength={45} />
              <ProfileInput label="Bairro" name="bairro" defaultValue={address.bairro} maxLength={45} required />
              <ProfileInput label="Cidade" name="cidade" defaultValue={address.cidade} maxLength={100} required />
              <ProfileInput label="UF" name="uf" defaultValue={address.uf} maxLength={2} formatter={(value) => value.toUpperCase()} required />
            </fieldset>
            {controls}
          </form> : <>
            <address className="not-italic leading-relaxed">
              <p>{address.logradouro}, {address.numero}{address.complemento && ` · ${address.complemento}`}</p>
              <p>{address.bairro} · {address.cidade}/{address.uf}</p>
              <p>CEP {formatCep(address.cep)}</p>
            </address>
            <button type="button" disabled={saving} className="cursor-pointer text-sm font-medium text-red-700 hover:underline disabled:cursor-wait"
              onClick={() => { if (window.confirm("Remover o endereço vinculado à sua conta?")) void save({ endereco: null }); }}>
              Remover endereço
            </button>
          </> : <p className="text-gray-600">Sua conta não tem endereço cadastrado.</p>}
        </ProfileSection>}
      </section>
    </div>
  );
}
