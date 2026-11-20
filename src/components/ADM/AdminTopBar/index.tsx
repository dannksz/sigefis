'use client';
import { LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import logomarca from "@/public/images/logomarca.png";

export default function AdminTopBar() {
  const handleLogout = () => {
    // Lógica de logout aqui
    console.log("Logout");
  };

  return (
    <header className="h-20 bg-primary border-b border-primary-light fixed top-0 right-0 left-0 z-10 shadow-lg">
      <div className="h-full px-8 flex items-center justify-between">
        {/* Logo */}
        <Link href="/adm/home">
          <div className="w-32 md:w-40 h-8 md:h-10 flex items-center">
            <Image
              src={logomarca}
              alt="Logomarca"
              className="w-full h-full object-contain"
            />
          </div>
        </Link>

        <div className="flex items-center gap-6">
          {/* Saudação */}
          <div className="text-right">
            <p className="text-white text-sm">Bem Vindo, <span className="font-semibold">Admin</span></p>
          </div>

          {/* Botão Sair */}
          <button
            onClick={handleLogout}
            className="text-red-400 hover:text-red-300 transition-colors text-sm font-semibold flex items-center gap-2"
          >
            <span>Sair</span>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
