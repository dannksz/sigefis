import type { Metadata } from "next";
import UserManagement from "@/components/ADM/UserManagement";

export const metadata: Metadata = { title: "Gerenciar usuários | SIGEFIS", description: "Gerenciamento de usuários e cargos do SIGEFIS." };

export default function UsersPage() { return <UserManagement />; }
