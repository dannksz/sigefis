import MyProfile from "@/components/Profile/MyProfile";
import Navbar from "@/components/NavBar";
import "@/templates/MainTemplate/portal.css";

export const metadata = { title: "Minhas informações | SIGEFIS" };

export default function ProfilePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main id="conteudo" className="flex flex-1 flex-col"><MyProfile /></main>
    </div>
  );
}
