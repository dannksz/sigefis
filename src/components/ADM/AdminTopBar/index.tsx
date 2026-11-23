"use client";

import { LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type Props = { name: string; role: string; onLogout: () => void };
const roleNames: Record<string, string> = { ADMIN: "Administrador", GESTOR: "Gestor", FISCAL: "Fiscal" };

export default function AdminTopBar({ name, role, onLogout }: Props) {
  return (
    <header className="sticky top-0 z-40 h-20 border-b border-primary-dark bg-primary shadow-md md:fixed md:left-0 md:right-0">
      <div className="flex h-full items-center justify-between gap-4 px-5 md:px-8">
        <Link href="/" aria-label="Voltar ao portal SIGEFIS" className="inline-flex w-32 md:w-40">
          <Image src="/images/logomarca.png" alt="SIGEFIS" width={780} height={126} unoptimized className="h-auto w-full" />
        </Link>
        <div className="flex items-center gap-4 md:gap-6">
          <div className="hidden text-right text-sm sm:block">
            <p>Bem-vindo, <span className="font-bold">{name}</span></p>
            <p className="text-xs text-[#4b4300]">{roleNames[role] ?? role}</p>
          </div>
          <button type="button" onClick={onLogout} className="flex min-h-10 cursor-pointer items-center gap-2 font-semibold text-red-700 transition-colors hover:text-red-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary">
            <span>Sair</span><LogOut className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
