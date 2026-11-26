import FinancialDirectory from "@/components/ADM/FinancialDirectory";

export const metadata = { title: "Adicionar processo de regularização | SIGEFIS" };

export default function Page() {
  return <FinancialDirectory area="regularization" oversightForm={{ resource: "processos-regularizacao" }} />;
}
