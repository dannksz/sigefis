"use client";

import {
  AlertTriangle, Banknote, BriefcaseBusiness, Building2, ClipboardCheck, FileCheck2,
  FileSearch, Gauge, Landmark, ScrollText, ShieldCheck, Users, WalletCards,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/types/user";

type MenuItem = { name: string; icon: typeof Gauge; roles: Exclude<UserRole, "USER">[]; href?: string };

const menuItems: MenuItem[] = [
  { name: "Dashboard", icon: Gauge, roles: ["ADMIN", "GESTOR", "FISCAL"], href: "/adm" },
  { name: "Usuários e perfis", icon: Users, roles: ["ADMIN"], href: "/adm/usuarios" },
  { name: "Obras públicas", icon: Landmark, roles: ["ADMIN", "GESTOR", "FISCAL"], href: "/adm/obras" },
  { name: "Órgãos e empresas", icon: Building2, roles: ["ADMIN", "GESTOR"], href: "/adm/orgaos-empresas" },
  { name: "Contratos", icon: BriefcaseBusiness, roles: ["ADMIN", "GESTOR"], href: "/adm/contratos" },
  { name: "Cronograma", icon: ClipboardCheck, roles: ["ADMIN", "GESTOR", "FISCAL"], href: "/adm/cronograma" },
  { name: "Verbas e emendas", icon: WalletCards, roles: ["ADMIN", "GESTOR"], href: "/adm/verbas" },
  { name: "Financeiro", icon: Banknote, roles: ["ADMIN", "GESTOR"] },
  { name: "Fiscalizações", icon: FileSearch, roles: ["ADMIN", "FISCAL"] },
  { name: "Evidências", icon: FileCheck2, roles: ["ADMIN", "FISCAL"] },
  { name: "Alertas e bloqueios", icon: AlertTriangle, roles: ["ADMIN", "GESTOR", "FISCAL"] },
  { name: "Regularização", icon: ShieldCheck, roles: ["ADMIN", "GESTOR", "FISCAL"] },
  { name: "Auditoria", icon: ScrollText, roles: ["ADMIN"] },
];

export default function AdminSidebar({ role }: { role: Exclude<UserRole, "USER"> }) {
  const pathname = usePathname();
  return (
    <aside className="w-full bg-secondary text-white md:fixed md:bottom-0 md:left-0 md:top-20 md:w-64">
      <nav className="h-full overflow-y-auto px-3 py-4" aria-label="Setores administrativos">
        <ul className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:block md:space-y-1">
          {menuItems.filter((item) => item.roles.includes(role)).map((item) => {
            const Icon = item.icon;
            const active = item.href === "/adm" ? pathname === "/adm" : pathname === item.href || Boolean(item.href && pathname.startsWith(`${item.href}/`));
            const content = <><Icon className="size-5 shrink-0" aria-hidden="true" /><span>{item.name}</span></>;
            return (
              <li key={item.name}>
                {item.href ? <Link href={item.href} aria-current={active ? "page" : undefined} className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${active ? "bg-primary font-bold text-secondary" : "text-white hover:bg-secondary-light"}`}>{content}</Link>
                  : <button type="button" aria-label={`${item.name}: tela de gerenciamento ainda não criada`} className="flex min-h-11 w-full cursor-default items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-white transition-colors hover:bg-secondary-light">{content}</button>}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
