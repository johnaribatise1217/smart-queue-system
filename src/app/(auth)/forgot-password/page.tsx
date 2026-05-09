"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError("Email is required"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { 
      setError("Enter a valid email address"); 
      return; 
    }

    setLoading(true);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);

    if (res.ok) {
      localStorage.setItem("queue_reset_email", email);
      setSent(true);
    } else {
      setError("No account found with that email");
    }
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-[#3DBFA0]/15 flex items-center justify-center mx-auto mb-4">
          <MailCheckIcon />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
        <p className="text-sm text-gray-400 mb-6">
          We sent a password reset link to <span className="font-medium text-gray-600">{email}</span>
        </p>
        <Link href="/login" className="text-[#3DBFA0] text-sm hover:underline">
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/login" className="flex items-center gap-1.5 text-gray-400 text-sm mb-8 hover:text-gray-600 transition-colors w-fit">
        <ChevronLeftIcon />
        <span>Back to login</span>
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
      <p className="text-sm text-gray-400 mb-8">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">Email Address:</label>
          <div className={`flex items-center border rounded-lg px-3 gap-2 transition-colors ${error ? "border-red-400 bg-red-50" : "border-gray-300 focus-within:border-[#3DBFA0]"}`}>
            <MailIcon className="text-gray-400 shrink-0" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              className="flex-1 py-3 text-sm outline-none bg-transparent placeholder:text-gray-300"
            />
          </div>
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl text-sm font-semibold bg-[#3DBFA0] text-white hover:bg-[#2eaa8d] active:scale-[0.98] transition-all disabled:opacity-60 mt-1"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>
    </div>
  );
}

export function MailIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  );
}
export function ChevronLeftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  );
}
export function MailCheckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3DBFA0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
      <path d="m16 19 2 2 4-4"/>
    </svg>
  );
}