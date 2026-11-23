"use client";

import { CalendarDays, IdCard, Mail, MapPin, Search, UserCog, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useDeferredValue, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import AdminTable, { type Column } from "@/components/ADM/AdminTable";
import Pagination from "@/components/Pagination";
import AdminTemplate from "@/templates/AdminTemplate";
import type { CidadeResponseDTO } from "@/types/cidade";
import type { EnderecoResponseDTO } from "@/types/endereco";
import type { EstadoResponseDTO } from "@/types/estado";
import type { UserResponseDTO, UserRole } from "@/types/user";

type AuthUser = { id: number; nome: string; email: string; role: UserRole };
type Auth = { user: AuthUser; token: string };
type AddressDetails = { endereco: EnderecoResponseDTO; cidade: CidadeResponseDTO; estado: EstadoResponseDTO };
const roles: UserRole[] = ["ADMIN", "GESTOR", "FISCAL", "USER"];
const roleLabels: Record<UserRole, string> = { ADMIN: "Administrador", GESTOR: "Gestor", FISCAL: "Fiscal", USER: "Usuário" };

function subscribe(callback: () => void) { window.addEventListener("storage", callback); window.addEventListener("sigefis-auth", callback); return () => { window.removeEventListener("storage", callback); window.removeEventListener("sigefis-auth", callback); }; }
function getSnapshot() { const storage = localStorage.getItem("sigefis_user") ? localStorage : sessionStorage; return `${storage.getItem("sigefis_user") ?? ""}\u0000${storage.getItem("sigefis_token") ?? ""}`; }
function getServerSnapshot() { return "\u0000"; }
function parseAuth(value: string): Auth | null { const separator = value.indexOf("\u0000"); try { const user = JSON.parse(value.slice(0, separator)) as AuthUser; const token = value.slice(separator + 1); return user.id && user.nome && token ? { user, token } : null; } catch { return null; } }
function formatDate(value: Date | string | null) { if (!value) return "Não informada"; return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(value)); }
function formatCpf(value: string) { return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"); }
function formatCnpj(value: string) { return value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5"); }

async function requestJson<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init?.headers }, cache: "no-store" });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data && typeof data === "object" && "error" in data && typeof data.error === "string" ? data.error : "Não foi possível concluir a operação.";
    throw new Error(response.status === 401 ? "SESSION_EXPIRED" : message);
  }
  return data as T;
}

export default function UserManagement() {
  const router = useRouter();
  const authValue = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const auth = useMemo(() => parseAuth(authValue), [authValue]);
  const [users, setUsers] = useState<UserResponseDTO[]>([]);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selected, setSelected] = useState<UserResponseDTO | null>(null);
  const [address, setAddress] = useState<AddressDetails | null>(null);

  const logout = useCallback(() => { for (const storage of [localStorage, sessionStorage]) { storage.removeItem("sigefis_token"); storage.removeItem("sigefis_user"); } window.dispatchEvent(new Event("sigefis-auth")); router.replace("/"); }, [router]);

  useEffect(() => {
    if (!auth) { router.replace("/login"); return; }
    if (auth.user.role !== "ADMIN") { router.replace("/adm"); return; }
    let active = true;
    const query = new URLSearchParams({ page: String(page), pageSize: "10" });
    if (deferredSearch.trim()) query.set("busca", deferredSearch.trim());
    requestJson<{ data: UserResponseDTO[]; pagination: { total: number; totalPages: number } }>(`/api/users?${query}`, auth.token)
      .then((result) => { if (active) { setUsers(result.data); setTotal(result.pagination.total); setTotalPages(result.pagination.totalPages); setError(""); } })
      .catch((reason: unknown) => { if (!active) return; if (reason instanceof Error && reason.message === "SESSION_EXPIRED") logout(); else setError(reason instanceof Error ? reason.message : "Erro ao carregar usuários."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [auth, deferredSearch, logout, page, router]);

  async function changeRole(user: UserResponseDTO, role: UserRole) {
    if (!auth || user.id === auth.user.id || role === user.role) return;
    setSavingId(user.id); setError(""); setSuccess("");
    try {
      const updated = await requestJson<UserResponseDTO>(`/api/users/${user.id}`, auth.token, { method: "PUT", body: JSON.stringify({ role }) });
      setUsers((current) => current.map((item) => item.id === updated.id ? updated : item));
      setSelected((current) => current?.id === updated.id ? updated : current);
      setSuccess(`Cargo de ${updated.nome} alterado para ${roleLabels[updated.role]}.`);
    } catch (reason: unknown) { setError(reason instanceof Error ? reason.message : "Erro ao alterar cargo."); }
    finally { setSavingId(null); }
  }

  async function openDetails(user: UserResponseDTO) {
    setSelected(user); setAddress(null);
    if (!auth || !user.enderecoId) return;
    try {
      const endereco = await requestJson<EnderecoResponseDTO>(`/api/enderecos/${user.enderecoId}`, auth.token);
      const cidade = await requestJson<CidadeResponseDTO>(`/api/cidades/${endereco.cidadeId}`, auth.token);
      const estado = await requestJson<EstadoResponseDTO>(`/api/estados/${cidade.estadoId}`, auth.token);
      setAddress({ endereco, cidade, estado });
    } catch { setAddress(null); }
  }

  if (!auth || auth.user.role !== "ADMIN") return <main className="grid min-h-dvh place-items-center bg-[#eef0f5]"><p>Redirecionando...</p></main>;

  const columns: Column<UserResponseDTO>[] = [
    { key: "id", header: "ID", render: (user) => `#${user.id}` },
    { key: "nome", header: "Usuário", render: (user) => <span className="font-medium">{user.nome}</span> },
    { key: "email", header: "E-mail" },
    { key: "role", header: "Cargo", render: (user) => <select aria-label={`Alterar cargo de ${user.nome}`} value={user.role} disabled={savingId === user.id || user.id === auth.user.id} onChange={(event) => changeRole(user, event.target.value as UserRole)} title={user.id === auth.user.id ? "Seu próprio cargo não pode ser alterado nesta tela." : undefined} className="min-h-9 cursor-pointer rounded-md border border-[#b8beca] bg-white px-2 outline-none focus:border-primary-dark focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:bg-[#eeeeee]">{roles.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}</select> },
    { key: "criadoEm", header: "Data de ingresso", render: (user) => formatDate(user.criadoEm) },
    { key: "actions", header: "Ações", align: "center", render: (user) => <button type="button" onClick={() => openDetails(user)} className="cursor-pointer rounded-md bg-secondary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-secondary-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark">Ver detalhes</button> },
  ];

  return (
    <AdminTemplate user={{ nome: auth.user.nome, role: "ADMIN" }} onLogout={logout}>
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><Users className="size-8" aria-hidden="true" /><h1 className="text-3xl font-bold md:text-4xl">Gerenciar usuários</h1></div><p className="text-sm">Total: {total.toLocaleString("pt-BR")} {total === 1 ? "usuário" : "usuários"}</p></header>
        <label className="mb-7 flex min-h-12 items-center gap-3 rounded-lg border border-[#aab2c2] bg-white px-4 focus-within:border-primary-dark focus-within:ring-2 focus-within:ring-primary/40"><Search className="size-5 text-[#596174]" aria-hidden="true" /><span className="sr-only">Pesquisar usuários</span><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Pesquisar por nome, e-mail ou CPF..." className="min-w-0 flex-1 bg-transparent outline-none" /></label>
        {error && <div role="alert" className="mb-5 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">{error}</div>}
        {success && <div role="status" className="mb-5 rounded-lg border border-green-300 bg-green-50 p-4 text-green-700">{success}</div>}
        {loading ? <div className="h-64 animate-pulse rounded-lg bg-white shadow-sm" aria-label="Carregando usuários" /> : users.length ? <AdminTable columns={columns} data={users} keyExtractor={(user) => user.id} /> : <div className="rounded-lg bg-white p-12 text-center shadow-sm"><p className="font-bold">Nenhum usuário encontrado.</p><p className="mt-2 text-sm text-[#666]">Altere o termo utilizado na pesquisa.</p></div>}
        <Pagination currentPage={page} totalPages={totalPages} disabled={loading} onPageChange={setPage} />
      </div>
      {selected && <UserDetails user={selected} address={address} onClose={() => { setSelected(null); setAddress(null); }} />}
    </AdminTemplate>
  );
}

function UserDetails({ user, address, onClose }: { user: UserResponseDTO; address: AddressDetails | null; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-black/55 p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="user-details-title" className="w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-[#d8dbe2] px-6 py-5"><h2 id="user-details-title" className="text-2xl font-bold">Detalhes do usuário</h2><button type="button" onClick={onClose} aria-label="Fechar detalhes" className="cursor-pointer rounded p-1 hover:bg-ice"><X aria-hidden="true" /></button></header>
        <div className="space-y-7 p-6">
          <div><h3 className="mb-4 flex items-center gap-2 text-lg font-bold"><UserCog className="size-5 text-blue-700" aria-hidden="true" /> Informações pessoais</h3><dl className="grid gap-5 sm:grid-cols-2"><Detail icon={IdCard} label="ID" value={`#${user.id}`} /><Detail icon={Users} label="Nome completo" value={user.nome} /><Detail icon={Mail} label="E-mail" value={user.email} /><Detail icon={ShieldCheckIcon} label="Cargo" value={roleLabels[user.role]} /><Detail icon={IdCard} label="CPF" value={formatCpf(user.cpf)} /><Detail icon={IdCard} label="CNPJ" value={user.cnpj ? formatCnpj(user.cnpj) : "Não informado"} /><Detail icon={CalendarDays} label="Data de nascimento" value={formatDate(user.dataNascimento)} /><Detail icon={CalendarDays} label="Data de ingresso" value={formatDate(user.criadoEm)} /></dl></div>
          <div><h3 className="mb-4 flex items-center gap-2 text-lg font-bold"><MapPin className="size-5 text-blue-700" aria-hidden="true" /> Endereço</h3><div className="rounded-lg bg-[#f6f7f9] p-4 text-sm leading-7">{address ? <><p>{address.endereco.logradouro}, {address.endereco.numero}{address.endereco.complemento ? ` — ${address.endereco.complemento}` : ""}</p><p>{address.endereco.bairro} · {address.cidade.nome}/{address.estado.sigla}</p><p>CEP: {address.endereco.cep}</p></> : <p>Endereço não informado para este usuário.</p>}</div></div>
          <div className="flex justify-end border-t border-[#d8dbe2] pt-4"><button type="button" onClick={onClose} className="cursor-pointer rounded-lg bg-secondary px-6 py-2.5 font-semibold text-white hover:bg-secondary-light">Fechar</button></div>
        </div>
      </section>
    </div>
  );
}

const ShieldCheckIcon = UserCog;
function Detail({ icon: Icon, label, value }: { icon: typeof IdCard; label: string; value: string }) { return <div><dt className="flex items-center gap-1.5 text-sm text-[#596174]"><Icon className="size-4" aria-hidden="true" />{label}</dt><dd className="mt-1 break-words font-medium">{value}</dd></div>; }
