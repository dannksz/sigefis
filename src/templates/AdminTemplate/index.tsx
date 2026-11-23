import AdminSidebar from "@/components/ADM/AdminSidebar";
import AdminTopBar from "@/components/ADM/AdminTopBar";
import type { UserRole } from "@/types/user";

type Props = { children: React.ReactNode; user: { nome: string; role: Exclude<UserRole, "USER"> }; onLogout: () => void };

export default function AdminTemplate({ children, user, onLogout }: Readonly<Props>) {
  return (
    <div className="min-h-dvh bg-[#eef0f5]">
      <AdminTopBar name={user.nome} role={user.role} onLogout={onLogout} />
      <AdminSidebar role={user.role} />
      <main className="p-5 md:ml-64 md:pt-24 lg:p-8 lg:pt-28">{children}</main>
    </div>
  );
}
