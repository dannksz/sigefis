import { Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import PortalDialog from "@/components/PortalDialog";
import AuthMenu from "@/components/AuthMenu";

export default function Navbar() {
  return (
    <header className="portal-header">
      <div className="portal-header-inner">
        <Link href="/" className="portal-logo" aria-label="SIGEFIS, página inicial">
          <Image src="/images/logomarca.png" alt="SIGEFIS" width={780} height={126} unoptimized />
        </Link>
        <nav className="portal-nav" aria-label="Navegação principal">
          <ul className="portal-nav-links">
            <li><Link href="/obras">Obras</Link></li>
            <li><PortalDialog label="Sobre" title="Sobre o SIGEFIS">
              <p>O SIGEFIS reúne dados sobre obras, contratos, fiscalizações e uso de recursos públicos.</p>
            </PortalDialog></li>
            <li><Link href="/contato">Contato</Link></li>
            <li><Link href="/faq">Suporte</Link></li>
          </ul>
          <div className="portal-nav-actions">
            <Link href="/#busca" aria-label="Ir para a busca" className="portal-search-shortcut">
              <Search size={24} strokeWidth={2.3} aria-hidden="true" />
            </Link>
            <AuthMenu />
          </div>
        </nav>
      </div>
    </header>
  );
}
