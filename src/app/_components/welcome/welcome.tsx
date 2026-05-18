'use client'
import React, { useEffect } from 'react'
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from 'next/image';
import { useSession } from 'next-auth/react';

type Role = "user" | "admin";

const Welcome = () => {
  const [selected, setSelected] = useState<Role | null>(null);
  const { data: session } = useSession();
  const user = session?.user;
  const router = useRouter();

  const handleContinue = () => {
    if (!selected) return;
    localStorage.setItem("queue_role", selected);
    if (selected === "admin") {
      router.push("/signup");
    } else {
      router.push("/signup");
    }
  };

  return (
    <div className="w-full h-screen bg-homeBg font-manrope bg-cover bg-center flex items-center justify-center" 
    >
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />

      <div className="relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-xl mx-4 px-8 py-10 flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-[#ffff] flex items-center justify-center shadow-lg shadow-[#3DBFA0]/30">
          <Image loading="lazy" src={"/images/queue-logo.png"} alt="Queue Logo" width={64} height={64} />
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Welcome to Queue
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Choose how you&apos;d like to continue.
          </p>
        </div>

        <div className="w-full flex flex-col gap-3">
          <RoleCard
            role="user"
            selected={selected === "user"}
            onSelect={() => setSelected("user")}
            icon={<UserIcon />}
            title="User"
            description="Join queues online, track your position in real time, and get notified when it's your turn."
          />
          <RoleCard
            role="admin"
            selected={selected === "admin"}
            onSelect={() => setSelected("admin")}
            icon={<AdminIcon />}
            title="Admin"
            description="Manage queues, call next tickets, and assist users efficiently."
          />
        </div>

         <button
          onClick={handleContinue}
          disabled={!selected}
          className={`w-full py-3.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200
            ${
              selected
                ? "bg-[#3DBFA0] text-white shadow-md shadow-[#3DBFA0]/30 hover:bg-[#2eaa8d] active:scale-[0.98]"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
        >
          Continue
        </button>
      </div>
    </div>
  )
}

interface RoleCardProps {
  role: Role;
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}

function RoleCard({ selected, onSelect, icon, title, description }: RoleCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl border text-left transition-all duration-200
        ${
          selected
            ? "border-[#3DBFA0] bg-[#f0faf7] shadow-sm"
            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
        }`}
    >
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200
          ${selected ? "bg-[#3DBFA0]/15" : "bg-gray-100"}`}
      >
        <span className={selected ? "text-[#3DBFA0]" : "text-gray-500"}>
          {icon}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${selected ? "text-[#2eaa8d]" : "text-gray-800"}`}>
          {title}
        </p>
        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{description}</p>
      </div>

      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200
          ${selected ? "border-[#3DBFA0]" : "border-gray-300"}`}
      >
        {selected && (
          <div className="w-2.5 h-2.5 rounded-full bg-[#3DBFA0]" />
        )}
      </div>
    </button>
  );
}

function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function AdminIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export default Welcome