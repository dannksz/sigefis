import { Suspense } from "react";
import { notFound } from "next/navigation";
import FinancialDirectory from "@/components/ADM/FinancialDirectory";

export const metadata = { title: "Alterar emenda parlamentar | SIGEFIS" };
type Props = { params: Promise<{ id: string }> };

export default function Page({ params }: Props) {
  return <Suspense fallback={<p role="status">Carregando emenda...</p>}><EditAmendment params={params} /></Suspense>;
}

async function EditAmendment({ params }: Props) {
  const { id } = await params;
  const amendmentId = Number(id);
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(amendmentId) || amendmentId < 1) notFound();
  return <FinancialDirectory area="funding" form={{ id: amendmentId, amendment: true }} />;
}
