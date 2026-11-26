import type { ObraPublicaDTO } from "@/repositories/transparencia.repository";
import ObraLink from "@/components/ObraLink";
import ObraTag from "@/components/ObraTag";

type Props = { obra: ObraPublicaDTO; statusSelecionado?: string };

function formatDate(value?: string | null) {
  return value ? value.split("-").reverse().join("/") : "Não informada";
}

export default function ObraCard({ obra, statusSelecionado }: Props) {
  const latestInspection = obra.fiscalizacoes[0];
  const stage = obra.etapas.find((item) => item.status === statusSelecionado)
    ?? obra.etapas.find((item) => item.id === latestInspection?.etapaCronogramaId)
    ?? obra.etapas[0];
  const inspection = obra.fiscalizacoes.find((item) => item.etapaCronogramaId === stage?.id) ?? latestInspection;
  return (
    <article className="border-b border-[#c7c7c7] px-3 py-6 first:pt-0 sm:px-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h2 className="mr-auto text-xl font-bold leading-tight max-sm:basis-full">{obra.nome}</h2>
        {stage && <ObraTag kind="status" value={stage.status} />}
        <ObraTag kind="region" value={obra.municipio.regiao} />
      </div>
      <div className="mt-3 space-y-1.5 text-base leading-[1.4]">
        <p>{obra.finalidade} · {obra.municipio.nome}/{obra.municipio.uf}</p>
        {stage && <p>{stage.nomeEtapa}</p>}
        {inspection && <p>{Number(inspection.percentualExecutado).toLocaleString("pt-BR")} % concluído na vistoria de {formatDate(inspection.dataVistoria)}</p>}
        {stage && <p>Entrega da etapa prevista para {formatDate(stage.dataFimPrevista)}</p>}
        <p>Entrega da obra prevista para {formatDate(obra.dataConclusao)}</p>
      </div>
      <div className="mt-3"><ObraLink href={`/obras/${obra.id}`}>Ver detalhes</ObraLink></div>
    </article>
  );
}
