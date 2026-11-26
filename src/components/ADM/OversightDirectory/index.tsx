import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ScrollText, ShieldCheck, X } from "lucide-react";
import { canWriteOversight, oversightRecords, oversightRequest, type OversightResource, type StaffRole } from "./crud";
import AdminAction from "@/components/ADM/AdminAction";
import AdminTable from "@/components/ADM/AdminTable";
import TableAction from "@/components/ADM/TableAction";
import Pagination from "@/components/Pagination";
import type { PaginatedResult } from "@/lib/pagination";
import type { AlertaFiscalizacaoResponseDTO } from "@/types/alerta-fiscalizacao";
import type { BloqueioRepasseResponseDTO } from "@/types/bloqueio-repasse";
import type { ProcessoRegularizacaoResponseDTO } from "@/types/processo-regularizacao";
import { logAuditoriaCategorias, type LogAuditoriaResponseDTO } from "@/types/log-auditoria";

export type OversightArea = "alerts" | "regularization" | "audit";
type Resource = OversightResource | "logs-auditoria";
type Entry = AlertaFiscalizacaoResponseDTO | BloqueioRepasseResponseDTO | ProcessoRegularizacaoResponseDTO | LogAuditoriaResponseDTO;
type Row = { id: number; title: string; date: string; summary: string; details: [string, string][]; text: string; user?: string; work?: string };
const pages = {
  alerts: { title: "Alertas e bloqueios", icon: AlertTriangle },
  regularization: { title: "Regularização", icon: ShieldCheck },
  audit: { title: "Auditoria", icon: ScrollText },
};
const labels = { login: "Login", obras: "Obras", financeiro: "Financeiro", fiscalizacao: "Fiscalização" };
const field = "mt-1 block w-full rounded-lg border border-gray-400 bg-white px-3 py-2";
const date = (value?: string | null) => value ? value.slice(0, 10).split("-").reverse().join("/") : "—";
const entities: Record<string, string> = {
  projeto_obra: "Obra pública", etapa_cronograma: "Etapa do cronograma", projeto_verba: "Alocação de verba",
  usuario: "Usuário", orgao_publico: "Órgão público", empresa: "Empresa", verba_publica: "Verba pública",
  emenda_parlamentar: "Emenda parlamentar", contrato: "Contrato", conta_bancaria: "Conta bancária",
  liberacao_recurso: "Liberação de recursos", pagamento: "Pagamento", decisao_financeira: "Decisão financeira",
  bloqueio_repasse: "Bloqueio de repasse", obra_fiscal: "Designação de fiscal", fiscalizacao: "Vistoria",
  revisao_fiscalizacao: "Revisão de vistoria", evidencia_fiscalizacao: "Evidência",
  alerta_fiscalizacao: "Alerta de fiscalização", processo_regularizacao: "Processo de regularização",
  endereco: "Endereço",
};
const actionVerbs: Record<string, string> = {
  CRIAR: "Cadastrar", ATUALIZAR: "Alterar", EXCLUIR: "Excluir", APROVAR: "Aprovar",
  REJEITAR: "Rejeitar", PUBLICAR: "Publicar", UPLOAD: "Anexar",
};
const detailLabels: Record<string, string> = {
  status: "Resultado", rota: "Rota da operação", motivo: "Motivo", role: "Perfil",
  justificativa: "Justificativa", tipoEvidencia: "Tipo de evidência", tamanhoArquivo: "Tamanho do arquivo (bytes)",
  fiscalizacaoId: "ID da vistoria", statusRevisao: "Decisão da revisão",
};
const detailValues: Record<string, string> = {
  success: "Sucesso", failure: "Falha", credenciais_invalidas: "Credenciais inválidas",
  ADMIN: "Administrador", GESTOR: "Gestor", FISCAL: "Fiscal", USER: "Usuário",
};
function humanize(value: string) {
  const text = value.replaceAll("_", " ").toLocaleLowerCase("pt-BR");
  return text.charAt(0).toLocaleUpperCase("pt-BR") + text.slice(1);
}

function auditLabel(labels: Record<string, string>, key: string) {
  return Object.hasOwn(labels, key) ? labels[key] : undefined;
}

function parseAuditDetails(text: string): { fields: [string, string][]; text: string } {
  try {
    const parsed: unknown = JSON.parse(text);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const fields: [string, string][] = Object.entries(parsed)
        .filter(([key, value]) => key !== "obraNome" && (key !== "tipo" || value !== "operation_completed") && value != null)
        .map(([key, value]) => [
          auditLabel(detailLabels, key) ?? humanize(key.replace(/([a-z])([A-Z])/g, "$1 $2")),
          typeof value === "string" ? auditLabel(detailValues, value) ?? value : JSON.stringify(value),
        ]);
      return { fields, text: "" };
    }
  } catch {
    return { fields: [], text };
  }
  return { fields: [], text };
}

function toRow(item: Entry): Row {
  if ("tipoAlerta" in item) {
    return { id: item.id, title: item.tipoAlerta, date: date(item.dataGeracao), summary: item.statusAlerta,
      details: [["Obra", `#${item.projetoObraId}`], ["Vistoria", `#${item.fiscalizacaoId}`], ["Severidade", item.severidade], ["Publicação", item.publicado ? "Publicado" : "Não publicado"]],
      text: item.descricao };
  }
  if ("motivoBloqueio" in item) {
    return { id: item.id, title: `Bloqueio #${item.id}`, date: date(item.dataBloqueio), summary: item.statusBloqueio,
      details: [["Obra", `#${item.projetoObraId}`], ["Alerta associado", `#${item.alertaFiscalizacaoId}`], ["Desbloqueio", date(item.dataDesbloqueio)]],
      text: item.motivoBloqueio };
  }
  if ("descricaoJustificativa" in item) {
    return { id: item.id, title: `Processo #${item.id}`, date: date(item.dataEnvio), summary: item.statusProcesso,
      details: [["Bloqueio associado", `#${item.bloqueioRepasseId}`], ["Enviado por", `Usuário #${item.usuarioId}`]],
      text: item.descricaoJustificativa };
  }
  const timestamp = new Date(item.dataHora);
  const entity = auditLabel(entities, item.tabelaAfetada) ?? humanize(item.tabelaAfetada);
  const verb = auditLabel(actionVerbs, item.acao.split("_")[0]);
  const title = item.acao === "LOGIN" ? "Login realizado" : item.acao === "LOGIN_FALHOU" ? "Tentativa de login malsucedida"
    : verb ? `${verb} ${entity.toLocaleLowerCase("pt-BR")}` : humanize(item.acao);
  const user = item.usuarioNome?.trim() || (item.usuarioId === null ? "Não identificado" : `Usuário #${item.usuarioId}`);
  const details = parseAuditDetails(item.detalhes);
  const work = item.obraNome ?? (item.obraNome === null ? "Nome indisponível" : "—");
  return { id: item.id, title, user, work,
    date: Number.isNaN(timestamp.getTime()) ? "—" : timestamp.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
    summary: entity,
    details: [["Registro afetado", item.registroId > 0 ? `#${item.registroId}` : "Não identificado"], ["Usuário", user], ["IP de origem", item.ipOrigem], ...details.fields],
    text: details.text };
}

export default function OversightDirectory({ area, token, role, showBlocks = false }: { area: OversightArea; token: string; role: StaffRole; showBlocks?: boolean }) {
  const blocks = showBlocks;
  const { title, icon: Icon } = pages[area];
  const resource: Resource = area === "audit" ? "logs-auditoria" : area === "regularization" ? "processos-regularizacao"
    : blocks ? "bloqueios-repasse" : "alertas-fiscalizacao";
  return (
    <div className="mx-auto max-w-[1500px]">
      <h1 className="mb-6 flex items-center gap-3 text-3xl font-bold"><Icon aria-hidden="true" />{title}</h1>
      {area === "alerts" && (
        <nav aria-label="Tipo de registro" className="mb-5 flex flex-wrap gap-2">
          <AdminAction href={oversightRecords["alertas-fiscalizacao"].base} variant={blocks ? "secondary" : "primary"}>Alertas</AdminAction>
          <AdminAction href={oversightRecords["bloqueios-repasse"].base} variant={blocks ? "primary" : "secondary"}>Bloqueios de repasse</AdminAction>
        </nav>
      )}
      <OversightList key={resource} resource={resource} token={token} role={role} />
    </div>
  );
}

function OversightList({ resource, token, role }: { resource: Resource; token: string; role: StaffRole }) {
  const [filter, setFilter] = useState("");
  const [order, setOrder] = useState("recente");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{ url: string; data?: PaginatedResult<Entry>; error?: string }>();
  const [selected, setSelected] = useState<Row>();
  const [pendingDelete, setPendingDelete] = useState<Row>();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [revision, setRevision] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const deleteDialog = useRef<HTMLDialogElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const audit = resource === "logs-auditoria";
  const config = !audit && canWriteOversight(resource, role) ? oversightRecords[resource] : undefined;
  const summaryLabel = audit ? "Área afetada" : "Status";
  const query = new URLSearchParams({ page: String(page), pageSize: "10" });
  if (audit) query.set("ordem", order);
  if (filter.trim()) query.set(audit ? "categoria" : "status", filter.trim());
  const url = `/api/${resource}?${query}`;
  const current = result?.url === url ? result : undefined;

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(url, { signal, cache: "no-store", headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error(response.status === 401 ? "Sua sessão expirou. Entre novamente." : response.status === 403 ? "Você não tem acesso a esses registros." : "Não foi possível carregar os registros.");
        const data: PaginatedResult<Entry> = await response.json();
        if (!signal.aborted) setResult({ url, data });
      } catch (error) {
        if (!signal.aborted) setResult({ url, error: error instanceof Error ? error.message : "Falha na consulta." });
      }
    }, 200);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [url, token, revision]);

  async function remove() {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await oversightRequest(`${resource}/${pendingDelete.id}`, token, { method: "DELETE" });
      deleteDialog.current?.close();
      if (current?.data?.data.length === 1 && page > 1) setPage(page - 1);
      setRevision((value) => value + 1);
    } catch (reason) {
      setDeleteError(reason instanceof Error ? reason.message : "Não foi possível excluir o registro.");
    } finally {
      setDeleting(false);
    }
  }

  function changeFilter(value: string) {
    setFilter(value);
    setPage(1);
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end gap-4">
        {audit ? <><label className="w-full max-w-xs">Categoria
          <select className={field} value={filter} onChange={(event) => changeFilter(event.target.value)}>
            <option value="">Tudo</option>
            {logAuditoriaCategorias.map((category) => <option key={category} value={category}>{labels[category]}</option>)}
          </select>
        </label>
        <label className="w-full max-w-xs">Ordenar por
          <select className={field} value={order} onChange={(event) => {
            setOrder(event.target.value);
            setPage(1);
          }}>
            <option value="recente">Mais recente</option>
            <option value="antiga">Mais antiga</option>
          </select>
        </label></> : <label className="w-full max-w-xs">Filtrar por status
          <span className="relative block">
            <input ref={search} className={`${field} pr-10`} placeholder="Digite o status exato" value={filter} onChange={(event) => changeFilter(event.target.value)} />
            {filter && <button type="button" aria-label="Limpar filtro por status" className="absolute inset-y-0 right-0 grid w-10 cursor-pointer place-items-center rounded-r-lg text-blue-700 hover:text-blue-900" onClick={() => {
              changeFilter("");
              search.current?.focus();
            }}><X size={16} aria-hidden="true" /></button>}
          </span>
        </label>}
        {config && <AdminAction className="sm:ml-auto" variant="primary" href={`${config.base}/adicionar`}>Adicionar {config.name}</AdminAction>}
      </div>
      {!current && <p role="status">Carregando registros...</p>}
      {current?.error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">{current.error}</p>}
      {current?.data && (
        <>
          <p className="mb-3 text-sm">Total de registros: {current.data.pagination.total}</p>
          {current.data.data.length ? <AdminTable data={current.data.data.map(toRow)} keyExtractor={(row) => row.id} columns={[
            { key: "title", header: audit ? "Ação" : "Registro" },
            { key: "date", header: audit ? "Data e hora" : "Data" },
            { key: "summary", header: summaryLabel },
            ...(audit ? [{ key: "work", header: "Obra afetada" }] : []),
            ...(audit ? [{ key: "user", header: "Usuário" }] : []),
            { key: "actions", header: "Ações", align: "center", render: (row) => (
              <div className="flex justify-center gap-1"><TableAction action="details" name={row.title} onClick={() => {
                setSelected(row);
                dialog.current?.showModal();
              }} />
              {config && <TableAction action="edit" name={row.title} href={`${config.base}/${row.id}/alterar`} />}
              {config && role === "ADMIN" && <TableAction action="delete" name={row.title} onClick={() => {
                setPendingDelete(row);
                setDeleteError("");
                deleteDialog.current?.showModal();
              }} />}</div>
            ) },
          ]} /> : <p className="rounded-lg bg-white p-6">Nenhum registro encontrado.</p>}
          <Pagination currentPage={page} totalPages={current.data.pagination.totalPages} onPageChange={setPage} />
        </>
      )}
      <dialog ref={dialog} onClose={() => setSelected(undefined)} aria-labelledby="oversight-details-title"
        className="m-auto w-[calc(100%-2rem)] max-w-xl rounded-xl p-6 shadow-xl backdrop:bg-black/55">
        <h2 id="oversight-details-title" className="text-xl font-bold">{selected?.title}</h2>
        {selected && <>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            {[[audit ? "Data e hora" : "Data", selected.date], [summaryLabel, selected.summary], ...(audit ? [["Obra afetada", selected.work]] : []), ...selected.details].map(([label, value]) => (
              <div key={label}><dt className="text-sm text-gray-600">{label}</dt><dd className="break-words">{value}</dd></div>
            ))}
          </dl>
          {(selected.text || !audit) && <p className="mt-4 whitespace-pre-wrap break-words">{selected.text || "Sem detalhes adicionais."}</p>}
        </>}
        <form method="dialog" className="mt-6 flex justify-end"><AdminAction type="submit">Fechar</AdminAction></form>
      </dialog>
      <dialog ref={deleteDialog} aria-labelledby="oversight-delete-title"
        onCancel={(event) => { if (deleting) event.preventDefault(); }}
        onClose={() => setPendingDelete(undefined)}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl p-6 shadow-xl backdrop:bg-black/55">
        <h2 id="oversight-delete-title" className="text-xl font-bold">Excluir {config?.name}?</h2>
        <p className="mt-3 break-words">{pendingDelete?.title}</p>
        {deleteError && <p role="alert" className="mt-3 text-red-800">{deleteError}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <AdminAction disabled={deleting} onClick={() => deleteDialog.current?.close()}>Cancelar</AdminAction>
          <AdminAction variant="primary" disabled={deleting} onClick={remove}>{deleting ? "Excluindo..." : "Excluir"}</AdminAction>
        </div>
      </dialog>
    </>
  );
}
