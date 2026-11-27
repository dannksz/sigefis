import { useToast } from "@/components/Toast/ToastContext";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import AdminAction from "@/components/ADM/AdminAction";
import { formatBrlInput } from "@/lib/input-masks";
import type { ContratoResponseDTO, CreateContratoDTO } from "@/types/contrato";
import type { PaginatedResult } from "@/lib/pagination";
import type { VerbaPublicaResponseDTO } from "@/types/verba-publica";
import type { ProjetoVerbaResponseDTO } from "@/types/projeto-verba";

type NamedRecord = { id: number; nome: string };
type Option = { id: number; label: string };
const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const field = "mt-1 block w-full rounded-lg border border-gray-400 bg-white px-3 py-2";

async function request<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api/${path}`, {
    ...options,
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error ?? "Não foi possível concluir a operação.");
  return body;
}

async function listAll<T>(path: string, token: string, signal: AbortSignal) {
  const items: T[] = [];
  let page = 1;
  let totalPages: number;
  do {
    const separator = path.includes("?") ? "&" : "?";
    const result = await request<PaginatedResult<T>>(`${path}${separator}page=${page}&pageSize=100`, token, { signal });
    items.push(...result.data);
    totalPages = result.pagination.totalPages;
  } while (++page <= totalPages);
  return items;
}

export default function ContractForm({ token, id }: { token: string; id?: number }) {
  const { showToast } = useToast();
  const router = useRouter();
  const [data, setData] = useState<{
    works: NamedRecord[]; companies: NamedRecord[]; funds: VerbaPublicaResponseDTO[]; contract?: ContratoResponseDTO;
  }>();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [fundId, setFundId] = useState("");
  const [workId, setWorkId] = useState("");
  const [amount, setAmount] = useState("");
  const [budget, setBudget] = useState<{ key: string; allocated: number; committed: number; previous: number; globalAvailable: number } | { key: string; error: true }>();
  const budgetKey = `${workId}/${fundId}`;
  const path = id === undefined ? "contratos" : `contratos/${id}`;

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    Promise.all([
      listAll<NamedRecord>("projetos", token, signal),
      listAll<NamedRecord>("empresas", token, signal),
      listAll<VerbaPublicaResponseDTO>("verbas-publicas", token, signal),
      id === undefined ? undefined : request<ContratoResponseDTO>(path, token, { signal }),
    ]).then(([works, companies, funds, contract]) => {
      if (!signal.aborted) {
        setData({ works, companies, funds, contract });
        setFundId(contract?.verbaPublicaId.toString() ?? "");
        setWorkId(contract?.projetoObraId.toString() ?? "");
        setAmount(contract ? formatBrlInput(Number(contract.valorContrato).toFixed(2)) : "");
      }
    }).catch((reason: unknown) => {
      if (!signal.aborted) setError(reason instanceof Error ? reason.message : "Falha ao carregar o formulário.");
    });
    return () => controller.abort();
  }, [id, path, token]);

  useEffect(() => {
    if (!fundId || !workId) return;
    const controller = new AbortController();
    const filter = new URLSearchParams({ verbaPublicaId: fundId });
    Promise.all([
      listAll<ContratoResponseDTO>(`contratos?${filter}`, token, controller.signal),
      listAll<ProjetoVerbaResponseDTO>(`projetos-verbas?${filter}&projetoObraId=${encodeURIComponent(workId)}`, token, controller.signal),
      request<VerbaPublicaResponseDTO>(`verbas-publicas/${encodeURIComponent(fundId)}`, token, { signal: controller.signal }),
    ]).then(([contracts, allocations, fund]) => {
        if (controller.signal.aborted) return;
        const cents = (contract: ContratoResponseDTO) => Math.round(Number(contract.valorContrato) * 100);
        const workContracts = contracts.filter((item) => String(item.projetoObraId) === workId);
        setBudget({
          key: budgetKey,
          allocated: allocations.reduce((total, item) => total + Math.round(Number(item.valorAlocado) * 100), 0),
          committed: workContracts.reduce((total, item) => total + cents(item), 0),
          previous: workContracts.reduce((total, item) => item.id === id ? total + cents(item) : total, 0),
          globalAvailable: Math.round(Number(fund.valor) * 100) -
            contracts.reduce((total, item) => item.id === id ? total : total + cents(item), 0),
        });
      })
      .catch(() => {
        if (!controller.signal.aborted) setBudget({ key: budgetKey, error: true });
      });
    return () => controller.abort();
  }, [budgetKey, fundId, workId, id, token]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const fields = new FormData(event.currentTarget);
    const value = (key: keyof CreateContratoDTO) => String(fields.get(key) ?? "").trim();
    const body: CreateContratoDTO = {
      numeroContrato: value("numeroContrato"),
      valorContrato: value("valorContrato").replace(/\./g, "").replace(",", "."),
      dataAssinatura: value("dataAssinatura"),
      dataInicio: value("dataInicio"),
      dataFim: value("dataFim"),
      projetoObraId: Number(value("projetoObraId")),
      empresaId: Number(value("empresaId")),
      verbaPublicaId: Number(value("verbaPublicaId")),
    };
    setError("");
    setSaving(true);
    try {
      await request(path, token, { method: id === undefined ? "POST" : "PUT", body: JSON.stringify(body) });
      showToast("Contrato salvo com sucesso.", "success");
      router.push("/adm/contratos");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Falha ao salvar o contrato.");
    } finally {
      setSaving(false);
    }
  }

  const contract = data?.contract;
  const fund = data?.funds.find((item) => String(item.id) === fundId);
  const missingOptions = data && (!data.works.length || !data.companies.length || !data.funds.length);
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 text-3xl font-bold">{id === undefined ? "Adicionar contrato" : "Alterar contrato"}</h1>
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">{error}</p>}
      {!data && !error && <p role="status">Carregando formulário...</p>}
      {data && (
        <form onSubmit={submit} className="rounded-xl bg-white p-6 shadow-sm">
          <fieldset disabled={saving} className="grid gap-5 md:grid-cols-2">
            <label>Número do contrato<input name="numeroContrato" className={field} required maxLength={45} defaultValue={contract?.numeroContrato} /></label>
            <label>Valor (R$)<input name="valorContrato" className={field} required inputMode="numeric"
              placeholder="0,00" value={amount}
              onChange={(event) => setAmount(formatBrlInput(event.currentTarget.value))} /></label>
            <label>Data de assinatura<input name="dataAssinatura" className={field} type="date" required defaultValue={contract?.dataAssinatura.slice(0, 10)} /></label>
            <label>Início da vigência<input name="dataInicio" className={field} type="date" required defaultValue={contract?.dataInicio.slice(0, 10)} /></label>
            <label>Fim da vigência<input name="dataFim" className={field} type="date" required defaultValue={contract?.dataFim.slice(0, 10)} /></label>
            <ReferenceSelect name="projetoObraId" label="Obra" value={workId} onChange={setWorkId}
              options={data.works.map(({ id, nome }) => ({ id, label: nome }))} />
            <ReferenceSelect name="empresaId" label="Empresa contratada" selected={contract?.empresaId}
              options={data.companies.map(({ id, nome }) => ({ id, label: nome }))} />
            <ReferenceSelect name="verbaPublicaId" label="Verba pública" value={fundId} onChange={setFundId}
              options={data.funds.map((fund) => ({
                id: fund.id, label: `${fund.finalidade} · ${fund.origem} · ${currency.format(Number(fund.valor))}`,
              }))} />
          </fieldset>
          {fund && workId && (
            <section aria-label="Resumo da verba" aria-live="polite" className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
              {budget?.key !== budgetKey ? <p>Consultando cobertura da obra...</p> :
                "error" in budget ? <p>Não foi possível consultar o saldo agora.</p> :
                <BudgetSummary {...budget} proposed={amount ? Number(amount.replace(/\D/g, "")) : undefined} />}
            </section>
          )}
          {missingOptions && <p className="mt-4 text-sm text-amber-800">Cadastre uma obra, uma empresa e uma verba pública para poder salvar o contrato.</p>}
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <AdminAction href="/adm/contratos">Cancelar</AdminAction>
            <AdminAction variant="primary" type="submit" disabled={saving || missingOptions}>
              {saving ? "Salvando..." : id === undefined ? "Salvar contrato" : "Salvar alterações"}
            </AdminAction>
          </div>
        </form>
      )}
      {!data && error && <AdminAction href="/adm/contratos">Voltar aos contratos</AdminAction>}
    </div>
  );
}

function BudgetSummary({ allocated, committed, previous, globalAvailable, proposed }: {
  allocated: number; committed: number; previous: number; globalAvailable: number; proposed?: number;
}) {
  const limit = Math.max(0, Math.min(allocated - committed + previous, globalAvailable));
  const projected = proposed === undefined ? undefined : limit - proposed;
  const money = (cents: number) => currency.format(cents / 100);
  return (
    <dl className="grid gap-3 text-sm sm:grid-cols-2">
      <div><dt>Alocado à obra nesta verba</dt><dd className="font-semibold">{money(allocated)}</dd></div>
      <div><dt>Comprometido nesta obra e verba</dt><dd className="font-semibold">{money(committed)}</dd></div>
      <div><dt>Limite para este contrato</dt><dd className="font-semibold">{money(limit)}</dd></div>
      <div>
        <dt>Saldo previsto após salvar</dt>
        <dd className={projected !== undefined && projected < 0 ? "font-semibold text-red-800" : "font-semibold"}>
          {projected === undefined ? "Informe o valor do contrato" : projected < 0 ? `Excede em ${money(-projected)}` : money(projected)}
        </dd>
      </div>
    </dl>
  );
}

function ReferenceSelect({ name, label, selected, options, value, onChange }: {
  name: string; label: string; selected?: number; options: Option[]; value?: string; onChange?: (value: string) => void;
}) {
  return (
    <label>{label}
      <select name={name} className={field} required
        {...(value === undefined ? { defaultValue: selected ?? "" } : { value, onChange: (event: React.ChangeEvent<HTMLSelectElement>) => onChange?.(event.target.value) })}>
        <option value="">{options.length ? "Selecione" : "Nenhum registro disponível"}</option>
        {options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
      </select>
    </label>
  );
}
