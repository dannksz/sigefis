"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ClipboardCheck, FileImage, FileSearch, FileText, FileVideo } from "lucide-react";
import AdminTemplate from "@/templates/AdminTemplate";
import AdminAction from "@/components/ADM/AdminAction";
import AdminTable from "@/components/ADM/AdminTable";
import TableAction from "@/components/ADM/TableAction";
import ImageUpload from "@/components/ADM/ImageUpload";
import type { PaginatedResult } from "@/lib/pagination";
import type { CreateEtapaCronogramaDTO, EtapaCronogramaResponseDTO } from "@/types/etapa-cronograma";
import type { FiscalizacaoResponseDTO, CreateFiscalizacaoDTO } from "@/types/fiscalizacao";
import type { EvidenciaFiscalizacaoResponseDTO } from "@/types/evidencia-fiscalizacao";
import type { RevisaoFiscalizacaoResponseDTO } from "@/types/revisao-fiscalizacao";

type Stage = EtapaCronogramaResponseDTO;
type Work = { id: number; nome: string };
type Session = { id: number; nome: string; role: "ADMIN" | "GESTOR" | "FISCAL"; token: string };
const field = "mt-1 block w-full rounded-lg border border-gray-400 bg-white px-3 py-2";
const date = (value: string) => value.slice(0, 10).split("-").reverse().join("/");
const percent = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 2 });
const inspectionStatuses: Record<string, string> = {
  REGISTRADA: "Registrada",
  PENDENTE_REVISAO: "Aguardando revisão",
  APROVADA: "Aprovada",
  CONTESTADA: "Contestada",
  CORRECAO_SOLICITADA: "Correção solicitada",
};
const inspectionStatus = (status: string) => inspectionStatuses[status] ?? status;
const evidenceCategories = [
  "Avanço da obra",
  "Irregularidade encontrada",
  "Correção realizada",
  "Condições de segurança",
  "Documento técnico",
  "Outro",
];
const evidenceFormats = {
  jpg: { icon: FileImage, color: "border-blue-300 bg-blue-50 text-blue-900", image: true },
  png: { icon: FileImage, color: "border-emerald-300 bg-emerald-50 text-emerald-900", image: true },
  pdf: { icon: FileText, color: "border-red-300 bg-red-50 text-red-900", image: false },
  mp4: { icon: FileVideo, color: "border-violet-300 bg-violet-50 text-violet-900", image: false },
  webm: { icon: FileVideo, color: "border-amber-300 bg-amber-50 text-amber-900", image: false },
};

function evidenceFormat(path: string) {
  const extension = path.split(".").at(-1)?.toLowerCase();
  switch (extension) {
    case "jpg": case "png": case "pdf": case "mp4": case "webm":
      return { extension, ...evidenceFormats[extension] };
    default:
      return { extension: "arquivo", icon: FileText, color: "border-gray-300 bg-gray-50 text-gray-800", image: false };
  }
}
const stageStatuses = [
  ["PLANEJADA", "Planejada"],
  ["EM_EXECUCAO", "Em execução"],
  ["ATRASADA", "Atrasada"],
  ["PARALISADA", "Paralisada"],
  ["CONCLUIDA", "Concluída"],
] as const;

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
      return { id: Number(user.id), nome: user.nome, role: user.role, token };
    }
  } catch {
    return null;
  }
  return null;
}

async function request<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api/${path}`, {
    ...options, cache: "no-store",
    headers: { Authorization: `Bearer ${token}`, ...(!(options?.body instanceof FormData) && { "Content-Type": "application/json" }) },
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

export default function Schedule({ inspections = false }: { inspections?: boolean }) {
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
      <ScheduleContent key={`${session.token}/${inspections}`} session={session} inspections={inspections} />
    </AdminTemplate>
  );
}

function ScheduleContent({ session, inspections }: { session: Session; inspections: boolean }) {
  const { token, role } = session;
  const Icon = inspections ? FileSearch : ClipboardCheck;
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
      <h1 className="mb-6 flex items-center gap-3 text-3xl font-bold"><Icon aria-hidden="true" />{inspections ? "Fiscalizações" : "Cronograma da obra"}</h1>
      {error ? <p role="alert">{error}</p> : !works ? <p role="status">Carregando obras...</p> :
        <label className="block max-w-xl">Obra<select className={field} value={workId} onChange={(event) => setWorkId(event.target.value)}>
          <option value="">{works.length ? "Selecione uma obra" : "Nenhuma obra cadastrada"}</option>
          {works.map((work) => <option key={work.id} value={work.id}>{work.nome}</option>)}
        </select></label>}
      {workId && (inspections
        ? <InspectionList key={workId} workId={workId} session={session} />
        : <StageList key={workId} workId={workId} token={token} canEdit={role !== "FISCAL"} canDelete={role === "ADMIN"} />)}
    </div>
  );
}

function InspectionList({ workId, session }: { workId: string; session: Session }) {
  const { token, role, id } = session;
  const [data, setData] = useState<{ stages: Stage[]; visits: FiscalizacaoResponseDTO[]; internal: boolean }>();
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState<FiscalizacaoResponseDTO | null>(null);
  const canCreate = (role === "ADMIN" || data?.internal === true) && Number.isSafeInteger(id) && id > 0;

  useEffect(() => {
    const controller = new AbortController();
    const filter = { projetoObraId: workId };
    Promise.all([
      listAll<Stage>("etapas-cronograma", token, controller.signal, filter),
      listAll<FiscalizacaoResponseDTO>("fiscalizacoes", token, controller.signal, filter),
      role === "FISCAL" ? listAll<{ tipoFiscal: string }>("obras-fiscais", token, controller.signal, { ...filter, usuarioId: String(id) }) : [],
    ]).then(([stages, visits, assignments]) => {
      if (!controller.signal.aborted) setData({ stages, visits, internal: assignments.some((item) => item.tipoFiscal === "INTERNO") });
    }).catch((reason: unknown) => {
      if (!controller.signal.aborted) setLoadError(reason instanceof Error ? reason.message : "Falha ao carregar as vistorias.");
    });
    return () => controller.abort();
  }, [id, role, token, workId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canCreate || saving || !data) return;
    const fields = new FormData(event.currentTarget);
    const value = (name: string) => String(fields.get(name) ?? "").trim();
    const body: CreateFiscalizacaoDTO = {
      projetoObraId: Number(workId),
      etapaCronogramaId: Number(value("etapa")),
      usuarioId: id,
      dataVistoria: value("data"),
      percentualExecutado: value("percentual"),
      parecerTecnico: value("parecer"),
      statusVistoria: value("status"),
    };
    setSaving(true);
    setError("");
    try {
      const saved = await request<FiscalizacaoResponseDTO>("fiscalizacoes", token, { method: "POST", body: JSON.stringify(body) });
      setData((current) => current && { ...current, visits: [saved, ...current.visits] });
      setCreating(false);
      setNotice("Vistoria registrada com sucesso.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível registrar a vistoria.");
    } finally {
      setSaving(false);
    }
  }

  const stageName = (stageId: number) => data?.stages.find((stage) => stage.id === stageId)?.nomeEtapa ?? `Etapa #${stageId}`;
  return (
    <section className="mt-6" aria-labelledby="inspection-heading">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="inspection-heading" className="text-xl font-bold">Vistorias</h2>
        {canCreate && <AdminAction variant="primary" disabled={!data?.stages.length || creating}
          onClick={() => { setNotice(""); setError(""); setSelected(null); setCreating(true); }}>Registrar vistoria</AdminAction>}
      </header>
      {loadError ? <p role="alert">{loadError}</p> : !data && <p role="status">Carregando vistorias...</p>}
      {notice && <p role="status" className="mb-4 text-green-800">{notice}</p>}
      {data && !data.stages.length && canCreate && <p className="mb-4 text-sm">Cadastre uma etapa no cronograma para registrar uma vistoria.</p>}
      {data && (data.visits.length ? (
        <AdminTable data={[...data.visits].sort((a, b) => b.dataVistoria.localeCompare(a.dataVistoria) || b.id - a.id)}
          keyExtractor={(item) => item.id} columns={[
            { key: "dataVistoria", header: "Data", render: (item) => date(item.dataVistoria) },
            { key: "etapa", header: "Etapa", render: (item) => stageName(item.etapaCronogramaId) },
            { key: "percentual", header: "Execução observada", render: (item) => `${item.percentualExecutado}%` },
            { key: "statusVistoria", header: "Status", render: (item) => inspectionStatus(item.statusVistoria) },
            { key: "details", header: "Ações", align: "center", render: (item) => (
              <TableAction action="details" name={stageName(item.etapaCronogramaId)} onClick={() => setSelected(item)} />
            ) },
          ]} />
      ) : <p className="rounded-lg bg-white p-6">Nenhuma vistoria registrada para esta obra.</p>)}
      {selected && (
        <section className="mt-5 rounded-lg bg-white p-5" aria-labelledby="inspection-detail">
          <h3 id="inspection-detail" className="font-bold">Parecer técnico · {stageName(selected.etapaCronogramaId)}</h3>
          <p className="mt-1 text-sm">{date(selected.dataVistoria)} · {selected.percentualExecutado}% executado · {inspectionStatus(selected.statusVistoria)}</p>
          <p className="my-4 whitespace-pre-wrap break-words">{selected.parecerTecnico}</p>
          <p className="mb-4 text-sm text-gray-600">Vistoria registrada pelo usuário #{selected.usuarioId}</p>
          <InspectionAttachments key={selected.id} inspection={selected} session={session} />
          <AdminAction onClick={() => setSelected(null)}>Fechar detalhes</AdminAction>
        </section>
      )}
      {creating && data && (
        <form onSubmit={submit} className="mt-6 rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-5 text-lg font-bold">Registrar vistoria</h3>
          <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
            <label>Etapa<select className={field} name="etapa" required defaultValue="">
              <option value="">Selecione uma etapa</option>
              {[...data.stages].sort((a, b) => a.ordemEtapa - b.ordemEtapa).map((item) => (
                <option key={item.id} value={item.id}>{item.ordemEtapa}. {item.nomeEtapa}</option>
              ))}
            </select></label>
            <label>Data da vistoria<input className={field} name="data" type="date" required /></label>
            <label>Execução observada da etapa (%)<input className={field} name="percentual" type="number" min={0} max={100} step="0.01" required /></label>
            <label>Status da vistoria
              <select className={field} name="status" required defaultValue="REGISTRADA">
                <option value="REGISTRADA">Registrada</option>
                <option value="PENDENTE_REVISAO">Aguardando revisão</option>
              </select>
            </label>
            <label className="sm:col-span-2">Parecer técnico<textarea className={field} name="parecer" rows={4} required /></label>
          </fieldset>
          {error && <p role="alert" className="mt-4 text-red-800">{error}</p>}
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <AdminAction disabled={saving} onClick={() => setCreating(false)}>Cancelar</AdminAction>
            <AdminAction variant="primary" type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar vistoria"}</AdminAction>
          </div>
        </form>
      )}
    </section>
  );
}

function InspectionAttachments({ inspection, session }: { inspection: FiscalizacaoResponseDTO; session: Session }) {
  const { token, role, id } = session;
  const inspectionId = inspection.id;
  const [evidence, setEvidence] = useState<EvidenciaFiscalizacaoResponseDTO[]>();
  const [reviews, setReviews] = useState<RevisaoFiscalizacaoResponseDTO[]>();
  const [loadError, setLoadError] = useState("");
  const [action, setAction] = useState<"upload" | "review" | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [assignments, setAssignments] = useState<string[]>([]);
  const [preview, setPreview] = useState<{ blob: Blob; label: string } | null>(null);
  const [removingEvidence, setRemovingEvidence] = useState<EvidenciaFiscalizacaoResponseDTO | null>(null);
  const canUpload = role === "ADMIN" || (role === "FISCAL" && assignments.length > 0);
  const canCheckReview = role === "FISCAL" && id > 0 && id !== inspection.usuarioId;
  const canReview = canCheckReview && assignments.includes("EXTERNO");

  useEffect(() => {
    if (role !== "FISCAL" || id <= 0) return;
    const controller = new AbortController();
    const filter = {
      projetoObraId: String(inspection.projetoObraId),
      usuarioId: String(id),
    };
    listAll<{ tipoFiscal: string }>("obras-fiscais", token, controller.signal, filter)
      .then((result) => { if (!controller.signal.aborted) setAssignments(result.map((item) => item.tipoFiscal)); })
      .catch(() => { if (!controller.signal.aborted) setAssignments([]); });
    return () => controller.abort();
  }, [id, inspection.projetoObraId, role, token]);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    Promise.all([
      listAll<EvidenciaFiscalizacaoResponseDTO>("evidencias-fiscalizacao", token, signal, { fiscalizacaoId: String(inspectionId) }),
      listAll<RevisaoFiscalizacaoResponseDTO>(`fiscalizacoes/${inspectionId}/revisoes`, token, signal),
    ]).then(([files, history]) => {
      if (!signal.aborted) { setEvidence(files); setReviews(history); }
    }).catch((reason: unknown) => {
      if (!signal.aborted) setLoadError(reason instanceof Error ? reason.message : "Falha ao consultar a vistoria.");
    });
    return () => controller.abort();
  }, [inspectionId, token]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !action || (action === "upload" ? !canUpload : !canReview)) return;
    if (action === "upload" && !file) {
      setError("Selecione um arquivo para anexar.");
      return;
    }
    const fields = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      if (action === "upload" && file) {
        fields.set("arquivo", file);
        fields.set("fiscalizacaoId", String(inspectionId));
        const saved = await request<EvidenciaFiscalizacaoResponseDTO>("evidencias-fiscalizacao/upload", token, { method: "POST", body: fields });
        setEvidence((items) => [saved, ...(items ?? [])]);
        setNotice("Evidência anexada.");
      } else {
        const saved = await request<RevisaoFiscalizacaoResponseDTO>("revisoes-fiscalizacao", token, {
          method: "POST",
          body: JSON.stringify({ fiscalizacaoId: inspectionId, fiscalExternoId: id, statusRevisao: fields.get("statusRevisao"), parecer: fields.get("parecer") }),
        });
        setReviews((items) => [saved, ...(items ?? [])]);
        setNotice("Revisão registrada.");
      }
      setAction(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível salvar.");
    } finally {
      setPending(false);
    }
  }

  async function openFile(item: EvidenciaFiscalizacaoResponseDTO, showPreview = false) {
    setPending(true);
    setError("");
    try {
      const name = item.caminhoArquivo.split("/").at(-1) ?? "";
      if (!/^[a-f0-9-]+\.(jpg|png|pdf|mp4|webm)$/i.test(name)) throw new Error("Arquivo indisponível para download.");
      const response = await fetch(`/api/evidencias-fiscalizacao/${inspectionId}/arquivo/${name}`, {
        headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
      });
      if (!response.ok) throw new Error("Não foi possível baixar a evidência.");
      const blob = await response.blob();
      if (showPreview) {
        if (!["image/jpeg", "image/png"].includes(blob.type)) throw new Error("Imagem indisponível para visualização.");
        setPreview({ blob, label: item.tipoEvidencia });
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Falha ao baixar a evidência.");
    } finally {
      setPending(false);
    }
  }

  async function toggleEvidencePublication(item: EvidenciaFiscalizacaoResponseDTO) {
    if (role !== "ADMIN" || pending) return;
    setPending(true);
    setError("");
    try {
      const saved = await request<{ publicado: boolean }>(`evidencias-fiscalizacao/${item.id}/publicacao`, token, {
        method: "PUT", body: JSON.stringify({ publicado: !item.publicado }),
        headers: { "Content-Type": "application/json" },
      });
      setEvidence((items) => items?.map((entry) => entry.id === item.id ? { ...entry, ...saved } : entry));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível alterar a publicação.");
    } finally {
      setPending(false);
    }
  }

  async function removeEvidence() {
    if (role !== "ADMIN" || !removingEvidence || pending) return;
    const item = removingEvidence;
    setPending(true);
    setError("");
    try {
      await request(`evidencias-fiscalizacao/${item.id}`, token, { method: "DELETE" });
      setEvidence((items) => items?.filter((entry) => entry.id !== item.id));
      setRemovingEvidence(null);
      setNotice("Evidência removida.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível remover a evidência.");
      // A API pode remover o registro antes de falhar na limpeza do arquivo.
      const signal = AbortSignal.timeout(5000);
      const refreshed = await listAll<EvidenciaFiscalizacaoResponseDTO>(
        "evidencias-fiscalizacao", token, signal, { fiscalizacaoId: String(inspectionId) },
      ).catch(() => null);
      if (refreshed) {
        setEvidence(refreshed);
        if (!refreshed.some((entry) => entry.id === item.id)) setRemovingEvidence(null);
      }
    } finally {
      setPending(false);
    }
  }

  function openAction(next: "upload" | "review") {
    setError("");
    setNotice("");
    setFile(null);
    setAction(next);
  }

  return (
    <div className="mb-5 space-y-4 border-y border-gray-200 py-4">
      {loadError && <p role="alert" className="text-red-800">{loadError}</p>}
      {notice && <p role="status" className="text-green-800">{notice}</p>}
      <section aria-label="Evidências da vistoria">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="font-bold">Evidências</h4>
          {canUpload && <AdminAction disabled={pending || !evidence || !!action || !!removingEvidence} onClick={() => openAction("upload")}>Anexar evidência</AdminAction>}
        </div>
        {!evidence && !loadError && <p role="status">Carregando evidências...</p>}
        {evidence?.length === 0 && <p>Nenhuma evidência anexada.</p>}
        <ul className="mt-2 divide-y divide-gray-200">
          {evidence?.map((item) => {
            const { extension, icon: Icon, color, image } = evidenceFormat(item.caminhoArquivo);
            return <li key={item.id} className="flex flex-wrap items-center gap-2 py-2">
              <button type="button" disabled={pending || !!action || !!removingEvidence}
                onClick={() => { void openFile(item, image); }}
                aria-label={`${image ? "Visualizar" : "Baixar"} ${item.tipoEvidencia} (${extension.toUpperCase()})`}
                className={`flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition hover:brightness-95 disabled:cursor-wait disabled:opacity-50 ${color}`}>
                <span className="flex shrink-0 items-center gap-1.5 rounded-md bg-white/70 px-2 py-1 text-xs font-bold uppercase">
                  <Icon size={16} aria-hidden="true" />{extension}
                </span>
                <span className="min-w-0"><span className="block break-words font-semibold">{item.tipoEvidencia}</span>
                  <span className="block text-xs">{date(item.dataRegistro)} · {item.latitude}, {item.longitude}</span></span>
              </button>
              {image && <AdminAction disabled={pending || !!action || !!removingEvidence} onClick={() => { void openFile(item); }}>Baixar arquivo</AdminAction>}
              {image && role === "ADMIN" && <AdminAction disabled={pending || !!action || !!removingEvidence} onClick={() => { void toggleEvidencePublication(item); }}>
                {item.publicado ? "Retirar da galeria" : "Publicar na galeria"}
              </AdminAction>}
              {role === "ADMIN" && !pending && !action && !removingEvidence && (
                <TableAction action="delete" name={item.tipoEvidencia} onClick={() => {
                  setError("");
                  setNotice("");
                  setRemovingEvidence(item);
                }} />
              )}
            </li>;
          })}
        </ul>
        {removingEvidence && (
          <section aria-labelledby="remove-evidence-title" className="mt-3 rounded-lg border border-red-200 p-4">
            <h5 id="remove-evidence-title" className="font-bold">Remover evidência?</h5>
            <p className="mt-1">O registro e o arquivo de <strong>{removingEvidence.tipoEvidencia}</strong> serão excluídos.</p>
            <div className="mt-4 flex flex-wrap justify-end gap-3">
              <AdminAction disabled={pending} onClick={() => { setRemovingEvidence(null); setError(""); }}>Cancelar</AdminAction>
              <button type="button" disabled={pending} onClick={removeEvidence}
                className="min-h-10 cursor-pointer rounded-lg bg-red-700 px-4 py-2 font-semibold text-white hover:bg-red-800 disabled:cursor-wait disabled:opacity-50">
                {pending ? "Removendo..." : "Remover evidência"}
              </button>
            </div>
          </section>
        )}
      </section>
      {preview && <EvidencePreview blob={preview.blob} label={preview.label} onClose={() => setPreview(null)} />}
      <section aria-label="Revisões da vistoria">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="font-bold">Revisões</h4>
          {canReview && <AdminAction disabled={pending || !reviews || !!action || !!removingEvidence} onClick={() => openAction("review")}>Registrar revisão</AdminAction>}
        </div>
        {!reviews && !loadError && <p role="status">Carregando revisões...</p>}
        {reviews?.length === 0 && <p>Nenhuma revisão registrada.</p>}
        <ul className="mt-2 divide-y divide-gray-200">
          {reviews?.map((item) => <li key={item.id} className="py-2">
            <p className="font-semibold">{item.statusRevisao.replaceAll("_", " ")} · Fiscal #{item.fiscalExternoId} · {date(item.dataRevisao)}</p>
            <p className="whitespace-pre-wrap break-words">{item.parecer}</p>
          </li>)}
        </ul>
      </section>
      {error && <p role="alert" className="text-red-800">{error}</p>}
      {action && (
        <form onSubmit={submit} className="rounded-lg bg-gray-50 p-4">
          <fieldset disabled={pending} className="grid gap-3 sm:grid-cols-2">
            <legend className="mb-3 font-semibold">{action === "upload" ? "Anexar evidência" : "Registrar revisão"}</legend>
            {action === "upload" ? <>
              <label>Tipo de evidência
                <select className={field} name="tipoEvidencia" required defaultValue="">
                  <option value="" disabled>Selecione uma categoria</option>
                  {evidenceCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>
              <div className="sm:col-span-2">
                <ImageUpload label="Arquivo da evidência" value={file} onChange={setFile} disabled={pending}
                  accept=".jpg,.jpeg,.png,.pdf,.mp4,.webm" maxBytes={10 * 1024 * 1024}
                  hint="JPG, PNG, PDF, MP4 ou WebM · até 10 MB" />
              </div>
              <label>Latitude<input className={field} name="latitude" type="number" min="-90" max="90" step="any" required /></label>
              <label>Longitude<input className={field} name="longitude" type="number" min="-180" max="180" step="any" required /></label>
            </> : <>
              <label>Decisão<select className={field} name="statusRevisao" required defaultValue="">
                <option value="">Selecione a decisão</option>
                <option value="APROVADA">Aprovar</option>
                <option value="CONTESTADA">Contestar</option>
                <option value="CORRECAO_SOLICITADA">Solicitar correção</option>
              </select></label>
              <label>Parecer<textarea className={field} name="parecer" rows={3} required /></label>
            </>}
          </fieldset>
          <div className="mt-4 flex flex-wrap justify-end gap-3">
            <AdminAction disabled={pending} onClick={() => { setAction(null); setError(""); }}>Cancelar</AdminAction>
            <AdminAction type="submit" variant="primary" disabled={pending}>{pending ? "Salvando..." : "Salvar"}</AdminAction>
          </div>
        </form>
      )}
    </div>
  );
}

function EvidencePreview({ blob, label, onClose }: { blob: Blob; label: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [url, setUrl] = useState("");
  useEffect(() => {
    const objectUrl = URL.createObjectURL(blob);
    const frame = window.requestAnimationFrame(() => setUrl(objectUrl));
    if (!dialog.current?.open) dialog.current?.showModal();
    return () => {
      window.cancelAnimationFrame(frame);
      URL.revokeObjectURL(objectUrl);
    };
  }, [blob]);

  return (
    <dialog ref={dialog} onClose={onClose} aria-labelledby="evidence-preview-title"
      className="m-auto w-[calc(100%-2rem)] max-w-4xl rounded-xl bg-white p-4 shadow-xl backdrop:bg-black/65">
      <h4 id="evidence-preview-title" className="mb-4 text-lg font-bold">{label}</h4>
      {url && <Image src={url} alt={`Evidência: ${label}`} width={960} height={720} unoptimized
        className="max-h-[72dvh] w-full rounded-lg object-contain" />}
      <form method="dialog" className="mt-4 flex justify-end"><AdminAction type="submit">Fechar</AdminAction></form>
    </dialog>
  );
}

function StageList({ workId, token, canEdit, canDelete }: { workId: string; token: string; canEdit: boolean; canDelete: boolean }) {
  const [stages, setStages] = useState<Stage[]>();
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Stage | "new" | null>(null);
  const [notice, setNotice] = useState("");
  const [removing, setRemoving] = useState<Stage | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    listAll<Stage>("etapas-cronograma", token, controller.signal, { projetoObraId: workId })
      .then((items) => { if (!controller.signal.aborted) setStages(items); })
      .catch((reason: Error) => { if (!controller.signal.aborted) setError(reason.message); });
    return () => controller.abort();
  }, [token, workId]);

  const weight = (stages ?? []).reduce((sum, item) => sum + Math.round(Number(item.percentualPrevisto) * 100), 0) / 10000;
  const progress = (stages ?? []).reduce((sum, item) =>
    sum + Number(item.percentualPrevisto) * Number(item.percentualExecutado) / 10000, 0);

  async function deleteStage() {
    if (!canDelete || !removing || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await request(`etapas-cronograma/${removing.id}`, token, { method: "DELETE" });
      setStages((items) => items?.filter((item) => item.id !== removing.id));
      setRemoving(null);
      setNotice("Etapa excluída com sucesso.");
    } catch (reason) {
      setDeleteError(reason instanceof Error ? reason.message : "Não foi possível excluir a etapa.");
    } finally {
      setDeleting(false);
    }
  }
  return (
    <section className="mt-6" aria-labelledby="stage-heading">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="stage-heading" className="text-xl font-bold">Etapas</h2>
        {canEdit && <AdminAction variant="primary" disabled={!stages || editing !== null || removing !== null}
          onClick={() => { setNotice(""); setEditing("new"); }}>Adicionar etapa</AdminAction>}
      </header>
      {error ? <p role="alert">{error}</p> : !stages && <p role="status">Carregando etapas...</p>}
      {notice && <p role="status" className="mb-4 text-green-800">{notice}</p>}
      {stages && (
        <div className="mb-5 rounded-lg bg-white p-4">
          <dl className="grid gap-3 sm:grid-cols-3">
            <div><dt>Peso distribuído</dt><dd className="font-semibold">{percent.format(weight)}</dd></div>
            <div><dt>Peso a distribuir</dt><dd className="font-semibold">{percent.format(Math.max(0, 1 - weight))}</dd></div>
            <div><dt>Avanço geral da obra</dt><dd className="font-semibold">{percent.format(progress)}</dd></div>
          </dl>
          {weight > 1 && <p role="alert" className="mt-3 text-red-800">O cronograma excede 100%. Reduza os pesos em {percent.format(weight - 1)} do total da obra.</p>}
        </div>
      )}
      {stages && (stages.length ? <AdminTable data={[...stages].sort((a, b) => a.ordemEtapa - b.ordemEtapa || a.id - b.id)}
        keyExtractor={(item) => item.id} columns={[
          { key: "ordemEtapa", header: "Ordem" },
          { key: "nomeEtapa", header: "Etapa" },
          { key: "period", header: "Período previsto", render: (item) => `${date(item.dataInicioPrevista)} a ${date(item.dataFimPrevista)}` },
          { key: "actual", header: "Datas reais", render: (item) => `${item.dataInicioReal ? date(item.dataInicioReal) : "—"} a ${item.dataFimReal ? date(item.dataFimReal) : "—"}` },
          { key: "weight", header: "Peso na obra", render: (item) => `${item.percentualPrevisto}%` },
          { key: "progress", header: "Execução da etapa", render: (item) => `${item.percentualExecutado}%` },
          { key: "status", header: "Status", render: (item) =>
            stageStatuses.find(([value]) => value === item.status)?.[1] ?? item.status },
          ...(canEdit ? [{
            key: "actions", header: "Ações", align: "center" as const,
            render: (item: Stage) => editing === null && removing === null && (
              <div className="flex justify-center gap-2">
                <TableAction action="edit" name={item.nomeEtapa} onClick={() => { setNotice(""); setEditing(item); }} />
                {canDelete && <TableAction action="delete" name={item.nomeEtapa} onClick={() => {
                  setNotice("");
                  setDeleteError("");
                  setRemoving(item);
                }} />}
              </div>
            ),
          }] : []),
        ]} /> : <p className="rounded-lg bg-white p-6">Nenhuma etapa cadastrada para esta obra.</p>)}
      {removing && (
        <section aria-labelledby="delete-stage-title" className="mt-5 rounded-lg border border-red-200 bg-white p-5">
          <h3 id="delete-stage-title" className="font-bold">Excluir etapa?</h3>
          <p className="mt-2">Confirme a exclusão de <strong>{removing.nomeEtapa}</strong>.</p>
          {deleteError && <p role="alert" className="mt-3 text-red-800">{deleteError}</p>}
          <div className="mt-4 flex justify-end gap-3">
            <AdminAction disabled={deleting} onClick={() => setRemoving(null)}>Cancelar</AdminAction>
            <button type="button" disabled={deleting} onClick={deleteStage}
              className="cursor-pointer rounded-lg bg-red-700 px-4 py-2 font-semibold text-white hover:bg-red-800 disabled:cursor-wait disabled:opacity-50">
              {deleting ? "Excluindo..." : "Excluir etapa"}
            </button>
          </div>
        </section>
      )}
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
        <label>Status
          <select className={field} name="status" required defaultValue={stage?.status ?? "PLANEJADA"}>
            {stage && !stageStatuses.some(([value]) => value === stage.status) && (
              <option value={stage.status}>{stage.status} (status atual)</option>
            )}
            {stageStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
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
