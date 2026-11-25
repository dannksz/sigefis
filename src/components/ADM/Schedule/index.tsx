"use client";

import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck } from "lucide-react";
import AdminTemplate from "@/templates/AdminTemplate";
import AdminAction from "@/components/ADM/AdminAction";
import AdminTable from "@/components/ADM/AdminTable";
import TableAction from "@/components/ADM/TableAction";
import type { PaginatedResult } from "@/lib/pagination";
import type { CreateEtapaCronogramaDTO, EtapaCronogramaResponseDTO } from "@/types/etapa-cronograma";

type Stage = EtapaCronogramaResponseDTO;
type Work = { id: number; nome: string };
type Session = { nome: string; role: "ADMIN" | "GESTOR" | "FISCAL"; token: string };
const field = "mt-1 block w-full rounded-lg border border-gray-400 bg-white px-3 py-2";
const date = (value: string) => value.slice(0, 10).split("-").reverse().join("/");

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

function sessionFrom(value: string): Session | null {
  try {
    const [raw, token] = JSON.parse(value);
    const user = JSON.parse(raw);
    if (typeof user?.nome === "string" && typeof token === "string" && token &&
      (user.role === "ADMIN" || user.role === "GESTOR" || user.role === "FISCAL")) {
      return { nome: user.nome, role: user.role, token };
    }
  } catch {
    return null;
  }
  return null;
}

async function request<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api/${path}`, {
    ...options, cache: "no-store",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error ?? "Não foi possível concluir a operação.");
  return body;
}

async function listAll<T>(path: string, token: string, signal: AbortSignal, filter?: Record<string, string>) {
  const items: T[] = [];
  for (let page = 1; ; page++) {
    const query = new URLSearchParams({ ...filter, page: String(page), pageSize: "100" });
    const result = await request<PaginatedResult<T>>(`${path}?${query}`, token, { signal });
    items.push(...result.data);
    if (page >= result.pagination.totalPages) return items;
  }
}

export default function Schedule() {
  const router = useRouter();
  const snapshotValue = useSyncExternalStore(subscribe, snapshot, () => "");
  const session = sessionFrom(snapshotValue);
  if (!session) return <main className="p-8">{snapshotValue
    ? <><p className="mb-3">Entre com uma conta autorizada para consultar o cronograma.</p><AdminAction href="/login">Entrar</AdminAction></>
    : <p role="status">Carregando painel...</p>}</main>;

  return (
    <AdminTemplate user={session} onLogout={() => {
      for (const storage of [localStorage, sessionStorage]) {
        storage.removeItem("sigefis_user");
        storage.removeItem("sigefis_token");
      }
      window.dispatchEvent(new Event("sigefis-auth"));
      router.replace("/");
    }}>
      <ScheduleContent key={session.token} token={session.token} canEdit={session.role !== "FISCAL"} />
    </AdminTemplate>
  );
}

function ScheduleContent({ token, canEdit }: { token: string; canEdit: boolean }) {
  const [works, setWorks] = useState<Work[]>();
  const [error, setError] = useState("");
  const [workId, setWorkId] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    listAll<Work>("projetos", token, controller.signal)
      .then((items) => { if (!controller.signal.aborted) setWorks(items.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))); })
      .catch((reason: Error) => { if (!controller.signal.aborted) setError(reason.message); });
    return () => controller.abort();
  }, [token]);

  return (
    <div className="mx-auto max-w-[1500px]">
      <h1 className="mb-6 flex items-center gap-3 text-3xl font-bold"><ClipboardCheck aria-hidden="true" />Cronograma da obra</h1>
      {error ? <p role="alert">{error}</p> : !works ? <p role="status">Carregando obras...</p> :
        <label className="block max-w-xl">Obra<select className={field} value={workId} onChange={(event) => setWorkId(event.target.value)}>
          <option value="">{works.length ? "Selecione uma obra" : "Nenhuma obra cadastrada"}</option>
          {works.map((work) => <option key={work.id} value={work.id}>{work.nome}</option>)}
        </select></label>}
      {workId && <StageList key={workId} workId={workId} token={token} canEdit={canEdit} />}
    </div>
  );
}

function StageList({ workId, token, canEdit }: { workId: string; token: string; canEdit: boolean }) {
  const [stages, setStages] = useState<Stage[]>();
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Stage | "new" | null>(null);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    listAll<Stage>("etapas-cronograma", token, controller.signal, { projetoObraId: workId })
      .then((items) => { if (!controller.signal.aborted) setStages(items); })
      .catch((reason: Error) => { if (!controller.signal.aborted) setError(reason.message); });
    return () => controller.abort();
  }, [token, workId]);

  return (
    <section className="mt-6" aria-labelledby="stage-heading">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="stage-heading" className="text-xl font-bold">Etapas</h2>
        {canEdit && <AdminAction variant="primary" disabled={!stages || editing !== null}
          onClick={() => { setNotice(""); setEditing("new"); }}>Adicionar etapa</AdminAction>}
      </header>
      {error ? <p role="alert">{error}</p> : !stages && <p role="status">Carregando etapas...</p>}
      {notice && <p role="status" className="mb-4 text-green-800">{notice}</p>}
      {stages && (stages.length ? <AdminTable data={[...stages].sort((a, b) => a.ordemEtapa - b.ordemEtapa || a.id - b.id)}
        keyExtractor={(item) => item.id} columns={[
          { key: "ordemEtapa", header: "Ordem" },
          { key: "nomeEtapa", header: "Etapa" },
          { key: "period", header: "Período previsto", render: (item) => `${date(item.dataInicioPrevista)} a ${date(item.dataFimPrevista)}` },
          { key: "actual", header: "Datas reais", render: (item) => `${item.dataInicioReal ? date(item.dataInicioReal) : "—"} a ${item.dataFimReal ? date(item.dataFimReal) : "—"}` },
          { key: "weight", header: "Peso na obra", render: (item) => `${item.percentualPrevisto}%` },
          { key: "progress", header: "Execução da etapa", render: (item) => `${item.percentualExecutado}%` },
          { key: "status", header: "Status" },
          ...(canEdit ? [{
            key: "actions", header: "Ações", align: "center" as const,
            render: (item: Stage) => editing === null && <TableAction action="edit" name={item.nomeEtapa}
              onClick={() => { setNotice(""); setEditing(item); }} />,
          }] : []),
        ]} /> : <p className="rounded-lg bg-white p-6">Nenhuma etapa cadastrada para esta obra.</p>)}
      {editing && <StageForm stage={editing === "new" ? undefined : editing} workId={Number(workId)} token={token}
        nextOrder={Math.max(0, ...(stages ?? []).map((item) => item.ordemEtapa)) + 1}
        onCancel={() => setEditing(null)} onSaved={(saved) => {
          setStages((items) => [...(items ?? []).filter((item) => item.id !== saved.id), saved]);
          setEditing(null);
          setNotice("Etapa salva com sucesso.");
        }} />}
    </section>
  );
}

function StageForm({ stage, workId, token, nextOrder, onCancel, onSaved }: {
  stage?: Stage; workId: number; token: string; nextOrder: number;
  onCancel: () => void; onSaved: (stage: Stage) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const fields = new FormData(event.currentTarget);
    const value = (key: keyof CreateEtapaCronogramaDTO) => String(fields.get(key) ?? "").trim();
    const body: CreateEtapaCronogramaDTO = {
      projetoObraId: workId,
      nomeEtapa: value("nomeEtapa"),
      ordemEtapa: Number(value("ordemEtapa")),
      status: value("status"),
      percentualPrevisto: value("percentualPrevisto"),
      percentualExecutado: value("percentualExecutado"),
      dataInicioPrevista: value("dataInicioPrevista"),
      dataFimPrevista: value("dataFimPrevista"),
      dataInicioReal: value("dataInicioReal") || null,
      dataFimReal: value("dataFimReal") || null,
    };
    setSaving(true);
    setError("");
    try {
      const saved = await request<Stage>(stage ? `etapas-cronograma/${stage.id}` : "etapas-cronograma", token, {
        method: stage ? "PUT" : "POST", body: JSON.stringify(body),
      });
      onSaved(saved);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível salvar a etapa.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 rounded-xl bg-white p-6 shadow-sm">
      <h3 className="mb-5 text-lg font-bold">{stage ? "Alterar etapa" : "Adicionar etapa"}</h3>
      <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
        <label>Nome da etapa<input className={field} name="nomeEtapa" required maxLength={45} defaultValue={stage?.nomeEtapa} /></label>
        <label>Ordem<input className={field} name="ordemEtapa" required type="number" min={1} step={1} defaultValue={stage?.ordemEtapa ?? nextOrder} /></label>
        <label>Status<input className={field} name="status" required maxLength={45} defaultValue={stage?.status ?? "Planejada"} /></label>
        <label>Peso da etapa na obra (%)
          <input className={field} name="percentualPrevisto" required type="number" min={0} max={100} step="0.01"
            aria-describedby="stage-weight-help" defaultValue={stage?.percentualPrevisto ?? "0"} />
          <span id="stage-weight-help" className="mt-1 block text-sm text-gray-600">Quanto esta etapa representa da obra inteira. Ex.: se a fundação representa 10% da obra, informe 10.</span>
        </label>
        <label>Execução da etapa (%)
          <input className={field} name="percentualExecutado" required type="number" min={0} max={100} step="0.01"
            aria-describedby="stage-progress-help" defaultValue={stage?.percentualExecutado ?? "0"} />
          <span id="stage-progress-help" className="mt-1 block text-sm text-gray-600">Quanto desta etapa já foi concluído. Informe 50 para metade da etapa ou 100 para a etapa concluída.</span>
        </label>
        {([
          ["dataInicioPrevista", "Início previsto", true], ["dataFimPrevista", "Fim previsto", true],
          ["dataInicioReal", "Início real", false], ["dataFimReal", "Fim real", false],
        ] as const).map(([name, label, required]) => (
          <label key={name}>{label}<input className={field} name={name} type="date" required={required} defaultValue={stage?.[name]?.slice(0, 10)} /></label>
        ))}
      </fieldset>
      {error && <p role="alert" className="mt-4 text-red-800">{error}</p>}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <AdminAction disabled={saving} onClick={onCancel}>Cancelar</AdminAction>
        <AdminAction variant="primary" type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar etapa"}</AdminAction>
      </div>
    </form>
  );
}
