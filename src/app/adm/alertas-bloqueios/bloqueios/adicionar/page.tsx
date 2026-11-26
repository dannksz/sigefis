import FinancialDirectory from "@/components/ADM/FinancialDirectory";

export const metadata = { title: "Adicionar bloqueio de repasse | SIGEFIS" };

export default function Page() {
  return <FinancialDirectory area="alerts" oversightForm={{ resource: "bloqueios-repasse" }} />;
}
