import Link from "next/link";
import Accordion from "@/components/Accordion";
import MainTemplate from "@/templates/MainTemplate/Index";

export const metadata = {
  title: "Perguntas frequentes | SIGEFIS",
  description: "Tire dúvidas sobre busca, cronograma, contratos e dados financeiros das obras públicas no SIGEFIS.",
};

const questions = [
  {
    id: "consultar-obras",
    title: "Como encontro uma obra?",
    content: <p>Acesse <Link href="/obras" className="font-semibold underline underline-offset-2">Obras</Link> e use os filtros de região, estado, cidade, finalidade, status ou conclusão prevista. Você também pode pesquisar pelo nome da obra na página inicial.</p>,
  },
  {
    id: "conta",
    title: "Preciso criar uma conta para consultar as obras?",
    content: <p>A consulta das obras publicadas, dos contratos, do cronograma e das fotos disponíveis é aberta a todos.</p>,
  },
  {
    id: "progresso",
    title: "Como é calculado o progresso da obra?",
    content: <p>O SIGEFIS combina o peso de cada etapa no cronograma com o quanto dela foi executado. Uma etapa que representa 20% da obra e está pela metade contribui com 10 pontos percentuais para o progresso total.</p>,
  },
  {
    id: "datas",
    title: "O que significa uma data aparecer como “A definir”?",
    content: <p>Significa que a data ainda não foi informada no sistema. Na aba Cronograma, você pode comparar as datas planejadas com as datas reais de cada etapa.</p>,
  },
  {
    id: "valores",
    title: "Qual é a diferença entre valor alocado, contratado, liberado e pago?",
    content: <p>O valor alocado é a verba reservada à obra. O contratado é o total dos contratos vinculados. O liberado e o pago correspondem, respectivamente, às liberações de recursos e aos pagamentos aprovados que constam no sistema.</p>,
  },
  {
    id: "emendas",
    title: "Onde vejo os contratos e as emendas parlamentares?",
    content: <p>Abra os detalhes da obra e selecione a aba Contratos. Ali aparecem os contratos, os órgãos vinculados e as emendas associadas às verbas da obra, quando houver.</p>,
  },
  {
    id: "fotos",
    title: "Por que algumas obras não têm fotos?",
    content: <p>A aba Evidências exibe as fotos que já foram publicadas no portal. Quando houver imagens disponíveis, clique em uma delas para ampliar.</p>,
  },
];

export default function FAQPage() {
  return (
    <MainTemplate>
      <section className="mx-auto w-[min(90%,960px)] py-10 sm:py-14" aria-labelledby="faq-title">
        <h1 id="faq-title" className="mb-7 border-l-4 border-secondary pl-4 text-2xl font-semibold sm:text-3xl">Perguntas frequentes</h1>
        <Accordion name="faq-sigefis" items={questions} />
      </section>
    </MainTemplate>
  );
}
