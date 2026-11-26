import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { TransparenciaRepository } from "@/repositories/transparencia.repository";
import ObraDetails from "@/components/ObraDetails";
import MainTemplate from "@/templates/MainTemplate/Index";

export const metadata = { title: "Detalhes da obra | SIGEFIS" };
type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ aba?: string | string[] }> };

async function Content({ params, searchParams }: Props) {
  await connection();
  const [{ id: rawId }, { aba }] = await Promise.all([params, searchParams]);
  const id = Number(rawId);
  if (!/^\d+$/.test(rawId) || !Number.isSafeInteger(id) || id < 1 || id > 2147483647) notFound();
  const obra = await new TransparenciaRepository().findById(id);
  if (!obra) notFound();
  return <ObraDetails obra={obra} tab={typeof aba === "string" ? aba : undefined} />;
}

export default function Page(props: Props) {
  return <MainTemplate>
    <Suspense fallback={<section className="mx-auto min-h-[520px] w-[90%] py-10" role="status">Carregando informações da obra...</section>}>
      <Content {...props} />
    </Suspense>
  </MainTemplate>;
}
