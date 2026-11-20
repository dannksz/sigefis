"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  User, 
  MapPin, 
  Package, 
  Star, 
  Settings, 
  LogOut,
  LucideIcon
} from "lucide-react";

type SidebarItem = {
  icon: LucideIcon;
  label: string;
  href: string;
};

const sidebarItems: SidebarItem[] = [
  { icon: User, label: "Dados Pessoais", href: "/perfil" },
  { icon: MapPin, label: "Lista de endereços", href: "/perfil/enderecos" },
  { icon: Package, label: "Pedidos", href: "/perfil/pedidos" },
  { icon: Star, label: "Avaliações", href: "/perfil/avaliacoes" },
  { icon: Settings, label: "Acessibilidade", href: "/perfil/acessibilidade" },
];

type ProfileSidebarProps = {
  activePage?: string;
};

export default function ProfileSidebar({ activePage }: ProfileSidebarProps = {}) {
  const pathname = usePathname();

  const handleLogout = async () => {
    // Implementar logout
    window.location.href = "/api/auth/signout";
  };

  return (
    <aside className="w-full lg:w-64 bg-primary-dark text-white p-4 lg:min-h-screen lg:sticky lg:top-0">
      <nav className="space-y-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-primary-dark text-secondary font-semibold"
                  : "text-white hover:bg-primary-light"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-secondary' : 'text-white'}`} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-primary-light hover:text-red-300 transition-all duration-200 w-full"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Sair</span>
        </button>
      </nav>
    </aside>
  );
}
