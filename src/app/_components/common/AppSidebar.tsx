"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const userNav: NavItem[] = [
  { label: "Dashboard", href: "/user/dashboard", icon: <DashboardIcon /> },
  { label: "History",   href: "/user/history",   icon: <HistoryIcon /> },
  { label: "Tickets",   href: "/user/tickets",   icon: <TicketsIcon /> },
  { label: "Support / Help", href: "/user/support", icon: <SupportIcon /> },
];

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: <DashboardIcon /> },
  { label: "History",   href: "/admin/history",   icon: <HistoryIcon /> },
  { label: "Tickets",   href: "/admin/tickets",   icon: <TicketsIcon /> },
  { label: "Support / Help", href: "/admin/support", icon: <SupportIcon /> },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isAdmin = role === "admin";
  const navItems = isAdmin ? adminNav : userNav;

  return (
    <Sidebar className="font-manrope border-none font-extralight">
      <SidebarHeader className="bg-[#2347C5] px-5 pt-6 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
            <Image src={"/images/queue-logo.png"} alt="Queue Logo" width={64} height={64} />
          </div>
          <span className="text-white font-[300] text-lg tracking-tight">Queue</span>
        </div>

        <Link
          href={isAdmin ? "/admin/create-cycle" : "/user/join-queue"}
          className="mt-8 flex items-center gap-2.5 bg-white rounded-2xl px-4 py-3 text-[#171717] text-sm hover:bg-blue-50 transition-colors"
        >
          <span className="w-6 h-6 rounded-full bg-[#3DBFA0] flex items-center justify-center shrink-0">
            <PlusIcon />
          </span>
          {isAdmin ? "Create a Cycle" : "Join a Queue"}
        </Link>
      </SidebarHeader>

      <SidebarContent className="bg-[#2347C5] px-3 py-4">
        <SidebarMenu className="gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  className={`
                    rounded-2xl px-4 py-3 h-auto mt-5 text-sm font-[300] transition-all
                    ${isActive
                      ? "bg-[#3DBFA0] text-white hover:bg-[#3DBFA0] hover:text-white"
                      : "text-blue-200 hover:bg-white/10 hover:text-white"
                    }
                  `}
                >
                  <Link href={item.href} className="flex items-center gap-3">
                    <span className={isActive ? "text-white" : "text-blue-300"}>
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="bg-[#2347C5] px-3 pb-6">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 bg-[#ef4444] hover:bg-[#dc2626] text-white rounded-2xl px-4 py-3 text-sm font-semibold transition-colors"
        >
          <LogoutIcon />
          Logout
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffff" strokeWidth="3" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" /><path d="M12 7v5l4 2" />
    </svg>
  );
}

function TicketsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}