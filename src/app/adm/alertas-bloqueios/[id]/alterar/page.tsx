import { Suspense } from "react";
import { notFound } from "next/navigation";
import FinancialDirectory from "@/components/ADM/FinancialDirectory";

export const metadata = { title: "Alterar alerta | SIGEFIS" };
type Props = { params: Promise<{ id: string }> };

export default function Page({ params }: Props) {
  return (
    <Suspense fallback={<p role="status">Carregando registro...</p>}>
      <EditRecord params={params} />
    </Suspense>
  );
}

async function EditRecord({ params }: Props) {
  const { id } = await params;
  const recordId = Number(id);
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(recordId) || recordId < 1) notFound();
  return <FinancialDirectory area="alerts" oversightForm={{ resource: "alertas-fiscalizacao", id: recordId }} />;
}
