import { AppSidebar } from "@/app/_components/common/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppNavbar } from "@/app/_components/common/AppNavbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden font-manrope">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <AppNavbar />
          <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}