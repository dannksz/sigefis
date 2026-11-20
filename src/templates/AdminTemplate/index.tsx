import AdminSidebar from "@/components/ADM/AdminSidebar";
import AdminTopBar from "@/components/ADM/AdminTopBar";

type AdminTemplateProps = {
  children: React.ReactNode;
};

export default function AdminTemplate({ children }: Readonly<AdminTemplateProps>) {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* TopBar */}
      <AdminTopBar />
      
      {/* Main Content */}
      <main className="ml-52 mt-20 p-4">
        {children}
      </main>
    </div>
  );
}
