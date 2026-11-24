import { Suspense } from "react";
import { notFound } from "next/navigation";
import Institutions from "@/components/ADM/Institutions";

export const metadata = { title: "Alterar órgão ou empresa | SIGEFIS" };

type Props = { params: Promise<{ tipo: string; id: string }> };

export default function EditInstitutionPage({ params }: Props) {
  return (
    <Suspense fallback={<p role="status">Carregando cadastro...</p>}>
      <EditInstitution params={params} />
    </Suspense>
  );
}

async function EditInstitution({ params }: Props) {
  const { tipo, id } = await params;
  const recordId = Number(id);
  if ((tipo !== "orgaos" && tipo !== "empresas") || !/^\d+$/.test(id) || !Number.isSafeInteger(recordId) || recordId < 1) {
    notFound();
  }
  return <Institutions edit={{ section: tipo, id: recordId }} />;
}
