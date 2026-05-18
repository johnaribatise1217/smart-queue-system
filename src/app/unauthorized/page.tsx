"use client";

import { useRouter } from "next/navigation";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 font-manrope">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 w-full max-w-md px-8 py-12 flex flex-col items-center text-center gap-6">

        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <span className="text-6xl font-bold text-gray-900">401</span>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            You don&apos;t have permission to access this page. Please contact your administrator if you think this is a mistake.
          </p>
        </div>

        <div className="w-full h-px bg-gray-100" />

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={() => router.back()}
            className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-gray-600 text-sm font-semibold px-5 py-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Go Back
          </button>
          <button
            onClick={() => router.push("/")}
            className="flex-1 bg-[#2347C5] text-white text-sm font-semibold px-5 py-3 rounded-xl hover:bg-[#1a38a8] transition-colors"
          >
            Go Home
          </button>
        </div>

      </div>
    </div>
  );
}