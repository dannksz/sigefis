import { Suspense } from "react";
import { notFound } from "next/navigation";
import FinancialDirectory from "@/components/ADM/FinancialDirectory";

export const metadata = { title: "Alterar verba pública | SIGEFIS" };
type Props = { params: Promise<{ id: string }> };

export default function Page({ params }: Props) {
  return <Suspense fallback={<p role="status">Carregando verba...</p>}><EditFunding params={params} /></Suspense>;
}

async function EditFunding({ params }: Props) {
  const { id } = await params;
  const fundId = Number(id);
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(fundId) || fundId < 1) notFound();
  return <FinancialDirectory area="funding" form={{ id: fundId }} />;
}
