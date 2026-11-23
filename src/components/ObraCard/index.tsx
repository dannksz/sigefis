import { ChevronRight } from "lucide-react";
import type { ObraPublicaDTO } from "@/repositories/transparencia.repository";

type Props = { obra: ObraPublicaDTO; statusSelecionado?: string };
const statusColors: Record<string, string> = { EM_EXECUCAO: "bg-[#8bc9ff] text-[#17496f]", PARALISADA: "bg-[#ff9292] text-[#7d1717]", CONCLUIDA: "bg-[#9ee0ba] text-[#175d35]", ATRASADA: "bg-[#ffc56f] text-[#6d3d00]", PLANEJADA: "bg-[#d4c2ff] text-[#4b2879]" };
const regionColors: Record<string, string> = { Norte: "bg-[#8ad8c2] text-[#145c49]", Nordeste: "bg-[#ffc894] text-[#7c400e]", "Centro-Oeste": "bg-[#ffe586] text-[#665000]", Sudeste: "bg-[#91a9ff] text-[#263b88]", Sul: "bg-[#cba8ef] text-[#54277d]" };
function humanize(value: string) {
  const labels: Record<string, string> = { EM_EXECUCAO: "Em execução", CONCLUIDA: "Concluída", PARALISADA: "Paralisada", ATRASADA: "Atrasada", PLANEJADA: "Planejada" };
  return labels[value] ?? value.toLocaleLowerCase("pt-BR").replaceAll("_", " ").replace(/(^|\s)\p{L}/gu, (letter) => letter.toLocaleUpperCase("pt-BR"));
}
function formatDate(value: string | null | undefined) { if (!value) return "Não informada"; const [year, month, day] = value.split("-"); return `${day}/${month}/${year}`; }
function money(value: string) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value)); }

export default function ObraCard({ obra, statusSelecionado }: Props) {
  const latestInspection = obra.fiscalizacoes[0];
  const stage = obra.etapas.find((item) => item.status === statusSelecionado) ?? obra.etapas.find((item) => item.id === latestInspection?.etapaCronogramaId) ?? obra.etapas[0];
  const inspection = obra.fiscalizacoes.find((item) => item.etapaCronogramaId === stage?.id) ?? latestInspection;
  return (
    <article className="border-b border-[#c7c7c7] px-3 py-6 first:pt-0 sm:px-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h2 className="mr-auto text-xl font-bold leading-tight max-sm:basis-full">{obra.nome}</h2>
        {stage && <span className={`rounded-md px-4 py-1.5 text-xs ${statusColors[stage.status] ?? "bg-[#dedede] text-[#333]"}`}>{humanize(stage.status)}</span>}
        <span className={`rounded-md px-4 py-1.5 text-xs ${regionColors[obra.municipio.regiao] ?? "bg-[#dedede] text-[#333]"}`}>{obra.municipio.regiao}</span>
      </div>
      <div className="mt-3 space-y-1.5 text-base leading-[1.4]">
        <p>{obra.finalidade} · {obra.municipio.nome}/{obra.municipio.uf}</p>
        {stage && <p>{stage.nomeEtapa}</p>}
        {inspection && <p>{Number(inspection.percentualExecutado).toLocaleString("pt-BR")} % concluído na vistoria de {formatDate(inspection.dataVistoria)}</p>}
        {stage && <p>Entrega da etapa prevista para {formatDate(stage.dataFimPrevista)}</p>}
        <p>Entrega da obra prevista para {formatDate(obra.dataConclusao)}</p>
      </div>
      <details className="group mt-3 text-base">
        <summary className="inline-flex min-h-7 cursor-pointer list-none items-center gap-1 font-medium outline-none marker:content-none focus-visible:ring-2 focus-visible:ring-primary-dark"><ChevronRight size={16} className="transition-transform duration-300 group-open:rotate-90" aria-hidden="true" /> Ver detalhes</summary>
        <div className="mt-2 grid gap-3 rounded-md bg-white p-4 sm:grid-cols-2">
          <div><h3 className="font-bold">Descrição</h3><p className="mt-1 text-[#494949]">{obra.descricao || "Descrição não informada."}</p></div>
          <div><h3 className="font-bold">Resumo financeiro</h3><p className="mt-1 text-[#494949]">Alocado: {money(obra.totaisFinanceiros.alocado)}</p><p className="text-[#494949]">Contratado: {money(obra.totaisFinanceiros.contratado)}</p><p className="text-[#494949]">Pago: {money(obra.totaisFinanceiros.pago)}</p></div>
        </div>
      </details>
    </article>
  );
}
