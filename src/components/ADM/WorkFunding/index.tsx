import { useEffect, useState, type FormEvent } from "react";
import AdminAction from "@/components/ADM/AdminAction";
import AdminTable from "@/components/ADM/AdminTable";
import TableAction from "@/components/ADM/TableAction";
import { formatBrlInput } from "@/lib/input-masks";
import type { PaginatedResult } from "@/lib/pagination";
import type { ProjetoVerbaResponseDTO } from "@/types/projeto-verba";
import type { VerbaPublicaResponseDTO } from "@/types/verba-publica";
import type { ContratoResponseDTO } from "@/types/contrato";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const cents = (value: string) => Math.round(Number(value) * 100);
const field = "mt-1 block w-full rounded-lg border border-gray-400 bg-white px-3 py-2";

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

export default function WorkFunding({ workId, token }: { workId: number; token: string }) {
  const [data, setData] = useState<{
    allocations: ProjetoVerbaResponseDTO[];
    funds: VerbaPublicaResponseDTO[];
    contracts: ContratoResponseDTO[];
  }>();
  const [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState<ProjetoVerbaResponseDTO | "new" | null>(null);
  const [amount, setAmount] = useState("");
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const filter = { projetoObraId: String(workId) };
    Promise.all([
      listAll<ProjetoVerbaResponseDTO>("projetos-verbas", token, signal, filter),
      listAll<VerbaPublicaResponseDTO>("verbas-publicas", token, signal),
      listAll<ContratoResponseDTO>("contratos", token, signal, filter),
    ]).then(([allocations, funds, contracts]) => {
      if (!signal.aborted) {
        setData({ allocations, funds, contracts });
        setLoadError("");
      }
    }).catch((reason: unknown) => {
      if (!signal.aborted) setLoadError(reason instanceof Error ? reason.message : "Falha ao consultar as verbas.");
    });
    return () => controller.abort();
  }, [revision, token, workId]);

  function open(record: ProjetoVerbaResponseDTO | "new") {
    setEditing(record);
    setAmount(record === "new" ? "" : formatBrlInput(Number(record.valorAlocado).toFixed(2)));
    setError("");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !editing) return;
    const fields = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    try {
      await request(editing === "new" ? "projetos-verbas" : `projetos-verbas/${editing.id}`, token, {
        method: editing === "new" ? "POST" : "PUT",
        body: JSON.stringify({
          projetoObraId: workId,
          verbaPublicaId: Number(fields.get("verbaPublicaId")),
          valorAlocado: amount.replace(/\./g, "").replace(",", "."),
        }),
      });
      setEditing(null);
      setData(undefined);
      setRevision((value) => value + 1);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Falha ao salvar a alocação.");
    } finally {
      setSaving(false);
    }
  }

  const allocated = data?.allocations.reduce((total, item) => total + cents(item.valorAlocado), 0) ?? 0;
  const committed = data?.contracts.reduce((total, item) => total + cents(item.valorContrato), 0) ?? 0;
  const coverage = new Map<number, { allocated: number; committed: number }>();
  for (const item of data?.allocations ?? []) {
    const totals = coverage.get(item.verbaPublicaId) ?? { allocated: 0, committed: 0 };
    totals.allocated += cents(item.valorAlocado);
    coverage.set(item.verbaPublicaId, totals);
  }
  for (const item of data?.contracts ?? []) {
    const totals = coverage.get(item.verbaPublicaId) ?? { allocated: 0, committed: 0 };
    totals.committed += cents(item.valorContrato);
    coverage.set(item.verbaPublicaId, totals);
  }
  const coverageRows = Array.from(coverage, ([id, totals]) => ({
    id, name: data?.funds.find((fund) => fund.id === id)?.finalidade ?? `Verba #${id}`, ...totals,
  }));
  return (
    <section aria-labelledby="work-funding-title" className="mt-8 rounded-xl bg-white p-6 shadow-sm md:p-8">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 id="work-funding-title" className="text-xl font-bold">Verbas da obra</h2>
        <AdminAction variant="primary" disabled={!data?.funds.length || editing !== null} onClick={() => open("new")}>
          Alocar verba
        </AdminAction>
      </header>
      {loadError ? <p role="alert">{loadError}</p> : !data && <p role="status">Carregando verbas...</p>}
      {data && (
        <>
          <dl className="mb-5 grid gap-3 sm:grid-cols-2">
            <div><dt>Alocado à obra</dt><dd className="font-semibold">{brl.format(allocated / 100)}</dd></div>
            <div><dt>Comprometido em contratos</dt><dd className="font-semibold">{brl.format(committed / 100)}</dd></div>
          </dl>
          {coverageRows.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 font-semibold">Cobertura por verba</h3>
              <AdminTable data={coverageRows} keyExtractor={(item) => item.id} columns={[
                { key: "name", header: "Verba" },
                { key: "allocated", header: "Alocado", render: (item) => brl.format(item.allocated / 100) },
                { key: "committed", header: "Comprometido", render: (item) => brl.format(item.committed / 100) },
                { key: "balance", header: "Cobertura", render: (item) => {
                  const balance = item.allocated - item.committed;
                  return balance < 0
                    ? <span className="font-semibold text-red-800">{brl.format(-balance / 100)} sem cobertura</span>
                    : `${brl.format(balance / 100)} de saldo`;
                } },
              ]} />
            </div>
          )}
          <h3 className="mb-3 font-semibold">Alocações registradas</h3>
          {!data.funds.length && <p className="mb-3">Cadastre uma verba pública para alocá-la à obra.</p>}
          {data.allocations.length ? <AdminTable data={data.allocations} keyExtractor={(item) => item.id} columns={[
            { key: "fund", header: "Verba", render: (item) => data.funds.find((fund) => fund.id === item.verbaPublicaId)?.finalidade ?? `Verba #${item.verbaPublicaId}` },
            { key: "valorAlocado", header: "Valor alocado", render: (item) => brl.format(Number(item.valorAlocado)) },
            { key: "actions", header: "Ações", align: "center", render: (item) => (
              editing === null && <TableAction action="edit" name={`Alocação #${item.id}`} onClick={() => open(item)} />
            ) },
          ]} /> : <p>Nenhuma verba alocada a esta obra.</p>}
          {editing && (
            <form onSubmit={save} className="mt-6 border-t border-gray-200 pt-5">
              <h3 className="mb-4 font-bold">{editing === "new" ? "Alocar verba" : "Alterar alocação"}</h3>
              <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
                <label>Verba pública<select className={field} name="verbaPublicaId" required defaultValue={editing === "new" ? "" : editing.verbaPublicaId}>
                  <option value="">Selecione uma verba</option>
                  {data.funds.map((fund) => <option key={fund.id} value={fund.id}>{fund.finalidade} · {fund.origem}</option>)}
                </select></label>
                <label>Valor alocado (R$)<input className={field} required inputMode="numeric" placeholder="0,00" value={amount}
                  onChange={(event) => setAmount(formatBrlInput(event.currentTarget.value))} /></label>
              </fieldset>
              {error && <p role="alert" className="mt-3 text-red-800">{error}</p>}
              <div className="mt-5 flex flex-wrap justify-end gap-3">
                <AdminAction disabled={saving} onClick={() => setEditing(null)}>Cancelar</AdminAction>
                <AdminAction variant="primary" type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar alocação"}</AdminAction>
              </div>
            </form>
          )}
        </>
      )}
    </section>
  );
}
