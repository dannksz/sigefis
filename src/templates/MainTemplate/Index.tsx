import Footer from "@/components/Footer";
import Navbar from "@/components/NavBar";
import "./portal.css";

export default function MainTemplate({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main id="conteudo" className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
