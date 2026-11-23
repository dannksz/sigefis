"use client";

import { Eye, FileText, Landmark, MapPin, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useDeferredValue, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import AdminTable, { type Column } from "@/components/ADM/AdminTable";
import Pagination from "@/components/Pagination";
import AdminTemplate from "@/templates/AdminTemplate";
import type { CidadeResponseDTO } from "@/types/cidade";
import type { EnderecoResponseDTO } from "@/types/endereco";
import type { EstadoResponseDTO } from "@/types/estado";
import type { ProjetoResponseDTO } from "@/types/projeto";
import type { UserRole } from "@/types/user";

type InternalRole = Exclude<UserRole, "USER">;
type Auth = { user: { id: number; nome: string; email: string; role: UserRole }; token: string };
type Location = { address: EnderecoResponseDTO; city: CidadeResponseDTO; state: EstadoResponseDTO };

function subscribe(callback: () => void) { window.addEventListener("storage", callback); window.addEventListener("sigefis-auth", callback); return () => { window.removeEventListener("storage", callback); window.removeEventListener("sigefis-auth", callback); }; }
function getSnapshot() { const storage = localStorage.getItem("sigefis_user") ? localStorage : sessionStorage; return `${storage.getItem("sigefis_user") ?? ""}\u0000${storage.getItem("sigefis_token") ?? ""}`; }
function getServerSnapshot() { return "\u0000"; }
function parseAuth(value: string): Auth | null { const separator = value.indexOf("\u0000"); try { const user = JSON.parse(value.slice(0, separator)) as Auth["user"]; const token = value.slice(separator + 1); return user.nome && token && ["ADMIN", "GESTOR", "FISCAL", "USER"].includes(user.role) ? { user, token } : null; } catch { return null; } }
function formatDate(value: string | null) { if (!value) return "Não informada"; const [year, month, day] = value.split("-"); return `${day}/${month}/${year}`; }

async function requestJson<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init?.headers }, cache: "no-store" });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) { const message = data && typeof data === "object" && "error" in data && typeof data.error === "string" ? data.error : "Não foi possível carregar as obras."; throw new Error(response.status === 401 ? "SESSION_EXPIRED" : message); }
  return data as T;
}
async function fetchAll<T>(path: string, token: string) {
  const first = await requestJson<{ data: T[]; pagination: { totalPages: number } }>(`${path}?page=1&pageSize=100`, token); const result = [...first.data];
  for (let page = 2; page <= first.pagination.totalPages; page += 1) result.push(...(await requestJson<{ data: T[] }>(`${path}?page=${page}&pageSize=100`, token)).data);
  return result;
}

export default function WorkManagement() {
  const router = useRouter();
  const authValue = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const auth = useMemo(() => parseAuth(authValue), [authValue]);
  const [works, setWorks] = useState<ProjetoResponseDTO[]>([]);
  const [locations, setLocations] = useState<Map<number, Location>>(new Map());
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selected, setSelected] = useState<ProjetoResponseDTO | null>(null);
  const [deleting, setDeleting] = useState<ProjetoResponseDTO | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const logout = useCallback(() => { for (const storage of [localStorage, sessionStorage]) { storage.removeItem("sigefis_token"); storage.removeItem("sigefis_user"); } window.dispatchEvent(new Event("sigefis-auth")); router.replace("/"); }, [router]);

  useEffect(() => {
    if (!auth) { router.replace("/login"); return; }
    if (auth.user.role === "USER") { router.replace("/"); return; }
    let active = true;
    const query = new URLSearchParams({ page: String(page), pageSize: "10" });
    if (deferredSearch.trim()) query.set("busca", deferredSearch.trim());
    Promise.all([
      requestJson<{ data: ProjetoResponseDTO[]; pagination: { total: number; totalPages: number } }>(`/api/projetos?${query}`, auth.token),
      fetchAll<EnderecoResponseDTO>("/api/enderecos", auth.token), fetchAll<CidadeResponseDTO>("/api/cidades", auth.token), fetchAll<EstadoResponseDTO>("/api/estados", auth.token),
    ]).then(([result, addresses, cities, states]) => {
      if (!active) return;
      const citiesById = new Map(cities.map((city) => [city.id, city])); const statesById = new Map(states.map((state) => [state.id, state])); const map = new Map<number, Location>();
      addresses.forEach((address) => { const city = citiesById.get(address.cidadeId); const state = city && statesById.get(city.estadoId); if (city && state) map.set(address.id, { address, city, state }); });
      setWorks(result.data); setTotal(result.pagination.total); setTotalPages(result.pagination.totalPages); setLocations(map); setError("");
    }).catch((reason: unknown) => { if (!active) return; if (reason instanceof Error && reason.message === "SESSION_EXPIRED") logout(); else setError(reason instanceof Error ? reason.message : "Erro ao carregar obras."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [auth, deferredSearch, logout, page, refreshKey, router]);

  async function deleteWork() {
    if (!auth || !deleting) return;
    try {
      await requestJson<{ message: string }>(`/api/projetos/${deleting.id}`, auth.token, { method: "DELETE" });
      setSuccess(`Obra “${deleting.nome}” excluída com sucesso.`); setError(""); setDeleting(null); setRefreshKey((value) => value + 1);
    } catch (reason: unknown) { setError(reason instanceof Error ? reason.message : "Erro ao excluir obra."); setDeleting(null); }
  }

  if (!auth || auth.user.role === "USER") return <main className="grid min-h-dvh place-items-center bg-[#eef0f5]"><p>Redirecionando...</p></main>;
  const role = auth.user.role as InternalRole;
  const locationLabel = (work: ProjetoResponseDTO) => { const location = locations.get(work.enderecoId); return location ? `${location.city.nome}/${location.state.sigla}` : "Não informada"; };
  const columns: Column<ProjetoResponseDTO>[] = [
    { key: "id", header: "ID", render: (work) => `#${work.id}` },
    { key: "nome", header: "Obra pública", render: (work) => <span className="font-semibold">{work.nome}</span> },
    { key: "finalidade", header: "Finalidade" },
    { key: "localizacao", header: "Localização", render: locationLabel },
    { key: "dataConclusao", header: "Conclusão prevista", render: (work) => formatDate(work.dataConclusao) },
    { key: "publicado", header: "Publicação", align: "center", render: (work) => <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${work.publicado ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{work.publicado ? "Publicada" : "Não publicada"}</span> },
    { key: "actions", header: "Ações", align: "center", render: (work) => <div className="flex items-center justify-center gap-2"><button type="button" onClick={() => setSelected(work)} aria-label={`Ver detalhes de ${work.nome}`} title="Ver detalhes" className="grid size-9 cursor-pointer place-items-center rounded-md text-blue-700 transition-colors hover:bg-blue-50"><Eye className="size-5" aria-hidden="true" /></button>{role !== "FISCAL" && <Link href={`/adm/obras/${work.id}/alterar`} aria-label={`Alterar ${work.nome}`} title="Alterar obra" className="grid size-9 cursor-pointer place-items-center rounded-md text-amber-700 transition-colors hover:bg-amber-50"><Pencil className="size-5" aria-hidden="true" /></Link>}{role === "ADMIN" && <button type="button" onClick={() => setDeleting(work)} aria-label={`Excluir ${work.nome}`} title="Excluir obra" className="grid size-9 cursor-pointer place-items-center rounded-md text-red-600 transition-colors hover:bg-red-50"><Trash2 className="size-5" aria-hidden="true" /></button>}</div> },
  ];

  return (
    <AdminTemplate user={{ nome: auth.user.nome, role }} onLogout={logout}>
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><Landmark className="size-8" aria-hidden="true" /><h1 className="text-3xl font-bold md:text-4xl">Gerenciar obras públicas ({total.toLocaleString("pt-BR")})</h1></div>{role !== "FISCAL" && <Link href="/adm/obras/adicionar" className="flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 font-semibold text-secondary shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary-light hover:shadow-md"><Plus className="size-5" aria-hidden="true" /> Adicionar obra</Link>}</header>
        <label className="mb-7 flex min-h-12 items-center gap-3 rounded-lg border border-[#aab2c2] bg-white px-4 focus-within:border-primary-dark focus-within:ring-2 focus-within:ring-primary/40"><Search className="size-5 text-[#596174]" aria-hidden="true" /><span className="sr-only">Pesquisar obras</span><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Pesquisar por nome, descrição ou finalidade..." className="min-w-0 flex-1 bg-transparent outline-none" /></label>
        {error && <div role="alert" className="mb-5 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">{error}</div>}
        {success && <div role="status" className="mb-5 rounded-lg border border-green-300 bg-green-50 p-4 text-green-700">{success}</div>}
        {loading ? <div className="h-64 animate-pulse rounded-lg bg-white shadow-sm" aria-label="Carregando obras" /> : works.length ? <AdminTable columns={columns} data={works} keyExtractor={(work) => work.id} /> : <div className="rounded-lg bg-white p-12 text-center shadow-sm"><p className="font-bold">Nenhuma obra encontrada.</p><p className="mt-2 text-sm text-[#666]">Altere o termo utilizado na pesquisa.</p></div>}
        <Pagination currentPage={page} totalPages={totalPages} disabled={loading} onPageChange={setPage} />
      </div>
      {selected && <WorkDetails work={selected} location={locations.get(selected.enderecoId)} onClose={() => setSelected(null)} />}
      {deleting && <ConfirmDelete work={deleting} onClose={() => setDeleting(null)} onConfirm={deleteWork} />}
    </AdminTemplate>
  );
}

function WorkDetails({ work, location, onClose }: { work: ProjetoResponseDTO; location?: Location; onClose: () => void }) {
  return <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-black/55 p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section role="dialog" aria-modal="true" aria-labelledby="work-details-title" className="w-full max-w-2xl rounded-xl bg-white shadow-2xl"><header className="flex items-center justify-between border-b border-[#d8dbe2] px-6 py-5"><h2 id="work-details-title" className="text-2xl font-bold">Detalhes da obra</h2><button type="button" onClick={onClose} aria-label="Fechar detalhes" className="cursor-pointer rounded p-1 hover:bg-ice"><X aria-hidden="true" /></button></header><div className="space-y-7 p-6"><div><h3 className="mb-4 flex items-center gap-2 text-lg font-bold"><FileText className="size-5 text-blue-700" aria-hidden="true" /> Informações gerais</h3><dl className="grid gap-5 sm:grid-cols-2"><Detail label="ID" value={`#${work.id}`} /><Detail label="Nome" value={work.nome} /><Detail label="Finalidade" value={work.finalidade} /><Detail label="Conclusão prevista" value={formatDate(work.dataConclusao)} /><Detail label="Publicação" value={work.publicado ? "Publicada no portal" : "Não publicada"} /><div className="sm:col-span-2"><dt className="text-sm text-[#596174]">Descrição</dt><dd className="mt-1 font-medium">{work.descricao}</dd></div></dl></div><div><h3 className="mb-4 flex items-center gap-2 text-lg font-bold"><MapPin className="size-5 text-blue-700" aria-hidden="true" /> Localização</h3><div className="rounded-lg bg-[#f6f7f9] p-4 text-sm leading-7">{location ? <><p>{location.address.logradouro}, {location.address.numero}{location.address.complemento ? ` — ${location.address.complemento}` : ""}</p><p>{location.address.bairro} · {location.city.nome}/{location.state.sigla}</p><p>{location.state.regiao} · CEP: {location.address.cep}</p></> : <p>Localização não encontrada.</p>}</div></div><div className="flex justify-end border-t border-[#d8dbe2] pt-4"><button type="button" onClick={onClose} className="cursor-pointer rounded-lg bg-secondary px-6 py-2.5 font-semibold text-white hover:bg-secondary-light">Fechar</button></div></div></section></div>;
}

export function WorkForm({ work, locations, canPublish, onClose, onSave }: { work?: ProjetoResponseDTO; locations: Map<number, Location>; canPublish: boolean; onClose: () => void; onSave: (data: { nome: string; descricao: string; finalidade: string; enderecoId: number; dataConclusao: string | null; publicado?: boolean }) => Promise<void> }) {
  const [form, setForm] = useState({ nome: work?.nome ?? "", descricao: work?.descricao ?? "", finalidade: work?.finalidade ?? "", enderecoId: work?.enderecoId ? String(work.enderecoId) : "", dataConclusao: work?.dataConclusao ?? "", publicado: work?.publicado ?? false });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const locationOptions = [...locations.entries()].sort(([, a], [, b]) => `${a.city.nome} ${a.address.logradouro}`.localeCompare(`${b.city.nome} ${b.address.logradouro}`, "pt-BR"));

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.enderecoId) { setFormError("Selecione o endereço da obra."); return; }
    setSaving(true); setFormError("");
    try {
      await onSave({ nome: form.nome.trim(), descricao: form.descricao.trim(), finalidade: form.finalidade.trim(), enderecoId: Number(form.enderecoId), dataConclusao: form.dataConclusao || null, ...((work && canPublish) && { publicado: form.publicado }) });
    } catch (reason: unknown) { setFormError(reason instanceof Error ? reason.message : "Não foi possível salvar a obra."); }
    finally { setSaving(false); }
  }

  const fieldClass = "w-full rounded-lg border border-[#aab2c2] bg-white px-3 py-2.5 outline-none focus:border-primary-dark focus:ring-2 focus:ring-primary/40 disabled:cursor-wait disabled:opacity-60";
  return <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-black/55 p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !saving && onClose()}><section role="dialog" aria-modal="true" aria-labelledby="work-form-title" className="w-full max-w-2xl rounded-xl bg-white shadow-2xl"><header className="flex items-center justify-between border-b border-[#d8dbe2] px-6 py-5"><h2 id="work-form-title" className="text-2xl font-bold">{work ? "Alterar obra" : "Adicionar obra"}</h2><button type="button" onClick={onClose} disabled={saving} aria-label="Fechar formulário" className="cursor-pointer rounded p-1 hover:bg-ice disabled:cursor-wait"><X aria-hidden="true" /></button></header><form onSubmit={submit} className="space-y-5 p-6">{formError && <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">{formError}</div>}<div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-medium">Nome da obra<span className="text-red-600"> *</span><input value={form.nome} onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))} required maxLength={45} disabled={saving} className={`${fieldClass} mt-1.5`} /></label><label className="text-sm font-medium">Finalidade<span className="text-red-600"> *</span><input value={form.finalidade} onChange={(event) => setForm((current) => ({ ...current, finalidade: event.target.value }))} required maxLength={45} disabled={saving} className={`${fieldClass} mt-1.5`} /></label><label className="text-sm font-medium sm:col-span-2">Descrição<span className="text-red-600"> *</span><textarea value={form.descricao} onChange={(event) => setForm((current) => ({ ...current, descricao: event.target.value }))} required maxLength={250} rows={4} disabled={saving} className={`${fieldClass} mt-1.5 resize-y`} /></label><label className="text-sm font-medium">Endereço<span className="text-red-600"> *</span><select value={form.enderecoId} onChange={(event) => setForm((current) => ({ ...current, enderecoId: event.target.value }))} required disabled={saving} className={`${fieldClass} mt-1.5`}><option value="">Selecione...</option>{locationOptions.map(([id, location]) => <option key={id} value={id}>{location.address.logradouro}, {location.address.numero} — {location.city.nome}/{location.state.sigla}</option>)}</select></label><label className="text-sm font-medium">Conclusão prevista<input type="date" value={form.dataConclusao} onChange={(event) => setForm((current) => ({ ...current, dataConclusao: event.target.value }))} disabled={saving} className={`${fieldClass} mt-1.5`} /></label>{work && canPublish && <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2"><input type="checkbox" checked={form.publicado} onChange={(event) => setForm((current) => ({ ...current, publicado: event.target.checked }))} disabled={saving} className="size-4 accent-primary-dark" /> Publicar obra no portal público</label>}</div><div className="flex flex-col-reverse justify-end gap-3 border-t border-[#d8dbe2] pt-5 sm:flex-row"><button type="button" onClick={onClose} disabled={saving} className="min-h-11 cursor-pointer rounded-lg border border-[#9ca3af] px-5 font-semibold hover:bg-ice disabled:cursor-wait">Cancelar</button><button type="submit" disabled={saving} className="min-h-11 cursor-pointer rounded-lg bg-primary px-6 font-semibold text-secondary hover:bg-primary-light disabled:cursor-wait disabled:bg-gray-400">{saving ? "Salvando..." : work ? "Salvar alterações" : "Cadastrar obra"}</button></div></form></section></div>;
}

function ConfirmDelete({ work, onClose, onConfirm }: { work: ProjetoResponseDTO; onClose: () => void; onConfirm: () => Promise<void> }) {
  const [deleting, setDeleting] = useState(false);
  return <div className="fixed inset-0 z-[75] grid place-items-center bg-black/55 p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !deleting && onClose()}><section role="alertdialog" aria-modal="true" aria-labelledby="delete-work-title" className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"><h2 id="delete-work-title" className="text-xl font-bold">Excluir obra?</h2><p className="mt-3 text-[#555]">A obra <strong>{work.nome}</strong> será excluída. A operação será impedida se existirem contratos, etapas ou outros registros associados.</p><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} disabled={deleting} className="min-h-10 cursor-pointer rounded-lg border border-[#9ca3af] px-4 font-semibold hover:bg-ice">Cancelar</button><button type="button" disabled={deleting} onClick={async () => { setDeleting(true); await onConfirm(); }} className="min-h-10 cursor-pointer rounded-lg bg-red-600 px-4 font-semibold text-white hover:bg-red-700 disabled:cursor-wait disabled:bg-red-300">{deleting ? "Excluindo..." : "Excluir"}</button></div></section></div>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div><dt className="text-sm text-[#596174]">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>; }
