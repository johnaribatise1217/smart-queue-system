/* eslint-disable @next/next/no-img-element */
"use client";

import { useSession } from "next-auth/react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useState } from "react";

export function AppNavbar() {
  const { data: session } = useSession();
  const user = session?.user;
  const [search, setSearch] = useState("");

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good evening";
  };

  const firstName = user?.name?.split(" ")[0] ?? "";

  return (
    <header className="sticky top-0 z-50 w-full bg-[#E9EFFD] border-b py-2 lg:py-4 border-gray-100 font-manrope">
      <div className="flex items-center gap-4 px-6 h-16">
        <SidebarTrigger className="lg:hidden text-gray-500 hover:text-gray-700" />

        <div className="hidden sm:block shrink-0">
          <h1 className="text-[24px] font-[300] text-gray-900 leading-tight">
            {greeting()}, {firstName} 
          </h1>
          <p className="text-xs text-gray-600">Manage your queue</p>
        </div>

        <div className="flex-1 max-w-md mx-auto lg:mx-6">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 focus-within:border-[#3DBFA0] transition-colors">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search for anything..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-auto">
          {/* Notification bell */}
          <button className="relative w-9 h-9 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors">
            <BellIcon />
            {/* unread dot */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#3DBFA0] border-2 border-white" />
          </button>

          {/* User */}
          <div className="flex items-center gap-2.5 cursor-pointer group">
            {user?.avatar?.url ? (
              <img
                src={user?.avatar?.url}
                alt={user.name ?? ""}
                className="w-9 h-9 rounded-full object-cover border-2 border-gray-100"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#2347C5] flex items-center justify-center text-white text-sm font-bold shrink-0">
                {user?.name?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-gray-800 leading-tight">
                {user?.name}
              </p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
            <ChevronIcon />
          </div>
        </div>

      </div>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}