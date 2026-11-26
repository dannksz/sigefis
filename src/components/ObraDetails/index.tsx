import type { ReactNode } from "react";
import type { ObraPublicaDetalheDTO } from "@/repositories/transparencia.repository";
import ObraLink from "@/components/ObraLink";
import ObraTag, { formatWorkStatus } from "@/components/ObraTag";
import EvidenceImage from "./EvidenceImage";

const tabs = [
  ["geral", "Geral"], ["cronograma", "Cronograma"], ["contratos", "Contratos"],
  ["financeiro", "Financeiro e verba"], ["evidencias", "Evidências"],
] as const;
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const percent = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const date = (value?: string | null, empty = "Não informada") => value ? value.split("-").reverse().join("/") : empty;
const formatMoney = (value: string) => money.format(Number(value));
const formatPercent = (value: number) => `${percent.format(value)}%`;

function Field({ label, children }: { label: string; children?: ReactNode }) {
  return <div><dt className="font-semibold">{label}</dt><dd className="mt-1 break-words">{children || "Não informado"}</dd></div>;
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-neutral-300 bg-white p-4">{children}</p>;
}

function DataTable({ headers, rows }: { headers: string[]; rows: { id: number; cells: ReactNode[] }[] }) {
  return <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
    <table className="w-full text-left text-sm">
      <thead className="bg-neutral-200"><tr>{headers.map((header) => <th scope="col" key={header} className="px-4 py-3">{header}</th>)}</tr></thead>
      <tbody>{rows.map(({ id, cells }) => <tr key={id} className="border-t border-neutral-200">
        {cells.map((cell, index) => <td key={headers[index]} className="px-4 py-3">{cell}</td>)}
      </tr>)}</tbody>
    </table>
  </div>;
}

function General({ obra, stage }: { obra: ObraPublicaDetalheDTO; stage?: ObraPublicaDetalheDTO["etapas"][number] }) {
  const progress = obra.etapas.reduce((sum, item) => sum + item.percentualPrevisto * item.percentualExecutado / 100, 0);
  const { endereco, municipio } = obra;
  const address = [endereco.logradouro, endereco.numero, endereco.complemento, endereco.bairro].filter(Boolean).join(", ");
  return <div className="space-y-6">
    <div className="max-w-sm">
      <p className="mb-1 font-semibold">Progresso{obra.etapas.length ? ` · ${formatPercent(progress)}` : " · A definir"}</p>
      {obra.etapas.length > 0 && <div role="progressbar" aria-label="Progresso da obra" aria-valuenow={Math.min(100, Math.max(0, progress))}
        className="h-6 overflow-hidden rounded-full bg-white shadow-sm">
        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
      </div>}
    </div>
    <p className="font-semibold">{stage ? `Etapa ${stage.ordemEtapa}: ${stage.nomeEtapa}` : "Etapa a definir"}</p>
    <dl className="space-y-5">
      <Field label="Finalidade">{obra.finalidade}</Field>
      <Field label="Endereço">
        {address && <p>{address}</p>}<p>{municipio.nome}, {municipio.uf}</p>
        <p>CEP {endereco.cep ? endereco.cep.replace(/^(\d{5})(\d{3})$/, "$1-$2") : "não informado"}</p>
      </Field>
      <Field label="Status">{stage ? formatWorkStatus(stage.status) : "A definir"}</Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Início previsto">{date(obra.etapas[0]?.dataInicioPrevista, "A definir")}</Field>
        <Field label="Início real">{date(obra.etapas.map((item) => item.dataInicioReal).filter((value) => value !== null).sort()[0], "A definir")}</Field>
        <Field label="Entrega prevista da obra">{date(obra.dataConclusao, "A definir")}</Field>
      </div>
      <Field label="Descrição">{obra.descricao || "Descrição não informada."}</Field>
    </dl>
  </div>;
}

function Schedule({ obra }: { obra: ObraPublicaDetalheDTO }) {
  if (!obra.etapas.length) return <Empty>Nenhuma etapa cadastrada para esta obra.</Empty>;
  return <DataTable headers={["Ordem", "Etapa", "Período previsto", "Datas reais", "Peso na obra", "Execução", "Status"]}
    rows={obra.etapas.map((item) => ({ id: item.id, cells: [
      item.ordemEtapa, item.nomeEtapa, `${date(item.dataInicioPrevista)} a ${date(item.dataFimPrevista)}`,
      `${date(item.dataInicioReal, "A definir")} a ${date(item.dataFimReal, "A definir")}`,
      formatPercent(item.percentualPrevisto), formatPercent(item.percentualExecutado), <ObraTag key="status" kind="status" value={item.status} />,
    ] }))} />;
}

function Contracts({ obra }: { obra: ObraPublicaDetalheDTO }) {
  const funding = [...new Map([...obra.verbas, ...obra.contratos.map((item) => item.verbaPublica)].map((item) => [item.id, item])).values()];
  return <div className="space-y-6">
    <dl><Field label="Órgão responsável pela obra">{obra.orgaoResponsavel ? `${obra.orgaoResponsavel.nome} (${obra.orgaoResponsavel.sigla})` : undefined}</Field></dl>
    <section className="space-y-3"><h2 className="text-lg font-semibold">Contratos</h2>
      {obra.contratos.length ? <DataTable headers={["Contrato", "Empresa", "Assinatura", "Vigência", "Valor", "Verba e órgão financiador"]}
        rows={obra.contratos.map((item) => ({ id: item.id, cells: [item.numeroContrato, item.empresa, date(item.dataAssinatura),
          `${date(item.dataInicio)} a ${date(item.dataFim)}`, formatMoney(item.valorContrato),
          `${item.verbaPublica.finalidade} · ${item.verbaPublica.orgaoPublico.nome}`] }))} /> :
        <Empty>Nenhum contrato vinculado a esta obra.</Empty>}
    </section>
    <section className="space-y-3"><h2 className="text-lg font-semibold">Emendas parlamentares</h2>
      {funding.some((item) => item.emendas.length) ? <DataTable headers={["Emenda", "Autor", "Verba vinculada", "Valor da emenda"]}
        rows={funding.flatMap((item) => item.emendas.map((entry) => ({ id: entry.id, cells: [entry.numero, entry.autor, item.finalidade, formatMoney(entry.valor)] })))} /> :
        <Empty>Nenhuma emenda vinculada às verbas desta obra.</Empty>}
    </section>
  </div>;
}

function Finance({ obra }: { obra: ObraPublicaDetalheDTO }) {
  const { alocado, contratado, liberado, pago } = obra.totaisFinanceiros;
  return <div className="space-y-6">
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {[["Total alocado", alocado], ["Total contratado", contratado], ["Liberações aprovadas", liberado], ["Pagamentos aprovados", pago]].map(([label, value]) => (
        <div key={label} className="rounded-lg border border-neutral-200 bg-white p-4"><Field label={label}>{formatMoney(value)}</Field></div>
      ))}
    </dl>
    <section className="space-y-3"><h2 className="text-lg font-semibold">Verbas alocadas</h2>
      {obra.verbas.length ? <DataTable headers={["Finalidade", "Origem", "Órgão financiador", "Valor alocado"]}
        rows={obra.verbas.map((item) => ({ id: item.id, cells: [item.finalidade, item.origem, item.orgaoPublico.nome, formatMoney(item.valorAlocado)] }))} /> :
        <Empty>Nenhuma verba alocada a esta obra.</Empty>}
    </section>
    <section className="space-y-3"><h2 className="text-lg font-semibold">Liberações aprovadas</h2>
      {obra.liberacoesAprovadas.length ? <DataTable headers={["Data", "Valor"]}
        rows={obra.liberacoesAprovadas.map((item) => ({ id: item.id, cells: [date(item.dataLiberacao), formatMoney(item.valorLiberacao)] }))} /> :
        <Empty>Nenhuma liberação aprovada.</Empty>}
    </section>
    <section className="space-y-3"><h2 className="text-lg font-semibold">Pagamentos aprovados</h2>
      {obra.pagamentosAprovados.length ? <DataTable headers={["Data", "Nota fiscal", "Valor"]}
        rows={obra.pagamentosAprovados.map((item) => ({ id: item.id, cells: [date(item.dataPagamento), item.numeroNotaFiscal || "Não informada", formatMoney(item.valorPagamento)] }))} /> :
        <Empty>Nenhum pagamento aprovado.</Empty>}
    </section>
  </div>;
}

export default function ObraDetails({ obra, tab }: { obra: ObraPublicaDetalheDTO; tab?: string }) {
  const active = tabs.find(([key]) => key === tab)?.[0] ?? "geral";
  const stage = obra.etapas.find((item) => item.id === obra.fiscalizacoes[0]?.etapaCronogramaId) ?? obra.etapas[0];
  const path = `/obras/${obra.id}`;
  return <section className="mx-auto min-h-[70vh] w-[min(90%,1400px)] py-9 sm:py-12">
    <header className="mb-6 flex flex-wrap items-center gap-3">
      <h1 className="border-l-4 border-black pl-3 text-2xl font-semibold sm:text-3xl">{obra.nome}</h1>
      {stage && <ObraTag kind="status" value={stage.status} />}
      <ObraTag kind="region" value={obra.municipio.regiao} />
    </header>
    <nav aria-label="Informações da obra" className="mb-7 flex flex-wrap gap-2">
      {tabs.map(([key, label]) => <ObraLink key={key} href={key === "geral" ? path : `${path}?aba=${key}`} variant="tab" active={active === key}>{label}</ObraLink>)}
    </nav>
    {active === "geral" && <General obra={obra} stage={stage} />}
    {active === "cronograma" && <Schedule obra={obra} />}
    {active === "contratos" && <Contracts obra={obra} />}
    {active === "financeiro" && <Finance obra={obra} />}
    {active === "evidencias" && (obra.evidencias.length
      ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{obra.evidencias.map((item) => <EvidenceImage key={item.id}
        src={`/api/publico/obras/${obra.id}/evidencias/${item.id}`} caption={item.tipoEvidencia} date={date(item.dataRegistro)} />)}</div>
      : <Empty>Nenhuma imagem publicada para esta obra.</Empty>)}
  </section>;
}
