import FinancialDirectory from "@/components/ADM/FinancialDirectory";

export const metadata = { title: "Adicionar emenda parlamentar | SIGEFIS" };

export default function Page() {
  return <FinancialDirectory area="funding" form={{ amendment: true }} />;
}
