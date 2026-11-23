import type { Metadata } from "next";
import WorkManagement from "@/components/ADM/WorkManagement";

export const metadata: Metadata = { title: "Gerenciar obras públicas | SIGEFIS", description: "Consulta interna das obras públicas cadastradas no SIGEFIS." };

export default function WorksPage() { return <WorkManagement />; }
