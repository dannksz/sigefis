import Link from "next/link";
import MainTemplate from "@/templates/MainTemplate/Index";

export const metadata = {
  title: "Sobre o SIGEFIS",
  description: "Conheça o SIGEFIS, um projeto acadêmico de transparência e acompanhamento de obras públicas.",
};

export default function AboutPage() {
  return (
    <MainTemplate>
      <article className="mx-auto w-[min(90%,960px)] space-y-8 py-10 sm:py-14">
        <header>
          <h1 className="border-l-4 border-primary pl-4 text-3xl font-bold sm:text-4xl">Sobre o SIGEFIS</h1>
          <p className="mt-5 max-w-3xl leading-relaxed">O SIGEFIS é um projeto acadêmico que reúne informações sobre obras públicas para facilitar o acompanhamento pela população. A consulta ao portal é aberta.</p>
        </header>
        <section className="rounded-xl border border-neutral-200 bg-white p-5 sm:p-7">
          <h2 className="mb-3 text-xl font-semibold">O que você pode acompanhar</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Localização, finalidade e previsão de entrega das obras publicadas.</li>
            <li>Etapas do cronograma e percentual executado.</li>
            <li>Contratos, empresas, órgãos responsáveis, verbas e emendas vinculadas.</li>
            <li>Liberações e pagamentos aprovados e fotos publicadas na galeria da obra.</li>
          </ul>
        </section>
        <section>
          <h2 className="mb-3 text-xl font-semibold">Como participar</h2>
          <p className="max-w-3xl leading-relaxed">Use a busca para consultar uma obra. Se encontrar uma informação que precisa de correção ou quiser enviar uma sugestão, use o formulário de contato.</p>
          <div className="mt-5 flex flex-wrap gap-4">
            <Link href="/obras" className="rounded-lg bg-primary px-4 py-2 font-semibold hover:bg-primary-light">Consultar obras</Link>
            <Link href="/contato" className="rounded-lg border border-neutral-300 bg-white px-4 py-2 font-semibold hover:bg-ice">Entrar em contato</Link>
          </div>
        </section>
      </article>
    </MainTemplate>
  );
}
