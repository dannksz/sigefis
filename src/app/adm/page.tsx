import type { Metadata } from "next";
import AdminDashboard from "@/components/ADM/AdminDashboard";

export const metadata: Metadata = { title: "Painel administrativo | SIGEFIS", description: "Indicadores e setores internos do SIGEFIS." };

export default function AdminPage() { return <AdminDashboard />; }
