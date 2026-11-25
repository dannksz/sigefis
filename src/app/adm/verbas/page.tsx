import FinancialDirectory from "@/components/ADM/FinancialDirectory";
import { Suspense } from "react";

type Props = { searchParams: Promise<{ aba?: string | string[] }> };

export default function FundingPage({ searchParams }: Props) {
  return <Suspense fallback={<p role="status">Carregando verbas e emendas...</p>}><FundingTab searchParams={searchParams} /></Suspense>;
}

async function FundingTab({ searchParams }: Props) {
  const showAmendments = (await searchParams).aba === "emendas";
  return <FinancialDirectory key={String(showAmendments)} area="funding" showAmendments={showAmendments} />;
}
