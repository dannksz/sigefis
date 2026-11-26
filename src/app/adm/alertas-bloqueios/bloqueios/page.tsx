import FinancialDirectory from "@/components/ADM/FinancialDirectory";

export const metadata = { title: "Bloqueios de repasse | SIGEFIS" };

export default function Page() {
  return <FinancialDirectory area="alerts" showBlocks />;
}
