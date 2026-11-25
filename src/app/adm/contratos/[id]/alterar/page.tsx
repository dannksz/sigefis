import { Suspense } from "react";
import { notFound } from "next/navigation";
import FinancialDirectory from "@/components/ADM/FinancialDirectory";

export const metadata = { title: "Alterar contrato | SIGEFIS" };
type Props = { params: Promise<{ id: string }> };

export default function Page({ params }: Props) {
  return <Suspense fallback={<p role="status">Carregando contrato...</p>}><EditContract params={params} /></Suspense>;
}

async function EditContract({ params }: Props) {
  const { id } = await params;
  const contractId = Number(id);
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(contractId) || contractId < 1) notFound();
  return <FinancialDirectory area="contracts" form={{ id: contractId }} />;
}
