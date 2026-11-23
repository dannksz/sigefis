import type { Metadata } from "next";
import { Suspense } from "react";
import EditWork from "@/components/ADM/EditWork";

export const metadata: Metadata = {
  title: "Alterar obra pública | SIGEFIS",
  description: "Alteração dos dados gerais e da localização de uma obra pública.",
};

export default function EditWorkPage() {
  return (
    <Suspense fallback={<main className="grid min-h-dvh place-items-center bg-[#eef0f5]"><p>Carregando obra...</p></main>}>
      <EditWork />
    </Suspense>
  );
}
