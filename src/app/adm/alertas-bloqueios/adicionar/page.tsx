import FinancialDirectory from "@/components/ADM/FinancialDirectory";

export const metadata = { title: "Adicionar alerta | SIGEFIS" };

export default function Page() {
  return <FinancialDirectory area="alerts" oversightForm={{ resource: "alertas-fiscalizacao" }} />;
}
