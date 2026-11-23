"use client";

import { ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useTransition } from "react";
import ObraCard from "@/components/ObraCard";
import Pagination from "@/components/Pagination";
import SearchableDropdown from "@/components/SearchableDropdown";
import type { ObraPublicaDTO } from "@/repositories/transparencia.repository";

type Filters = { busca: string; regiao: string; estadoId: string; cidadeId: string; finalidade: string; status: string; entrega: string; ordem: "antiga" | "recente"; page: number };
type FilterOptions = {
  estados: { id: number; nome: string; sigla: string; regiao: string }[];
  cidades: { id: number; nome: string; estadoId: number }[];
  finalidades: string[];
  status: string[];
  entregas: string[];
};
type Props = { items: ObraPublicaDTO[]; total: number; totalPages: number; filters: Filters; options: FilterOptions };
const regions = ["Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"];

function humanize(value: string) {
  const labels: Record<string, string> = { EM_EXECUCAO: "Em execução", CONCLUIDA: "Concluída", PARALISADA: "Paralisada", ATRASADA: "Atrasada", PLANEJADA: "Planejada" };
  if (labels[value]) return labels[value];
  return value.toLocaleLowerCase("pt-BR").replaceAll("_", " ").replace(/(^|\s)\p{L}/gu, (letter) => letter.toLocaleUpperCase("pt-BR"));
}
function formatDate(value: string) { const [year, month, day] = value.split("-"); return `${day}/${month}/${year}`; }

export default function ObrasResults({ items, total, totalPages, filters, options }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const currentSearchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const states = useMemo(() => options.estados.filter((state) => !filters.regiao || state.regiao === filters.regiao), [filters.regiao, options.estados]);
  const allowedStateIds = useMemo(() => new Set(states.map((state) => state.id)), [states]);
  const cities = useMemo(() => options.cidades.filter((city) => (!filters.estadoId || city.estadoId === Number(filters.estadoId)) && allowedStateIds.has(city.estadoId)), [allowedStateIds, filters.estadoId, options.cidades]);

  function update(changes: Record<string, string | undefined>) {
    const params = new URLSearchParams(currentSearchParams.toString());
    Object.entries(changes).forEach(([key, value]) => value ? params.set(key, value) : params.delete(key));
    if (!("page" in changes)) params.delete("page");
    startTransition(() => router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false }));
  }
  function clearFilters() {
    update({ regiao: undefined, estadoId: undefined, cidadeId: undefined, finalidade: undefined, status: undefined, entrega: undefined, page: undefined });
  }
  const hasFilters = Boolean(filters.regiao || filters.estadoId || filters.cidadeId || filters.finalidade || filters.status || filters.entrega);

  return (
    <section className="mx-auto w-[min(90%,1400px)] py-10 sm:py-14" aria-labelledby="obras-title" aria-busy={isPending}>
      <h1 id="obras-title" className="border-l-5 border-secondary py-1 pl-4 text-[26px] font-normal uppercase">Obras</h1>
      <div className="mt-4 flex min-h-12 flex-wrap items-center justify-between gap-3 border-b border-[#bcbcbc] pb-4 text-base">
        <p>
          {total === 1 ? "Foi encontrado" : "Foram encontrados"} {total} {total === 1 ? "resultado" : "resultados"}
          {filters.busca && <> para <strong className="font-medium">“{filters.busca}”</strong></>}
        </p>
        <label className="relative flex items-center gap-1 max-sm:w-full max-sm:justify-end">
          <span>Ordenar por</span>
          <select value={filters.ordem} disabled={isPending} onChange={(event) => update({ ordem: event.target.value })} className="cursor-pointer appearance-none bg-transparent py-2 pr-5 outline-none focus-visible:ring-2 focus-visible:ring-primary-dark">
            <option value="antiga">Mais antiga</option><option value="recente">Mais recente</option>
          </select>
          <ChevronDown size={12} className="pointer-events-none absolute right-0" aria-hidden="true" />
        </label>
      </div>
      <p className="sr-only" aria-live="polite">{isPending ? "Atualizando resultados." : `${total} resultados exibidos.`}</p>
      <div className={`mt-6 grid gap-10 transition-opacity duration-300 md:grid-cols-[190px_minmax(0,1fr)] ${isPending ? "opacity-55" : "opacity-100"}`}>
        <aside aria-label="Filtros das obras" className="space-y-1">
          <label className="relative block border-b border-[#8f8f8f] text-sm">
            <span className="sr-only">Região</span>
            <select value={filters.regiao} disabled={isPending} onChange={(event) => update({ regiao: event.target.value, estadoId: undefined, cidadeId: undefined, finalidade: undefined, status: undefined, entrega: undefined })} className="min-h-7 w-full cursor-pointer appearance-none bg-transparent py-1 pr-5 outline-none focus-visible:ring-2 focus-visible:ring-primary-dark">
              <option value="">Região</option>{regions.map((region) => <option key={region}>{region}</option>)}
            </select><ChevronDown size={13} className="pointer-events-none absolute right-0 top-2" aria-hidden="true" />
          </label>
          <SearchableDropdown label="Estado" value={filters.estadoId} disabled={isPending} options={states.map((state) => ({ value: String(state.id), label: `${state.nome} (${state.sigla})` }))} onChange={(value) => update({ estadoId: value, cidadeId: undefined, finalidade: undefined, status: undefined, entrega: undefined })} />
          <SearchableDropdown label="Cidade" value={filters.cidadeId} disabled={isPending} options={cities.map((city) => ({ value: String(city.id), label: city.nome }))} onChange={(value) => update({ cidadeId: value, finalidade: undefined, status: undefined, entrega: undefined })} />
          <SearchableDropdown label="Finalidade" value={filters.finalidade} disabled={isPending} options={options.finalidades.map((value) => ({ value, label: value }))} onChange={(value) => update({ finalidade: value, status: undefined, entrega: undefined })} />
          <SearchableDropdown label="Status da etapa" value={filters.status} disabled={isPending} options={options.status.map((value) => ({ value, label: humanize(value) }))} onChange={(value) => update({ status: value, entrega: undefined })} />
          <SearchableDropdown label="Conclusão prevista" value={filters.entrega} disabled={isPending} options={options.entregas.map((value) => ({ value, label: formatDate(value) }))} onChange={(value) => update({ entrega: value })} />
          <button type="button" disabled={!hasFilters || isPending} onClick={clearFilters} className="mt-4 min-h-9 cursor-pointer text-left text-sm underline decoration-transparent underline-offset-4 transition-colors hover:decoration-current focus-visible:outline-2 focus-visible:outline-primary-dark disabled:cursor-not-allowed disabled:opacity-40">Limpar filtros</button>
        </aside>
        <div>
          {items.length ? items.map((obra) => <ObraCard key={obra.id} obra={obra} statusSelecionado={filters.status} />) : <div className="border-b border-[#c7c7c7] px-5 py-10 text-center text-base"><p className="font-bold">Nenhuma obra encontrada.</p><p className="mt-2 text-[#555]">Altere ou limpe os filtros para ampliar a consulta.</p></div>}
          <Pagination currentPage={filters.page} totalPages={totalPages} disabled={isPending} onPageChange={(page) => update({ page: String(page) })} />
        </div>
      </div>
    </section>
  );
}
