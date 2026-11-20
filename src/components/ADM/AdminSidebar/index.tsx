'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Shield, 
  Users, 
  Package, 
  Send, 
  Star, 
  MessageSquare, 
  Image as ImageIcon, 
  HelpCircle
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/adm/home" },
  { name: "Administradores", icon: Shield, href: "/adm/administrador/gerenciarAdministradores" },
  { name: "Usuários", icon: Users, href: "/adm/usuario/gerenciarUsuarios" },
  { name: "Produtos", icon: Package, href: "/adm/produto/gerenciarProdutos" },
  { name: "Pedidos", icon: Send, href: "/adm/pedidos" },
  { name: "Avaliações", icon: Star, href: "/adm/avaliacoes" },
  { name: "Mensagens", icon: MessageSquare, href: "/adm/mensagens" },
  { name: "Carousel", icon: ImageIcon, href: "/adm/carousel" },
  { name: "Guia de Produtos", icon: HelpCircle, href: "/adm/guia" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-52 bg-primary-dark h-[calc(100vh-5rem)] fixed left-0 top-20 flex flex-col">
      {/* Menu Items */}
      <nav className="flex-1 py-6 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-dark text-secondary font-semibold'
                      : 'text-white hover:bg-primary-light'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-secondary' : 'text-white'}`} />
                  <span className="text-sm">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
