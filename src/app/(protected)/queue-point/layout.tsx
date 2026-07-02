import { AppNavbar } from "@/app/_components/common/AppNavbar"
import { SidebarProvider } from "@/components/ui/sidebar"

export default function QueuePointLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen w-full">
        <AppNavbar />
        <main className="flex-1 bg-gray-50 overflow-y-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}