import { Search, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import PortalDialog from "@/components/PortalDialog";

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
            <li><PortalDialog label="Contato" title="Contato">
              <p>O canal de contato do SIGEFIS será divulgado nesta seção.</p>
            </PortalDialog></li>
            <li><PortalDialog label="Suporte" title="Suporte">
              <p>Pesquise pelo nome da obra, pela localização ou pelo assunto. A consulta pública dispensa uma conta.</p>
            </PortalDialog></li>
          </ul>
          <div className="portal-nav-actions">
            <Link href="/#busca" aria-label="Ir para a busca" className="portal-search-shortcut">
              <Search size={24} strokeWidth={2.3} aria-hidden="true" />
            </Link>
            <PortalDialog label="Entrar" title="Acesso à área interna" className="portal-account"
              trigger={<UserRound size={19} fill="currentColor" strokeWidth={2.3} aria-hidden="true" />}
            >
              <p>A área de acesso está em desenvolvimento. Você já pode consultar as obras publicadas.</p>
            </PortalDialog>
          </div>
        </nav>
      </div>
    </header>
  );
}
