"use client";

import { Building2, Search } from "lucide-react";
import TableAction from "@/components/ADM/TableAction";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useRef, useState, useSyncExternalStore } from "react";
import AdminTable, { type Column } from "@/components/ADM/AdminTable";
import Pagination from "@/components/Pagination";
import AdminTemplate from "@/templates/AdminTemplate";
import type { EmpresaResponseDTO } from "@/types/empresa";
import type { OrgaoPublicoResponseDTO } from "@/types/orgao-publico";
import type { PaginatedResult } from "@/lib/pagination";
import type { EnderecoResponseDTO } from "@/types/endereco";
import type { CidadeResponseDTO } from "@/types/cidade";
import type { EstadoResponseDTO } from "@/types/estado";
import { consultarCep } from "@/services/cep.service";
import { formatCep, formatCnpj, formatPhone } from "@/lib/input-masks";
import AdminAction from "@/components/ADM/AdminAction";

type Institution = EmpresaResponseDTO | OrgaoPublicoResponseDTO;
type Section = "orgaos" | "empresas";
type Session = { nome: string; role: "ADMIN" | "GESTOR"; token: string };

function snapshot() { return true; }
function serverSnapshot() { return false; }
function subscribe() { return () => {}; }

function readSession(): Session | null {
  const storage = localStorage.getItem("sigefis_user") ? localStorage : sessionStorage;
  try {
    const user = JSON.parse(storage.getItem("sigefis_user") ?? "null");
    const token = storage.getItem("sigefis_token");
    if (token && typeof user?.nome === "string" && (user.role === "ADMIN" || user.role === "GESTOR")) {
      return { nome: user.nome, role: user.role, token };
    }
  } catch {
    return null;
  }
  return null;
}

type EditTarget = { section: Section; id: number };

export default function Institutions({ adding = false, edit }: { adding?: boolean; edit?: EditTarget }) {
  const ready = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const session = ready ? readSession() : null;
  const router = useRouter();
  if (!session) {
    return (
      <main className="p-8">
        {ready ? <><p>Esta área é exclusiva para administradores e gestores.</p><Link className="underline" href="/adm">Voltar ao painel</Link></> : "Carregando painel..."}
      </main>
    );
  }
  return (
    <AdminTemplate user={session} onLogout={() => {
      for (const storage of [localStorage, sessionStorage]) {
        storage.removeItem("sigefis_user");
        storage.removeItem("sigefis_token");
      }
      window.dispatchEvent(new Event("sigefis-auth"));
      router.replace("/");
    }}>
      {edit ? <InstitutionEditor key={`${edit.section}/${edit.id}`} token={session.token} target={edit} />
        : adding ? <InstitutionForm token={session.token} /> : <Directory token={session.token} />}
    </AdminTemplate>
  );
}

function Directory({ token }: { token: string }) {
  const [section, setSection] = useState<Section>("orgaos");
  return (
    <div className="mx-auto max-w-[1500px]">
      <h1 className="mb-6 flex items-center gap-3 text-3xl font-bold md:text-4xl">
        <Building2 aria-hidden="true" className="size-8 shrink-0" /> Órgãos e empresas
      </h1>
      <nav aria-label="Tipo de instituição" className="mb-5 flex flex-wrap gap-2">
        {(["orgaos", "empresas"] as const).map((item) => (
          <button key={item} type="button" aria-pressed={section === item} onClick={() => setSection(item)}
            className="cursor-pointer rounded-lg bg-white px-4 py-2 font-semibold hover:bg-primary-light aria-pressed:bg-primary">
            {item === "orgaos" ? "Órgãos públicos" : "Empresas"}
          </button>
        ))}
        <Link href="/adm/orgaos-empresas/incluir" className="ml-auto rounded-lg bg-primary px-4 py-2 font-semibold hover:bg-primary-light">
          Incluir órgão ou empresa
        </Link>
      </nav>
      <InstitutionList key={section} section={section} token={token} />
    </div>
  );
}

function InstitutionList({ section, token }: { section: Section; token: string }) {
  const [search, setSearch] = useState("");
  const query = useDeferredValue(search.trim());
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{ key: string; data?: PaginatedResult<Institution>; error?: string }>();
  const [selected, setSelected] = useState<Institution | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const params = new URLSearchParams({ page: String(page), pageSize: "10", busca: query });
  const url = `/api/${section}?${params}`;

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(response.status === 401 ? "Sua sessão expirou. Entre novamente." : "Não foi possível carregar os registros.");
        }
        const data: PaginatedResult<Institution> = await response.json();
        if (!controller.signal.aborted) setResult({ key: url, data });
      } catch (error) {
        if (!controller.signal.aborted) setResult({ key: url, error: error instanceof Error ? error.message : "Falha na consulta." });
      }
    }
    void load();
    return () => controller.abort();
  }, [url, token]);

  const current = result?.key === url ? result : undefined;
  const columns: Column<Institution>[] = [
    { key: "id", header: "ID", render: (item) => `#${item.id}` },
    { key: "nome", header: "Nome" },
    section === "orgaos" ? { key: "sigla", header: "Sigla" } : {
      key: "cnpj", header: "CNPJ", render: (item) => "cnpj" in item ? formatCnpj(item.cnpj) : "",
    },
    {
      key: "location", header: "Cidade/UF",
      render: (item) => <InstitutionLocation key={item.enderecoId} id={item.enderecoId} token={token} />,
    },
    { key: "actions", header: "Ações", align: "center", render: (item) => (
      <div className="flex flex-wrap items-center justify-center gap-2">
        <TableAction action="details" name={item.nome} onClick={() => { setSelected(item); dialog.current?.showModal(); }} />
        <TableAction action="edit" name={item.nome} href={`/adm/orgaos-empresas/${section}/${item.id}/alterar`} />
      </div>
    ) },
  ];

  return (
    <>
      <label className="mb-5 flex items-center gap-3 rounded-lg border border-gray-400 bg-white px-4 py-3 focus-within:ring-2 focus-within:ring-primary">
        <Search size={19} aria-hidden="true" />
        <span className="sr-only">Pesquisar instituições</span>
        <input type="search" className="w-full outline-none" value={search}
          placeholder={section === "orgaos" ? "Pesquisar por nome ou sigla" : "Pesquisar por nome, CNPJ ou e-mail"}
          onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
      </label>
      {!current && <p role="status">Carregando registros...</p>}
      {current?.error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">{current.error}</p>}
      {current?.data && (
        <>
          <p className="mb-3 text-sm text-gray-700" role="status">Total de registros: {current.data.pagination.total}</p>
          {current.data.data.length > 0
            ? <AdminTable columns={columns} data={current.data.data} keyExtractor={(item) => item.id} />
            : <p className="rounded-lg bg-white p-8 text-center">Nenhum registro encontrado.</p>}
          <Pagination currentPage={page} totalPages={current.data.pagination.totalPages} onPageChange={setPage} />
        </>
      )}
      <dialog ref={dialog} aria-labelledby="institution-details" className="m-auto w-[calc(100%-2rem)] max-w-xl rounded-xl p-6 shadow-xl backdrop:bg-black/55">
        <h2 id="institution-details" className="text-xl font-bold">{selected?.nome}</h2>
        {selected && <dl className="mt-5 grid gap-4 break-words sm:grid-cols-2">
          <Detail label="ID" value={`#${selected.id}`} />
          {"cnpj" in selected ? <>
            <Detail label="CNPJ" value={formatCnpj(selected.cnpj)} />
            <Detail label="Representante legal" value={selected.representanteLegal} />
            <Detail label="Telefone" value={selected.telefone} />
            <Detail label="E-mail" value={selected.email} />
          </> : <Detail label="Sigla" value={selected.sigla} />}
          <AddressDetail key={selected.enderecoId} id={selected.enderecoId} token={token} />
        </dl>}
        <form method="dialog" className="mt-6 flex justify-end">
          <button className="cursor-pointer rounded-lg bg-secondary px-5 py-2 font-semibold text-white">Fechar</button>
        </form>
      </dialog>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-sm text-gray-600">{label}</dt><dd className="font-medium">{value}</dd></div>;
}

async function api<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Não foi possível concluir a operação.");
  return data;
}

function addressLine(address: EnderecoResponseDTO) {
  return [`${address.logradouro}, ${address.numero}`, address.complemento, address.bairro].filter(Boolean).join(" · ");
}

function InstitutionLocation({ id, token }: { id?: number | null; token: string }) {
  return <span className="whitespace-nowrap">{useInstitutionLocation(id, token, false)}</span>;
}

function AddressDetail({ id, token }: { id?: number | null; token: string }) {
  const value = useInstitutionLocation(id, token, true);
  return <div className="sm:col-span-2"><Detail label="Endereço" value={value} /></div>;
}

function useInstitutionLocation(id: number | null | undefined, token: string, fullAddress: boolean) {
  const [value, setValue] = useState("");
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    const options = { signal: controller.signal };
    async function load() {
      try {
        const address = await api<EnderecoResponseDTO>(`/api/enderecos/${id}`, token, options);
        const city = await api<CidadeResponseDTO>(`/api/cidades/${address.cidadeId}`, token, options);
        const state = await api<EstadoResponseDTO>(`/api/estados/${city.estadoId}`, token, options);
        if (!controller.signal.aborted) {
          const cityAndState = `${city.nome}/${state.sigla}`;
          setValue(fullAddress ? `${addressLine(address)} · ${cityAndState} · CEP ${formatCep(address.cep)}` : cityAndState);
        }
      } catch {
        if (!controller.signal.aborted) setValue(fullAddress ? "Não foi possível carregar o endereço." : "Indisponível");
      }
    }
    void load();
    return () => controller.abort();
  }, [id, token, fullAddress]);
  return id ? value || "Carregando..." : "Não informado";
}

function InstitutionEditor({ token, target }: { token: string; target: EditTarget }) {
  const [record, setRecord] = useState<Institution>();
  const [error, setError] = useState("");
  const path = `/api/${target.section}/${target.id}`;
  useEffect(() => {
    const controller = new AbortController();
    api<Institution>(path, token, { signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setRecord(data); })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Erro ao carregar o cadastro.");
      });
    return () => controller.abort();
  }, [path, token]);
  if (error) return <div className="space-y-4"><p role="alert">{error}</p><AdminAction href="/adm/orgaos-empresas">Voltar</AdminAction></div>;
  if (!record) return <p role="status">Carregando cadastro...</p>;
  return <InstitutionForm token={token} initial={record} />;
}

function InstitutionForm({ token, initial }: { token: string; initial?: Institution }) {
  const router = useRouter();
  const initialCompany = initial && "cnpj" in initial ? initial : undefined;
  const [section, setSection] = useState<Section>(initialCompany ? "empresas" : "orgaos");
  const [addresses, setAddresses] = useState<EnderecoResponseDTO[]>();
  const [addressError, setAddressError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [newAddress, setNewAddress] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(initial?.enderecoId?.toString() ?? "");
  const company = section === "empresas";
  const fieldClass = "mt-1 block w-full rounded-lg border border-gray-400 bg-white px-3 py-2";

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const items: EnderecoResponseDTO[] = [];
        let page = 1;
        let totalPages = 1;
        do {
          const result = await api<PaginatedResult<EnderecoResponseDTO>>(
            `/api/enderecos?page=${page}&pageSize=100`, token, { signal: controller.signal },
          );
          items.push(...result.data);
          totalPages = result.pagination.totalPages;
        } while (++page <= totalPages);
        if (!controller.signal.aborted) setAddresses(items);
      } catch {
        if (!controller.signal.aborted) setAddressError("Não foi possível carregar os endereços cadastrados.");
      }
    }
    void load();
    return () => controller.abort();
  }, [token]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || newAddress) return;
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    const { enderecoId, ...details } = fields;
    setSaving(true);
    setError("");
    try {
      await api(initial ? `/api/${section}/${initial.id}` : `/api/${section}`, token, {
        method: initial ? "PUT" : "POST",
        body: JSON.stringify({
          ...details,
          ...(enderecoId ? { enderecoId: Number(enderecoId) } : initial && !company && addresses ? { enderecoId: null } : {}),
        }),
      });
      router.push("/adm/orgaos-empresas");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível salvar o cadastro.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-3xl font-bold">{initial ? (company ? "Alterar empresa" : "Alterar órgão público") : "Incluir órgão ou empresa"}</h1>
      <div className="rounded-xl bg-white p-6 shadow-sm">
        {!initial && <label className="block font-medium">Tipo de cadastro
          <select className={fieldClass} value={section} disabled={saving} onChange={(event) => {
            setSection(event.target.value === "empresas" ? "empresas" : "orgaos");
            setError("");
          }}>
            <option value="orgaos">Órgão público</option>
            <option value="empresas">Empresa</option>
          </select>
        </label>}
        <form key={section} onSubmit={submit} className="mt-5">
          <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
            <label>Nome<input className={fieldClass} name="nome" defaultValue={initial?.nome} required maxLength={company ? 191 : 45} /></label>
            {company ? <>
              <label>CNPJ<input className={fieldClass} name="cnpj" inputMode="numeric" required
                defaultValue={initialCompany ? formatCnpj(initialCompany.cnpj) : undefined}
                onChange={(event) => { event.currentTarget.value = formatCnpj(event.currentTarget.value); }} /></label>
              <label>Representante legal<input className={fieldClass} name="representanteLegal" defaultValue={initialCompany?.representanteLegal} required maxLength={191} /></label>
              <label>Telefone<input className={fieldClass} name="telefone" type="tel" autoComplete="tel-national"
                defaultValue={initialCompany && (/^\d{10,11}$/.test(initialCompany.telefone) ? formatPhone(initialCompany.telefone) : initialCompany.telefone)}
                required pattern="\([0-9]{2}\) [0-9]{4,5}-[0-9]{4}" placeholder="(00) 00000-0000"
                title="Informe o DDD e o telefone com 8 ou 9 dígitos."
                onChange={(event) => { event.currentTarget.value = formatPhone(event.currentTarget.value); }} /></label>
              <label>E-mail<input className={fieldClass} name="email" type="email" defaultValue={initialCompany?.email} required maxLength={191} /></label>
            </> : <label>Sigla<input className={fieldClass} name="sigla" defaultValue={initial && "sigla" in initial ? initial.sigla : undefined} required maxLength={45} /></label>}
            <label className="sm:col-span-2">Endereço cadastrado {company ? "(obrigatório)" : "(opcional)"}
              <select name="enderecoId" className={fieldClass} required={company} disabled={!addresses?.length}
                value={selectedAddress} onChange={(event) => setSelectedAddress(event.target.value)}>
                <option value="">{addresses?.length ? "Selecione um endereço" : "Nenhum endereço disponível para seleção"}</option>
                {addresses?.map((address) => <option key={address.id} value={address.id}>{addressLine(address)} · CEP {formatCep(address.cep)}</option>)}
              </select>
            </label>
          </fieldset>
          {!addresses && !addressError && <p className="mt-3" role="status">Carregando endereços...</p>}
          {addressError && <p className="mt-3 text-red-800" role="alert">{addressError}</p>}
          {error && <p className="mt-3 text-red-800" role="alert">{error}</p>}
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <AdminAction href="/adm/orgaos-empresas">Cancelar</AdminAction>
            <AdminAction variant="primary" type="submit" disabled={saving || newAddress || (company && !addresses?.length)}>
              {saving ? "Salvando..." : initial ? "Salvar alterações" : "Salvar cadastro"}
            </AdminAction>
          </div>
        </form>
        {newAddress ? (
          <NewInstitutionAddress token={token} onCancel={() => setNewAddress(false)} onSaved={(address) => {
            setAddresses((items) => [...(items ?? []), address]);
            setSelectedAddress(String(address.id));
            setNewAddress(false);
          }} />
        ) : (
          <AdminAction disabled={saving || (!addresses && !addressError)} onClick={() => setNewAddress(true)} className="mt-4">
            Cadastrar novo endereço
          </AdminAction>
        )}
      </div>
    </div>
  );
}

function NewInstitutionAddress({ token, onCancel, onSaved }: {
  token: string;
  onCancel: () => void;
  onSaved: (address: EnderecoResponseDTO) => void;
}) {
  const [states, setStates] = useState<EstadoResponseDTO[]>([]);
  const [address, setAddress] = useState({
    cep: "", logradouro: "", numero: "", bairro: "", complemento: "", cidade: "", estadoId: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const field = "mt-1 block w-full rounded-lg border border-gray-400 px-3 py-2";

  useEffect(() => {
    const controller = new AbortController();
    api<PaginatedResult<EstadoResponseDTO>>("/api/estados?pageSize=100", token, { signal: controller.signal })
      .then(({ data }) => setStates(data.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))))
      .catch(() => { if (!controller.signal.aborted) setError("Não foi possível carregar os estados."); });
    return () => controller.abort();
  }, [token]);

  useEffect(() => {
    if (!/^\d{5}-?\d{3}$/.test(address.cep) || !states.length) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setMessage("Consultando CEP...");
      try {
        const found = await consultarCep(address.cep, controller.signal);
        if (controller.signal.aborted) return;
        const state = states.find((item) => item.sigla === found.uf);
        setAddress((current) => current.cep !== address.cep ? current : {
          ...current,
          logradouro: current.logradouro || found.logradouro,
          bairro: current.bairro || found.bairro,
          cidade: current.cidade || found.cidade,
          estadoId: current.estadoId || (state ? String(state.id) : ""),
        });
        setMessage("CEP encontrado. Confira os dados do endereço.");
      } catch {
        if (!controller.signal.aborted) setMessage("Não foi possível localizar o CEP. Preencha os dados manualmente.");
      }
    }, 400);
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [address.cep, states]);

  async function saveAddress(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const { cidade, estadoId, ...fields } = address;
    const nome = cidade.trim();
    if (!nome) { setError("Informe a cidade."); return; }
    setSaving(true);
    setError("");
    try {
      const query = new URLSearchParams({ estadoId, busca: nome, pageSize: "100" });
      const findCity = async () => {
        const { data } = await api<PaginatedResult<CidadeResponseDTO>>(`/api/cidades?${query}`, token);
        return data.find((item) => item.nome.localeCompare(nome, "pt-BR", { sensitivity: "base" }) === 0);
      };
      let city = await findCity();
      if (!city) {
        try {
          city = await api<CidadeResponseDTO>("/api/cidades", token, {
            method: "POST", body: JSON.stringify({ nome, estadoId: Number(estadoId) }),
          });
        } catch (reason) {
          city = await findCity();
          if (!city) throw reason;
        }
      }
      const saved = await api<EnderecoResponseDTO>("/api/enderecos", token, {
        method: "POST",
        body: JSON.stringify({ ...fields, complemento: fields.complemento.trim() || null, cidadeId: city.id }),
      });
      onSaved(saved);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível salvar o endereço.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={saveAddress} className="mt-6 border-t border-gray-200 pt-5">
      <h2 className="mb-4 text-xl font-bold">Novo endereço</h2>
      <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
        <label>CEP<input className={field} required pattern="\d{5}-?\d{3}" inputMode="numeric" maxLength={9}
          value={address.cep} onChange={(event) => {
            setMessage("");
            const cep = formatCep(event.target.value);
            setAddress((current) => ({ ...current, cep }));
          }} /></label>
        <label>Estado<select className={field} required value={address.estadoId}
          onChange={(event) => setAddress((current) => ({ ...current, estadoId: event.target.value }))}>
          <option value="">Selecione o estado</option>
          {states.map((state) => <option key={state.id} value={state.id}>{state.nome} ({state.sigla})</option>)}
        </select></label>
        {([
          ["cidade", "Cidade", 100], ["bairro", "Bairro", 45], ["logradouro", "Logradouro", 191],
          ["numero", "Número", 10], ["complemento", "Complemento (opcional)", 45],
        ] as const).map(([key, label, limit]) => (
          <label key={key}>{label}<input className={field} required={key !== "complemento"} maxLength={limit}
            value={address[key]} onChange={(event) => setAddress((current) => ({ ...current, [key]: event.target.value }))} /></label>
        ))}
      </fieldset>
      <p role="status" className="mt-2 text-sm">{message}</p>
      {error && <p role="alert" className="mt-2 text-red-800">{error}</p>}
      <div className="mt-4 flex flex-wrap justify-end gap-3">
        <AdminAction disabled={saving} onClick={onCancel}>Cancelar endereço</AdminAction>
        <AdminAction variant="primary" type="submit" disabled={saving || !states.length}>
          {saving ? "Salvando endereço..." : "Salvar endereço"}
        </AdminAction>
      </div>
    </form>
  );
}
