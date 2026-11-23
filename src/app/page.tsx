import { Archive, Search, TrendingUp, TriangleAlert } from "lucide-react";
import ConsultationButton from "@/components/ConsultationButton";
import MainTemplate from "@/templates/MainTemplate/Index";

export default function Home() {
  return (
    <MainTemplate>
      <div className="portal-home">
        <section className="portal-intro" aria-labelledby="portal-heading">
          <form role="search" action="/obras" className="portal-search">
            <button type="submit" aria-label="Pesquisar"><Search size={23} strokeWidth={2.3} aria-hidden="true" /></button>
            <label className="sr-only" htmlFor="busca">Pesquisar obras públicas</label>
            <input id="busca" name="busca" type="search" maxLength={120}
              placeholder="Pesquise por uma obra, um estado, uma cidade ou um tópico" />
          </form>
          <h1 id="portal-heading">Encontre as principais informações sobre as obras públicas centralizadas em um só lugar</h1>
          <p>Com o SIGEFIS, a informação está na palma da sua mão</p>
        </section>
        <section id="consultas" className="portal-consultations" aria-labelledby="consultas-heading">
          <h2 id="consultas-heading">Consultas disponíveis</h2>
          <ul>
            <li>
              <ConsultationButton aria-disabled="true">
                <Archive size={18} aria-hidden="true" /> Contratos
              </ConsultationButton>
            </li>
            <li>
              <form action="/obras">
              <ConsultationButton type="submit">
                <TriangleAlert size={18} aria-hidden="true" /> Obras
              </ConsultationButton>
              </form>
            </li>
            <li>
              <ConsultationButton aria-disabled="true">
                <TrendingUp size={18} aria-hidden="true" /> Relatórios
              </ConsultationButton>
            </li>
          </ul>
        </section>
      </div>
    </MainTemplate>
  );
}
