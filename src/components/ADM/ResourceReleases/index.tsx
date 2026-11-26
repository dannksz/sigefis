import { useEffect, useState, type FormEvent } from "react";
import { Banknote } from "lucide-react";
import AdminAction from "@/components/ADM/AdminAction";
import AdminTable from "@/components/ADM/AdminTable";
import TableAction from "@/components/ADM/TableAction";
import { formatBrlInput } from "@/lib/input-masks";
import type { PaginatedResult } from "@/lib/pagination";
import type { LiberacaoRecursoResponseDTO as Release, CreateLiberacaoRecursoDTO } from "@/types/liberacao-recurso";
import type { EtapaCronogramaResponseDTO as Stage } from "@/types/etapa-cronograma";
import type { ProjetoVerbaResponseDTO as Allocation } from "@/types/projeto-verba";
import type { VerbaPublicaResponseDTO as Fund } from "@/types/verba-publica";

type Session = { id: number; role: "ADMIN" | "GESTOR"; token: string };
type Work = { id: number; nome: string };
const field = "mt-1 block w-full rounded-lg border border-gray-400 bg-white px-3 py-2";
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const money = (value: string | number) => brl.format(Number(value));
const cents = (value: string) => Math.round(Number(value) * 100);
const date = (value: string) => value.slice(0, 10).split("-").reverse().join("/");
const statuses = { PENDENTE: "Pendente", APROVADA: "Aprovada", REJEITADA: "Rejeitada" };

async function request<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api/${path}`, {
    ...options, cache: "no-store",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error ?? "Não foi possível concluir a operação.");
  return body;
}

async function listAll<T>(resource: string, token: string, signal: AbortSignal, filter?: Record<string, string>) {
  const items: T[] = [];
  for (let page = 1; ; page++) {
    const query = new URLSearchParams({ ...filter, page: String(page), pageSize: "100" });
    const result = await request<PaginatedResult<T>>(`${resource}?${query}`, token, { signal });
    items.push(...result.data);
    if (page >= result.pagination.totalPages) return items;
  }
}

export default function ResourceReleases({ session }: { session: Session }) {
  const [works, setWorks] = useState<Work[]>();
  const [error, setError] = useState("");
  const [workId, setWorkId] = useState("");
  const { token } = session;
  useEffect(() => {
    const controller = new AbortController();
    listAll<Work>("projetos", token, controller.signal)
      .then((items) => { if (!controller.signal.aborted) setWorks(items.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))); })
      .catch((reason: Error) => { if (!controller.signal.aborted) setError(reason.message); });
    return () => controller.abort();
  }, [token]);

  return (
    <div className="mx-auto max-w-[1500px]">
      <h1 className="mb-6 flex items-center gap-3 text-3xl font-bold"><Banknote aria-hidden="true" />Financeiro</h1>
      <h2 className="mb-4 text-xl font-bold">Liberações de recursos</h2>
      {error ? <p role="alert">{error}</p> : !works ? <p role="status">Carregando obras...</p> : (
        <label className="block max-w-xl">Obra
          <select className={field} value={workId} onChange={(event) => setWorkId(event.target.value)}>
            <option value="">{works.length ? "Selecione uma obra" : "Nenhuma obra cadastrada"}</option>
            {works.map((work) => <option key={work.id} value={work.id}>{work.nome}</option>)}
          </select>
        </label>
      )}
      {workId && <ReleaseList key={workId} workId={workId} session={session} />}
    </div>
  );
}

function ReleaseList({ workId, session }: { workId: string; session: Session }) {
  const { token } = session;
  const [data, setData] = useState<{ stages: Stage[]; funds: Fund[]; allocations: Allocation[]; releases: Release[] }>();
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("");
  const [fundId, setFundId] = useState("");
  const [amount, setAmount] = useState("");
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Release | null>(null);
  const [decision, setDecision] = useState<"aprovar" | "rejeitar" | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const scope = { projetoObraId: workId };
    Promise.all([
      listAll<Stage>("etapas-cronograma", token, signal, scope),
      listAll<Fund>("verbas-publicas", token, signal),
      listAll<Allocation>("projetos-verbas", token, signal, scope),
      listAll<Release>("liberacoes-recursos", token, signal),
    ]).then(([stages, funds, allocations, releases]) => {
      if (signal.aborted) return;
      const stageIds = new Set(stages.map((stage) => stage.id));
      setData({ stages, funds, allocations, releases: releases.filter((item) => stageIds.has(item.etapaCronogramaId)) });
    }).catch((reason: Error) => { if (!signal.aborted) setLoadError(reason.message); });
    return () => controller.abort();
  }, [token, workId]);

  function resetFeedback() {
    setError("");
    setNotice("");
  }

  async function saveRelease(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const fields = new FormData(event.currentTarget);
    const body: CreateLiberacaoRecursoDTO = {
      etapaCronogramaId: Number(fields.get("etapa")),
      verbaPublicaId: Number(fundId),
      dataLiberacao: String(fields.get("data") ?? ""),
      valorLiberacao: amount.replace(/\./g, "").replace(",", "."),
    };
    resetFeedback();
    setSaving(true);
    try {
      const saved = await request<Release>("liberacoes-recursos", token, { method: "POST", body: JSON.stringify(body) });
      setData((current) => current && { ...current, releases: [saved, ...current.releases] });
      setFilter("");
      setCreating(false);
      setNotice("Liberação registrada como pendente.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Falha ao registrar a liberação.");
    } finally { setSaving(false); }
  }

  async function saveDecision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !decision || saving || session.role !== "ADMIN") return;
    const fields = new FormData(event.currentTarget);
    resetFeedback();
    setSaving(true);
    try {
      const saved = await request<Release>(`liberacoes-recursos/${selected.id}/${decision}`, token, {
        method: "POST", body: decision === "rejeitar" ? JSON.stringify({ justificativa: String(fields.get("justificativa") ?? "").trim() }) : undefined,
      });
      setData((current) => current && { ...current, releases: current.releases.map((item) => item.id === saved.id ? saved : item) });
      setSelected(saved);
      setDecision(null);
      setNotice(saved.status === "APROVADA" ? "Liberação aprovada." : "Liberação rejeitada.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Falha ao decidir a liberação.");
    } finally { setSaving(false); }
  }

  if (loadError) return <p className="mt-5 text-red-800" role="alert">{loadError}</p>;
  if (!data) return <p className="mt-5" role="status">Carregando liberações...</p>;
  const fundName = (id: number) => data.funds.find((item) => item.id === id)?.finalidade ?? `Verba #${id}`;
  const stageName = (id: number) => data.stages.find((item) => item.id === id)?.nomeEtapa ?? `Etapa #${id}`;
  const availableFunds = data.funds.filter((fund) => data.allocations.some((item) => item.verbaPublicaId === fund.id && Number(item.valorAlocado) > 0));
  const visible = data.releases.filter((item) => !filter || item.status === filter)
    .sort((a, b) => b.dataLiberacao.localeCompare(a.dataLiberacao) || b.id - a.id);
  const fundAllocations = data.allocations.filter((item) => item.verbaPublicaId === Number(fundId));
  const allocated = fundAllocations.reduce((sum, item) => sum + cents(item.valorAlocado), 0);
  const used = data.releases.filter((item) => item.verbaPublicaId === Number(fundId) && item.status !== "REJEITADA")
    .reduce((sum, item) => sum + cents(item.valorLiberacao), 0);
  const canDecide = session.role === "ADMIN" && selected?.status === "PENDENTE" && selected.criadoPorUsuarioId !== session.id;
  const totalByStatus = (status: Release["status"]) =>
    data.releases.reduce((sum, item) => item.status === status ? sum + cents(item.valorLiberacao) : sum, 0);

  return (
    <section className="mt-6 space-y-4" aria-label="Liberações da obra">
      <dl className="grid gap-3 rounded-lg bg-white p-4 sm:grid-cols-2">
        <Detail label="Em solicitações pendentes" value={money(totalByStatus("PENDENTE") / 100)} />
        <Detail label="Total aprovado" value={money(totalByStatus("APROVADA") / 100)} />
      </dl>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label>Status<select className={field} value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="">Todos</option>
          {Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select></label>
        <AdminAction variant="primary" disabled={creating || saving || !data.stages.length || !availableFunds.length}
          onClick={() => { resetFeedback(); setSelected(null); setDecision(null); setAmount(""); setFundId(""); setCreating(true); }}>
          Registrar liberação
        </AdminAction>
      </div>
      {(!availableFunds.length || !data.stages.length) && <p className="text-sm text-gray-700">A obra precisa ter uma etapa cadastrada e uma verba alocada para registrar uma liberação.</p>}
      {notice && <p role="status" className="text-green-800">{notice}</p>}
      {visible.length ? <AdminTable data={visible} keyExtractor={(item) => item.id} columns={[
        { key: "etapa", header: "Etapa", render: (item) => stageName(item.etapaCronogramaId) },
        { key: "verba", header: "Verba", render: (item) => fundName(item.verbaPublicaId) },
        { key: "valor", header: "Valor", render: (item) => money(item.valorLiberacao) },
        { key: "data", header: "Data", render: (item) => date(item.dataLiberacao) },
        { key: "status", header: "Status", render: (item) => statuses[item.status] },
        { key: "actions", header: "Ações", align: "center", render: (item) => !creating && !saving && (
          <TableAction action="details" name={`Liberação #${item.id}`} onClick={() => {
            resetFeedback(); setDecision(null); setSelected(item);
          }} />
        ) },
      ]} /> : <p className="rounded-lg bg-white p-6">Nenhuma liberação encontrada.</p>}
      {creating && (
        <form onSubmit={saveRelease} className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold">Registrar liberação</h3>
          <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
            <label>Etapa<select className={field} name="etapa" required defaultValue="">
              <option value="">Selecione uma etapa</option>
              {[...data.stages].sort((a, b) => a.ordemEtapa - b.ordemEtapa).map((stage) => <option key={stage.id} value={stage.id}>{stage.nomeEtapa}</option>)}
            </select></label>
            <label>Verba alocada<select className={field} value={fundId} required onChange={(event) => setFundId(event.target.value)}>
              <option value="">Selecione uma verba</option>
              {availableFunds.map((fund) => <option key={fund.id} value={fund.id}>{fund.finalidade} · {fund.origem}</option>)}
            </select></label>
            <label>Valor (R$)<input className={field} inputMode="numeric" required placeholder="0,00" value={amount}
              onChange={(event) => setAmount(formatBrlInput(event.target.value))} /></label>
            <label>Data da liberação<input className={field} name="data" type="date" required /></label>
          </fieldset>
          {fundId && <p className="mt-4 text-sm">Saldo nesta obra e verba: <strong>{money(Math.max(0, allocated - used) / 100)}</strong>. Pendências e liberações aprovadas entram no cálculo.</p>}
          {error && <p role="alert" className="mt-3 text-red-800">{error}</p>}
          <div className="mt-5 flex justify-end gap-3">
            <AdminAction disabled={saving} onClick={() => setCreating(false)}>Cancelar</AdminAction>
            <AdminAction type="submit" variant="primary" disabled={saving}>{saving ? "Salvando..." : "Salvar liberação"}</AdminAction>
          </div>
        </form>
      )}
      {selected && (
        <section className="rounded-xl bg-white p-6 shadow-sm" aria-label="Detalhes da liberação">
          <h3 className="mb-4 text-lg font-bold">Liberação #{selected.id}</h3>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Detail label="Etapa" value={stageName(selected.etapaCronogramaId)} />
            <Detail label="Verba" value={fundName(selected.verbaPublicaId)} />
            <Detail label="Valor" value={money(selected.valorLiberacao)} />
            <Detail label="Data da liberação" value={date(selected.dataLiberacao)} />
            <Detail label="Status" value={statuses[selected.status]} />
            <Detail label="Solicitado por" value={`Usuário #${selected.criadoPorUsuarioId}`} />
            {selected.aprovadoPorUsuarioId !== null && <Detail label="Decidido por" value={`Usuário #${selected.aprovadoPorUsuarioId}`} />}
            {selected.dataAprovacao && <Detail label="Data da decisão" value={date(selected.dataAprovacao)} />}
          </dl>
          {selected.status === "PENDENTE" && (
            <p className="mt-4 text-sm text-gray-700">A aprovação exige uma vistoria da etapa aprovada na revisão externa e uma obra sem bloqueio de repasse vigente.</p>
          )}
          {session.role === "ADMIN" && selected.status === "PENDENTE" && selected.criadoPorUsuarioId === session.id && (
            <p className="mt-2 text-sm text-gray-700">Outro administrador precisa decidir esta solicitação.</p>
          )}
          {error && <p role="alert" className="mt-3 text-red-800">{error}</p>}
          {canDecide && decision ? (
            <form onSubmit={saveDecision} className="mt-5 border-t border-gray-200 pt-4">
              {decision === "rejeitar" ? <label>Justificativa
                <textarea className={field} name="justificativa" required rows={3} maxLength={65535} disabled={saving} />
              </label> : <p>Confirma a aprovação desta liberação?</p>}
              <div className="mt-4 flex flex-wrap justify-end gap-3">
                <AdminAction disabled={saving} onClick={() => { setDecision(null); setError(""); }}>Cancelar decisão</AdminAction>
                <AdminAction type="submit" variant="primary" disabled={saving}>{saving ? "Salvando..." : decision === "aprovar" ? "Confirmar aprovação" : "Confirmar rejeição"}</AdminAction>
              </div>
            </form>
          ) : (
            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <AdminAction onClick={() => { setSelected(null); setDecision(null); resetFeedback(); }}>Fechar detalhes</AdminAction>
              {canDecide && <>
                <AdminAction onClick={() => { resetFeedback(); setDecision("rejeitar"); }}>Rejeitar</AdminAction>
                <AdminAction variant="primary" onClick={() => { resetFeedback(); setDecision("aprovar"); }}>Aprovar</AdminAction>
              </>}
            </div>
          )}
        </section>
      )}
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-sm text-gray-600">{label}</dt><dd className="font-medium">{value}</dd></div>;
}
