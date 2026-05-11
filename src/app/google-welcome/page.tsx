/* eslint-disable @next/next/no-img-element */
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function GoogleWelcomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.replace("/login");
      return;
    }

    // countdown then redirect based on role
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          const role = session.user?.role;
          router.replace(role === "admin" ? "/admin/dashboard" : "/user/dashboard");
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-3 border-[#3DBFA0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-manrope px-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md px-8 py-12 flex flex-col items-center text-center gap-6">
        
        {/* Animated checkmark */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-[#3DBFA0]/10 flex items-center justify-center animate-pulse">
            <div className="w-14 h-14 rounded-full bg-[#3DBFA0]/20 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3DBFA0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
          </div>
        </div>

        {session?.user?.avatar?.url ? (
          <img
            src={session.user.avatar.url}
            alt={session.user.name ?? ""}
            className="w-16 h-16 rounded-full border-4 border-[#3DBFA0]/20 -mt-2"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-[#3DBFA0] flex items-center justify-center text-white text-xl font-bold -mt-2">
            {session?.user?.name?.[0]?.toUpperCase()}
          </div>
        )}

        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {session?.user?.name?.split(" ")[0]}!
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            Signed in as{" "}
            <span className="font-medium text-gray-600">{session?.user?.email}</span>
          </p>
        </div>

        {/* Role badge */}
        <div className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide
          ${session?.user?.role === "admin"
            ? "bg-blue-50 text-blue-600"
            : "bg-[#3DBFA0]/10 text-[#3DBFA0]"
          }`}>
          {session?.user?.role}
        </div>

        {/* Redirect notice */}
        <div className="w-full bg-gray-50 rounded-2xl px-6 py-4">
          <p className="text-sm text-gray-400">
            Redirecting you to your dashboard in
          </p>
          <p className="text-4xl font-bold text-[#3DBFA0] mt-1">{countdown}</p>
        </div>

        {/* Skip button */}
        <button
          onClick={() => router.replace(session?.user?.role === "admin" ? "/admin/dashboard" : "/user/dashboard")}
          className="text-sm text-[#3DBFA0] hover:underline"
        >
          Go now →
        </button>

      </div>
    </div>
  );
}