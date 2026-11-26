import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import AdminAction from "@/components/ADM/AdminAction";
import { loadOversightOptions, oversightRecords, oversightRequest, type OversightFormRoute, type StaffRole } from "./crud";

type Work = { id: number; nome: string };
type Reference = { id: number; projetoObraId: number; dataVistoria?: string; tipoAlerta?: string; statusBloqueio?: string };
type RecordData = Record<string, string | number | boolean | null>;
type Props = OversightFormRoute & { token: string; userId: number; role: StaffRole };
const field = "mt-1 block w-full rounded-lg border border-gray-400 bg-white px-3 py-2";
const alertTypes = ["Atraso na execução", "Irregularidade técnica", "Divergência financeira", "Falta de documentação", "Risco à segurança", "Outro"];
const severities = ["Baixa", "Média", "Alta", "Crítica"];
const statuses = {
  "alertas-fiscalizacao": ["Aberto", "Em análise", "Resolvido", "Arquivado"],
  "bloqueios-repasse": ["Ativo", "Desbloqueado"],
  "processos-regularizacao": ["Pendente", "Em análise", "Aprovado", "Rejeitado"],
};

function SelectField({ label, name, value, options }: {
  label: string;
  name: string;
  value: string;
  options: readonly string[];
}) {
  return (
    <label>{label}
      <select className={field} name={name} defaultValue={value} required>
        <option value="" disabled>Selecione</option>
        {value && !options.includes(value) && <option value={value}>{value} (valor atual)</option>}
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

export default function OversightForm({ resource, id, token, userId, role }: Props) {
  const router = useRouter();
  const config = oversightRecords[resource];
  const editing = id !== undefined;
  const alert = resource === "alertas-fiscalizacao";
  const block = resource === "bloqueios-repasse";
  const regularization = resource === "processos-regularizacao";
  const referenceResource = alert ? "fiscalizacoes" : block ? "alertas-fiscalizacao" : "bloqueios-repasse";
  const referenceField = alert ? "fiscalizacaoId" : block ? "alertaFiscalizacaoId" : "bloqueioRepasseId";
  const listHref = config.base;
  const [loaded, setLoaded] = useState<{ works: Work[]; references: Reference[]; record: RecordData }>();
  const [workId, setWorkId] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    Promise.all([
      loadOversightOptions<Work>("projetos", token, signal),
      loadOversightOptions<Reference>(referenceResource, token, signal),
      id === undefined ? Promise.resolve({} as RecordData) : oversightRequest<RecordData>(`${resource}/${id}`, token, { signal }),
    ]).then(([works, references, record]) => {
      if (signal.aborted) return;
      setWorkId(String(record.projetoObraId ?? ""));
      setReferenceId(String(record[referenceField] ?? ""));
      setLoaded({ works, references, record });
    }).catch((reason: Error) => {
      if (!signal.aborted) setError(reason.message);
    });
    return () => controller.abort();
  }, [id, referenceField, referenceResource, resource, token]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const fields = new FormData(event.currentTarget);
    const value = (name: string) => String(fields.get(name) ?? "").trim();
    const payload: RecordData = {
      [config.status]: value(config.status),
      [config.description]: value(config.description),
      [referenceField]: Number(referenceId),
    };
    if (!regularization) payload.projetoObraId = Number(workId);
    if (regularization && !editing) payload.usuarioId = userId;
    if (alert) {
      payload.tipoAlerta = value("tipoAlerta");
      payload.severidade = value("severidade");
      if (editing && role === "ADMIN") payload.publicado = fields.has("publicado");
    }
    if (block && editing) payload.dataDesbloqueio = value("dataDesbloqueio") || null;
    setError("");
    setSaving(true);
    try {
      await oversightRequest(editing ? `${resource}/${id}` : resource, token, {
        method: editing ? "PUT" : "POST", body: JSON.stringify(payload),
      });
      router.push(listHref);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível salvar.");
      setSaving(false);
    }
  }

  const record = loaded?.record;
  const references = loaded?.references.filter((item) => regularization || String(item.projetoObraId) === workId) ?? [];
  const workNames = new Map(loaded?.works.map((work) => [work.id, work.nome]));
  const textValue = (name: string) => String(record?.[name] ?? "");
  return (
    <section className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">{editing ? "Alterar" : "Adicionar"} {config.name}</h1>
        <Link href={listHref} className="underline">Voltar à lista</Link>
      </header>
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">{error}</p>}
      {!loaded && !error && <p role="status">Carregando formulário...</p>}
      {loaded && <form onSubmit={submit} className="grid gap-5 rounded-xl bg-white p-6 shadow-sm sm:grid-cols-2">
        {!regularization && <label>Obra
          <select className={field} value={workId} required onChange={(event) => { setWorkId(event.target.value); setReferenceId(""); }}>
            <option value="">Selecione a obra</option>
            {loaded.works.map((work) => <option key={work.id} value={work.id}>{work.nome}</option>)}
          </select>
        </label>}
        <label>{alert ? "Vistoria" : block ? "Alerta de fiscalização" : "Bloqueio de repasse"}
          <select className={field} value={referenceId} required onChange={(event) => setReferenceId(event.target.value)}>
            <option value="">{references.length ? "Selecione" : !regularization && !workId ? "Selecione a obra primeiro" : "Nenhum registro disponível"}</option>
            {references.map((item) => <option key={item.id} value={item.id}>
              {alert ? `Vistoria #${item.id} · ${item.dataVistoria?.split("-").reverse().join("/")}` :
                block ? `${item.tipoAlerta} (#${item.id})` : `Bloqueio #${item.id} · ${workNames.get(item.projetoObraId) ?? "Obra vinculada"} · ${item.statusBloqueio}`}
            </option>)}
          </select>
        </label>
        {alert && <>
          <SelectField label="Tipo de alerta" name="tipoAlerta" value={textValue("tipoAlerta")} options={alertTypes} />
          <SelectField label="Severidade" name="severidade" value={textValue("severidade")} options={severities} />
        </>}
        <SelectField label="Status" name={config.status} value={textValue(config.status)} options={statuses[resource]} />
        {block && editing && <label>Data de desbloqueio
          <input type="date" className={field} name="dataDesbloqueio" defaultValue={textValue("dataDesbloqueio").slice(0, 10)} />
        </label>}
        <label className="sm:col-span-2">{config.descriptionLabel}
          <textarea className={field} name={config.description} rows={5} defaultValue={textValue(config.description)} maxLength={65535} required />
        </label>
        {alert && editing && role === "ADMIN" && <label className="flex items-center gap-2">
          <input type="checkbox" name="publicado" defaultChecked={record?.publicado === true} /> Publicar no portal
        </label>}
        <div className="flex justify-end gap-3 sm:col-span-2">
          <AdminAction href={listHref}>Cancelar</AdminAction>
          <AdminAction type="submit" variant="primary" disabled={saving || !referenceId}>{saving ? "Salvando..." : "Salvar"}</AdminAction>
        </div>
      </form>}
    </section>
  );
}
