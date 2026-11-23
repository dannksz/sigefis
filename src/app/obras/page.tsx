import { connection } from "next/server";
import { Suspense } from "react";
import ObrasResults from "@/components/ObrasResults";
import MainTemplate from "@/templates/MainTemplate/Index";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function text(value: string | string[] | undefined, max = 120) { return first(value)?.trim().slice(0, max) ?? ""; }
function id(value: string | string[] | undefined) { const parsed = Number(first(value)); return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined; }
function date(value: string | string[] | undefined) { const parsed = text(value, 10); return /^\d{4}-\d{2}-\d{2}$/.test(parsed) ? new Date(`${parsed}T00:00:00.000Z`) : undefined; }

async function ObrasContent({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const query = await searchParams;
  const busca = text(query.busca);
  const regiao = text(query.regiao, 45);
  const estadoId = id(query.estadoId);
  const cidadeId = id(query.cidadeId);
  const finalidade = text(query.finalidade, 120);
  const status = text(query.status, 45);
  const entregaValue = text(query.entrega, 10);
  const entrega = date(query.entrega);
  const ordem = first(query.ordem) === "recente" ? "recente" as const : "antiga" as const;
  const requestedPage = id(query.page) ?? 1;
  const { TransparenciaService } = await import("@/services/transparencia.service");
  const service = new TransparenciaService();
  const common = { busca: busca || undefined, buscaDetalhada: true, regiao: regiao || undefined, estadoId, cidadeId, finalidade: finalidade || undefined, status: status || undefined };
  let result = await service.findAll({ ...common, entregaInicio: entrega, entregaFim: entrega, ordem, page: requestedPage, pageSize: 5 });
  const page = result.totalPages > 0 ? Math.min(requestedPage, result.totalPages) : 1;
  if (page !== requestedPage) result = await service.findAll({ ...common, entregaInicio: entrega, entregaFim: entrega, ordem, page, pageSize: 5 });
  const options = await service.listFilterOptions(common);

  return <ObrasResults items={result.items} total={result.total} totalPages={result.totalPages} filters={{ busca, regiao, estadoId: estadoId ? String(estadoId) : "", cidadeId: cidadeId ? String(cidadeId) : "", finalidade, status, entrega: entrega ? entregaValue : "", ordem, page }} options={options} />;
}

function LoadingResults() {
  return <section className="mx-auto min-h-[520px] w-[min(90%,1400px)] animate-pulse py-14" aria-label="Carregando obras"><div className="h-9 w-32 bg-[#dedede]" /><div className="mt-5 h-px bg-[#c7c7c7]" /><div className="mt-8 h-24 rounded bg-[#e9e9e9]" /><div className="mt-5 h-24 rounded bg-[#e9e9e9]" /></section>;
}

export default function ObrasPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <MainTemplate>
      <Suspense fallback={<LoadingResults />}>
        <ObrasContent searchParams={searchParams} />
      </Suspense>
    </MainTemplate>
  );
}
