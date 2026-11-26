import { useEffect, useState, type FormEvent } from "react";
import AdminAction from "@/components/ADM/AdminAction";
import AdminTable from "@/components/ADM/AdminTable";
import type { PaginatedResult } from "@/lib/pagination";
import type { ObraFiscalResponseDTO, CreateObraFiscalDTO } from "@/types/obra-fiscal";

type Fiscal = { id: number; nome: string };
const field = "mt-1 block w-full rounded-lg border border-gray-400 bg-white px-3 py-2";

async function request<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api/obras-fiscais${path}`, {
    ...options, cache: "no-store",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error ?? "Não foi possível concluir a operação.");
  return body;
}

async function listAssignments(workId: number, token: string, signal: AbortSignal) {
  const items: ObraFiscalResponseDTO[] = [];
  for (let page = 1; ; page++) {
    const result = await request<PaginatedResult<ObraFiscalResponseDTO>>(
      `?projetoObraId=${workId}&page=${page}&pageSize=100`, token, { signal },
    );
    items.push(...result.data);
    if (page >= result.pagination.totalPages) return items;
  }
}

export default function WorkInspectors({ workId, token }: { workId: number; token: string }) {
  const [data, setData] = useState<{ assignments: ObraFiscalResponseDTO[]; fiscals: Fiscal[] }>();
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    Promise.all([listAssignments(workId, token, signal), request<Fiscal[]>("/fiscais", token, { signal })])
      .then(([assignments, fiscals]) => {
        if (!signal.aborted) setData({ assignments, fiscals });
      })
      .catch((reason: unknown) => {
        if (!signal.aborted) setLoadError(reason instanceof Error ? reason.message : "Falha ao consultar a equipe.");
      });
    return () => controller.abort();
  }, [token, workId]);

  const available = data?.fiscals.filter((fiscal) => !data.assignments.some((item) => item.usuarioId === fiscal.id)) ?? [];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !open) return;
    const fields = new FormData(event.currentTarget);
    const usuarioId = Number(fields.get("usuarioId"));
    const tipoFiscal = fields.get("tipoFiscal");
    if (!available.some((fiscal) => fiscal.id === usuarioId) || (tipoFiscal !== "INTERNO" && tipoFiscal !== "EXTERNO")) {
      setError("Selecione um fiscal disponível e a função na obra.");
      return;
    }
    const body: CreateObraFiscalDTO = {
      projetoObraId: workId,
      usuarioId,
      tipoFiscal,
      dataDesignacao: String(fields.get("dataDesignacao") ?? ""),
    };
    setSaving(true);
    setError("");
    try {
      const assignment = await request<ObraFiscalResponseDTO>("", token, { method: "POST", body: JSON.stringify(body) });
      setData((current) => current && { ...current, assignments: [...current.assignments, assignment] });
      setOpen(false);
      setNotice("Fiscal designado com sucesso.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível designar o fiscal.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-labelledby="work-inspectors-heading" className="mt-8 rounded-xl bg-white p-6 shadow-sm md:p-8">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 id="work-inspectors-heading" className="text-xl font-bold">Equipe de fiscalização</h2>
        <AdminAction variant="primary" disabled={!available.length || open} onClick={() => {
          setNotice("");
          setError("");
          setOpen(true);
        }}>Designar fiscal</AdminAction>
      </header>
      {loadError ? <p role="alert" className="text-red-800">{loadError}</p> : !data && <p role="status">Carregando equipe...</p>}
      {notice && <p role="status" className="mb-4 text-green-800">{notice}</p>}
      {data && (data.assignments.length ? (
        <AdminTable data={data.assignments} keyExtractor={(item) => item.id} columns={[
          { key: "fiscal", header: "Fiscal", render: (item) => data.fiscals.find((fiscal) => fiscal.id === item.usuarioId)?.nome ?? `Usuário #${item.usuarioId}` },
          { key: "tipo", header: "Função na obra", render: (item) => item.tipoFiscal === "EXTERNO" ? "Fiscal externo" : "Fiscal interno" },
          { key: "data", header: "Data da designação", render: (item) => item.dataDesignacao.slice(0, 10).split("-").reverse().join("/") },
        ]} />
      ) : <p>Nenhum fiscal designado para esta obra.</p>)}
      {data && !available.length && <p className="mt-3 text-sm text-gray-700">Nenhum fiscal disponível para uma nova designação.</p>}
      {open && (
        <form onSubmit={submit} className="mt-6 border-t border-gray-200 pt-5">
          <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
            <label>Fiscal<select className={field} name="usuarioId" required defaultValue="">
              <option value="" disabled>Selecione um fiscal</option>
              {available.map((fiscal) => <option key={fiscal.id} value={fiscal.id}>{fiscal.nome} (#{fiscal.id})</option>)}
            </select></label>
            <label>Função na obra<select className={field} name="tipoFiscal" defaultValue="INTERNO" required>
              <option value="INTERNO">Fiscal interno</option>
              <option value="EXTERNO">Fiscal externo</option>
            </select></label>
            <label>Data da designação<input className={field} name="dataDesignacao" type="date" required /></label>
          </fieldset>
          {error && <p role="alert" className="mt-3 text-red-800">{error}</p>}
          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <AdminAction disabled={saving} onClick={() => setOpen(false)}>Cancelar</AdminAction>
            <AdminAction variant="primary" type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar designação"}</AdminAction>
          </div>
        </form>
      )}
    </section>
  );
}
