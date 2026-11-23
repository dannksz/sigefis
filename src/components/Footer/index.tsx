import Image from "next/image";
import Link from "next/link";
import PortalDialog from "@/components/PortalDialog";

export default function Footer() {
  return (
    <footer className="portal-footer">
      <div className="portal-footer-inner">
        <div className="portal-footer-top">
          <Link href="/" className="portal-logo" aria-label="SIGEFIS, página inicial">
            <Image src="/images/logomarca.png" alt="SIGEFIS" width={780} height={126} unoptimized />
          </Link>
          <div className="portal-newsletter">
            <label htmlFor="newsletter-email">Newsletter</label>
            <div className="portal-newsletter-fields">
              <input id="newsletter-email" type="email" placeholder="Your email address..." disabled />
              <PortalDialog label="Subscribe" title="Newsletter" className="portal-subscribe">
                <p>O cadastro da newsletter estará disponível em uma próxima etapa.</p>
              </PortalDialog>
            </div>
          </div>
        </div>
        <nav className="portal-footer-links" aria-label="Informações institucionais">
          <PortalDialog label="Quem somos?" title="Quem somos">
            <p>O SIGEFIS é um projeto acadêmico de gestão, fiscalização e transparência de obras públicas.</p>
          </PortalDialog>
          <PortalDialog label="Política de privacidade" title="Política de privacidade">
            <p>A consulta pública pode ser usada sem criar conta. A política completa será publicada nesta seção.</p>
          </PortalDialog>
          <PortalDialog label="Acessibilidade" title="Acessibilidade">
            <p>Use Tab para percorrer os controles, Enter para ativá-los e Esc para fechar as janelas de informação.</p>
          </PortalDialog>
          <PortalDialog label="Contato" title="Contato">
            <p>O canal de contato do SIGEFIS será divulgado nesta seção.</p>
          </PortalDialog>
        </nav>
      </div>
    </footer>
  );
}
