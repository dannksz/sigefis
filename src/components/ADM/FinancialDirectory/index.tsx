"use client";

import { BriefcaseBusiness, WalletCards } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import AdminTemplate from "@/templates/AdminTemplate";
import AdminTable from "@/components/ADM/AdminTable";
import TableAction from "@/components/ADM/TableAction";
import AdminAction from "@/components/ADM/AdminAction";
import Pagination from "@/components/Pagination";
import ContractForm from "@/components/ADM/ContractForm";
import FundingForm from "@/components/ADM/FundingForm";
import ResourceReleases from "@/components/ADM/ResourceReleases";
import type { PaginatedResult } from "@/lib/pagination";
import type { ContratoResponseDTO } from "@/types/contrato";
import type { VerbaPublicaResponseDTO } from "@/types/verba-publica";
import type { EmendaParlamentarResponseDTO } from "@/types/emenda-parlamentar";

type RecordDTO = ContratoResponseDTO | VerbaPublicaResponseDTO | EmendaParlamentarResponseDTO;
type Section = "contratos" | "verbas-publicas" | "emendas-parlamentares";
type Reference = { label: string; path: string; field: "nome" | "finalidade" };
type Row = { id: number; title: string; description: string; amount: string; fields: [string, string][]; references: Reference[] };

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const date = (value: string) => value.slice(0, 10).split("-").reverse().join("/");
const settings = {
  contratos: { heading: "Número do contrato", description: "Vigência", search: "Pesquisar por número do contrato" },
  "verbas-publicas": { heading: "Finalidade", description: "Origem", search: "Pesquisar por origem ou finalidade" },
  "emendas-parlamentares": { heading: "Número da emenda", description: "Autor", search: "Pesquisar por número ou autor" },
};

function toRow(record: RecordDTO): Row {
  if ("numeroContrato" in record) {
    return {
      id: record.id, title: record.numeroContrato,
      description: `${date(record.dataInicio)} a ${date(record.dataFim)}`,
      amount: currency.format(Number(record.valorContrato)),
      fields: [["Assinatura", date(record.dataAssinatura)]],
      references: [
        { label: "Obra", path: `projetos/${record.projetoObraId}`, field: "nome" },
        { label: "Empresa", path: `empresas/${record.empresaId}`, field: "nome" },
        { label: "Verba pública", path: `verbas-publicas/${record.verbaPublicaId}`, field: "finalidade" },
      ],
    };
  }
  const funding = "origem" in record;
  return {
    id: record.id, title: funding ? record.finalidade : record.numero,
    description: funding ? record.origem : record.autor,
    amount: currency.format(Number(record.valor)),
    fields: [],
    references: funding
      ? [{ label: "Órgão público", path: `orgaos/${record.orgaoId}`, field: "nome" }]
      : [{ label: "Verba pública", path: `verbas-publicas/${record.verbaId}`, field: "finalidade" }],
  };
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("sigefis-auth", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("sigefis-auth", callback);
  };
}

function snapshot() {
  const storage = localStorage.getItem("sigefis_user") ? localStorage : sessionStorage;
  return JSON.stringify([storage.getItem("sigefis_user"), storage.getItem("sigefis_token")]);
}

function readSession(value: string) {
  try {
    const [raw, token] = JSON.parse(value);
    const user = JSON.parse(raw);
    if (typeof token === "string" && token && typeof user?.nome === "string") {
      if (user.role === "ADMIN") return { id: Number(user.id), nome: user.nome as string, role: "ADMIN" as const, token };
      if (user.role === "GESTOR") return { id: Number(user.id), nome: user.nome as string, role: "GESTOR" as const, token };
    }
  } catch {
    return null;
  }
  return null;
}

async function request<T>(path: string, token: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(`/api/${path}`, {
    headers: { Authorization: `Bearer ${token}` }, signal, cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(response.status === 401 ? "Sua sessão expirou. Entre novamente." : "Não foi possível carregar os dados.");
  }
  return response.json();
}

export default function FinancialDirectory({ area, form, showAmendments }: {
  area: "contracts" | "funding" | "finance"; form?: { id?: number; amendment?: boolean }; showAmendments?: boolean;
}) {
  const value = useSyncExternalStore(subscribe, snapshot, () => "");
  const session = readSession(value);
  const router = useRouter();
  const [fundingSection, setFundingSection] = useState<Section>(showAmendments ? "emendas-parlamentares" : "verbas-publicas");
  const contracts = area === "contracts";
  const section = contracts ? "contratos" : fundingSection;
  const Icon = contracts ? BriefcaseBusiness : WalletCards;

  if (!session) {
    return <main className="p-8">{value
      ? <><p>Área exclusiva para administradores e gestores.</p><Link href="/login" className="underline">Entrar</Link></>
      : <p role="status">Carregando painel...</p>}</main>;
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
      {area === "finance" ? <ResourceReleases key={session.token} session={session} /> : form ? (
        contracts ? <ContractForm key={form.id ?? "new"} id={form.id} token={session.token} />
          : <FundingForm key={`${form.amendment}-${form.id ?? "new"}`} id={form.id} token={session.token} amendment={form.amendment} />
      ) : <div className="mx-auto max-w-[1500px]">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="flex items-center gap-3 text-3xl font-bold"><Icon aria-hidden="true" />{contracts ? "Contratos" : "Verbas e emendas"}</h1>
          {contracts && <AdminAction variant="primary" href="/adm/contratos/adicionar">Adicionar contrato</AdminAction>}
          {section === "verbas-publicas" && <AdminAction variant="primary" href="/adm/verbas/adicionar">Adicionar verba pública</AdminAction>}
          {section === "emendas-parlamentares" && <AdminAction variant="primary" href="/adm/verbas/emendas/adicionar">Adicionar emenda</AdminAction>}
        </header>
        {!contracts && (
          <nav className="mb-5 flex flex-wrap gap-2" aria-label="Tipo de recurso">
            <AdminAction variant={section === "verbas-publicas" ? "primary" : "secondary"} onClick={() => setFundingSection("verbas-publicas")}>Verbas públicas</AdminAction>
            <AdminAction variant={section === "emendas-parlamentares" ? "primary" : "secondary"} onClick={() => setFundingSection("emendas-parlamentares")}>Emendas parlamentares</AdminAction>
          </nav>
        )}
        <RecordList key={section} section={section} token={session.token} />
      </div>}
    </AdminTemplate>
  );
}

function RecordList({ section, token }: { section: Section; token: string }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{ path: string; data?: PaginatedResult<RecordDTO>; error?: string }>();
  const [selected, setSelected] = useState<Row>();
  const dialog = useRef<HTMLDialogElement>(null);
  const config = settings[section];
  const query = new URLSearchParams({ busca: search.trim(), page: String(page), pageSize: "10" });
  const path = `${section}?${query}`;
  const current = result?.path === path ? result : undefined;
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      request<PaginatedResult<RecordDTO>>(path, token, controller.signal)
        .then((data) => { if (!controller.signal.aborted) setResult({ path, data }); })
        .catch((error: Error) => { if (!controller.signal.aborted) setResult({ path, error: error.message }); });
    }, 200);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [path, token]);

  return (
    <>
      <input type="search" aria-label={config.search} placeholder={config.search}
        className="mb-5 w-full rounded-lg border border-gray-400 bg-white px-4 py-3"
        value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
      {!current && <p role="status">Carregando registros...</p>}
      {current?.error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">{current.error}</p>}
      {current?.data && (
        <>
          <p className="mb-3 text-sm">Total de registros: {current.data.pagination.total}</p>
          {current.data.data.length ? <AdminTable data={current.data.data.map(toRow)} keyExtractor={(row) => row.id} columns={[
            { key: "title", header: config.heading },
            { key: "description", header: config.description },
            { key: "amount", header: "Valor" },
            { key: "details", header: "Ações", align: "center", render: (row) => (
              <div className="flex justify-center gap-2">
                <TableAction action="details" name={row.title} onClick={() => {
                  setSelected(row);
                  dialog.current?.showModal();
                }} />
                {section === "contratos" && <TableAction action="edit" name={row.title} href={`/adm/contratos/${row.id}/alterar`} />}
                {section === "verbas-publicas" && <TableAction action="edit" name={row.title} href={`/adm/verbas/${row.id}/alterar`} />}
                {section === "emendas-parlamentares" && <TableAction action="edit" name={row.title} href={`/adm/verbas/emendas/${row.id}/alterar`} />}
              </div>
            ) },
          ]} /> : <p className="rounded-lg bg-white p-8 text-center">Nenhum registro encontrado.</p>}
          <Pagination currentPage={page} totalPages={current.data.pagination.totalPages} onPageChange={setPage} />
        </>
      )}
      <dialog ref={dialog} onClose={() => setSelected(undefined)} aria-labelledby="financial-record-title"
        className="m-auto w-[calc(100%-2rem)] max-w-xl rounded-xl p-6 shadow-xl backdrop:bg-black/55">
        <h2 id="financial-record-title" className="text-xl font-bold">{selected?.title}</h2>
        {selected && <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          {[[config.description, selected.description], ["Valor", selected.amount], ...selected.fields].map(([label, text]) => (
            <div key={label}><dt className="text-sm text-gray-600">{label}</dt><dd>{text}</dd></div>
          ))}
          {selected.references.map((reference) => <RecordReference key={reference.path} reference={reference} token={token} />)}
        </dl>}
        <form method="dialog" className="mt-6 flex justify-end"><AdminAction type="submit">Fechar</AdminAction></form>
      </dialog>
    </>
  );
}

function RecordReference({ reference, token }: { reference: Reference; token: string }) {
  const [text, setText] = useState("Carregando...");
  const { path, field, label } = reference;
  useEffect(() => {
    const controller = new AbortController();
    request<Partial<Record<Reference["field"], string>>>(path, token, controller.signal)
      .then((record) => { if (!controller.signal.aborted) setText(record[field] ?? "Não informado"); })
      .catch(() => { if (!controller.signal.aborted) setText("Indisponível"); });
    return () => controller.abort();
  }, [path, field, token]);
  return <div><dt className="text-sm text-gray-600">{label}</dt><dd>{text}</dd></div>;
}
