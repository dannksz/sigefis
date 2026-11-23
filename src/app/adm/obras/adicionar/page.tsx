import type { Metadata } from "next";
import AddWork from "@/components/ADM/AddWork";

export const metadata: Metadata = { title: "Adicionar obra pública | SIGEFIS", description: "Cadastro de uma nova obra pública no SIGEFIS." };

export default function AddWorkPage() { return <AddWork />; }
