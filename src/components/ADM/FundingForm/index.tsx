import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import AdminAction from "@/components/ADM/AdminAction";
import { formatBrlInput } from "@/lib/input-masks";
import type { PaginatedResult } from "@/lib/pagination";
import type { OrgaoPublicoResponseDTO } from "@/types/orgao-publico";
import type { CreateVerbaPublicaDTO, VerbaPublicaResponseDTO } from "@/types/verba-publica";
import type { CreateEmendaParlamentarDTO, EmendaParlamentarResponseDTO } from "@/types/emenda-parlamentar";

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
  for (let page = 1; ; page++) {
    const result = await request<PaginatedResult<T>>(`${path}?page=${page}&pageSize=100`, token, { signal });
    items.push(...result.data);
    if (page >= result.pagination.totalPages) return items;
  }
}

type RecordDTO = VerbaPublicaResponseDTO | EmendaParlamentarResponseDTO;

export default function FundingForm({ id, token, amendment = false }: { id?: number; token: string; amendment?: boolean }) {
  const router = useRouter();
  const [data, setData] = useState<{ options: { id: number; label: string }[]; record?: RecordDTO }>();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const resource = amendment ? "emendas-parlamentares" : "verbas-publicas";
  const path = id === undefined ? resource : `${resource}/${id}`;
  const backHref = amendment ? "/adm/verbas?aba=emendas" : "/adm/verbas";
  const label = amendment ? "emenda parlamentar" : "verba pública";

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    Promise.all([
      amendment
        ? listAll<VerbaPublicaResponseDTO>("verbas-publicas", token, signal).then((funds) =>
          funds.map((fund) => ({ id: fund.id, label: `${fund.finalidade} · ${fund.origem}` })))
        : listAll<OrgaoPublicoResponseDTO>("orgaos", token, signal).then((agencies) =>
          agencies.map((agency) => ({ id: agency.id, label: `${agency.nome} (${agency.sigla})` }))),
      id === undefined ? undefined : request<RecordDTO>(path, token, { signal }),
    ]).then(([options, record]) => {
      if (signal.aborted) return;
      setData({ options: options.sort((a, b) => a.label.localeCompare(b.label, "pt-BR")), record });
      setAmount(record ? formatBrlInput(Number(record.valor).toFixed(2)) : "");
    }).catch((reason: unknown) => {
      if (!signal.aborted) setError(reason instanceof Error ? reason.message : "Falha ao carregar o formulário.");
    });
    return () => controller.abort();
  }, [amendment, id, path, token]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !data?.options.length) return;
    const fields = new FormData(event.currentTarget);
    const valor = amount.replace(/\./g, "").replace(",", ".");
    const body: CreateVerbaPublicaDTO | CreateEmendaParlamentarDTO = amendment ? {
      numero: String(fields.get("numero") ?? "").trim(),
      autor: String(fields.get("autor") ?? "").trim(),
      verbaId: Number(fields.get("reference")),
      valor,
    } : {
      origem: String(fields.get("origem") ?? "").trim(),
      finalidade: String(fields.get("finalidade") ?? "").trim(),
      orgaoId: Number(fields.get("reference")),
      valor,
    };
    setError("");
    setSaving(true);
    try {
      await request(path, token, { method: id === undefined ? "POST" : "PUT", body: JSON.stringify(body) });
      router.push(backHref);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : `Falha ao salvar a ${label}.`);
    } finally {
      setSaving(false);
    }
  }

  const record = data?.record;
  const existingAmendment = record && "numero" in record ? record : undefined;
  const fund = record && "origem" in record ? record : undefined;
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 text-3xl font-bold">{id === undefined ? "Adicionar" : "Alterar"} {label}</h1>
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">{error}</p>}
      {!data && !error && <p role="status">Carregando formulário...</p>}
      {!data && error && <AdminAction href={backHref}>Voltar à lista</AdminAction>}
      {data && (
        <form onSubmit={submit} className="rounded-xl bg-white p-6 shadow-sm">
          <fieldset disabled={saving} className="grid gap-5 md:grid-cols-2">
            {amendment ? <>
              <label>Número da emenda<input className={field} name="numero" required maxLength={45} defaultValue={existingAmendment?.numero} /></label>
              <label>Autor<input className={field} name="autor" required maxLength={45} defaultValue={existingAmendment?.autor} /></label>
            </> : <>
              <label>Origem<input className={field} name="origem" required maxLength={45} defaultValue={fund?.origem} /></label>
              <label>Finalidade<input className={field} name="finalidade" required maxLength={65} defaultValue={fund?.finalidade} /></label>
            </>}
            <label>Valor (R$)<input className={field} name="valor" inputMode="numeric" required placeholder="0,00" value={amount}
              onChange={(event) => setAmount(formatBrlInput(event.currentTarget.value))} /></label>
            <label>{amendment ? "Verba pública vinculada" : "Órgão público"}<select className={field} name="reference" required defaultValue={existingAmendment?.verbaId ?? fund?.orgaoId ?? ""}>
              <option value="">{amendment ? "Selecione uma verba" : "Selecione um órgão"}</option>
              {data.options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
            </select></label>
          </fieldset>
          {!data.options.length && <p className="mt-4 text-sm text-amber-800">{amendment ? "Cadastre uma verba pública para vincular à emenda." : "Cadastre um órgão público para vincular à verba."}</p>}
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <AdminAction href={backHref}>Cancelar</AdminAction>
            <AdminAction variant="primary" type="submit" disabled={saving || !data.options.length}>
              {saving ? "Salvando..." : id === undefined ? `Salvar ${amendment ? "emenda" : "verba"}` : "Salvar alterações"}
            </AdminAction>
          </div>
        </form>
      )}
    </div>
  );
}
