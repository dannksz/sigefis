import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import EditWork from "@/components/ADM/EditWork";

export const metadata: Metadata = {
  title: "Alterar obra pública | SIGEFIS",
  description: "Alteração dos dados gerais e da localização de uma obra pública.",
};

type Props = { params: Promise<{ id: string }> };

export default function EditWorkPage({ params }: Props) {
  return (
    <Suspense fallback={<main className="grid min-h-dvh place-items-center bg-[#eef0f5]"><p>Carregando obra...</p></main>}>
      <EditWorkRoute params={params} />
    </Suspense>
  );
}

async function EditWorkRoute({ params }: Props) {
  const { id } = await params;
  const workId = Number(id);
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(workId) || workId < 1) notFound();
  return <EditWork key={workId} workId={workId} />;
}
