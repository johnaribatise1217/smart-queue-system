"use client";

import { useState, useRef, useEffect, type KeyboardEvent, type ClipboardEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaChevronLeft } from "react-icons/fa";
import { errorToast, successToast } from "@/utils/toast";

export default function VerifyPage() {
  const router = useRouter();
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const email = typeof window !== "undefined"
    ? localStorage.getItem("queue_verify_email") ?? ""
    : "";

  const handleChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...code];
    next[i] = val;
    setCode(next);
    setError("");
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...code];
    pasted.split("").forEach((ch, i) => { next[i] = ch; });
    setCode(next);
    inputs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = code.join("");
    if (otp.length < 6) { setError("Please enter the complete 6-digit code"); return; }
    setLoading(true);

    const res = await fetch("/api/auth/verify-otp", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code: otp }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      const role = localStorage.getItem("queue_role") ?? "user";
      successToast(data.message);
      router.push('/login');
    } else {
      setError(data.message);
      errorToast(data.message);
      setCode(Array(6).fill(""));
      inputs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    await fetch("/api/auth/resend-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setResent(true);
    setTimeout(() => setResent(false), 30000);
  };

  return (
    <div>
      <div className="flex gap-1.5 mb-6">
        <div className="h-1 flex-1 rounded-full bg-blue-700" />
        <div className="h-1 flex-1 rounded-full bg-blue-700" />
      </div>

      <Link href="/signup" className="flex items-center gap-1 text-gray-400 text-sm mb-6 hover:text-gray-600 transition-colors w-fit">
        <FaChevronLeft />
      </Link>

      <h2 className="text-xl font-bold text-gray-900">Verify Your Account</h2>
      <p className="text-sm text-gray-400 mt-1 mb-8">
        Please enter the one-time passcode (OTP) that has been sent to your email address to continue.
      </p>

      <form onSubmit={handleSubmit}>
        {/* OTP boxes */}
        <div className="flex gap-3 justify-between mb-2">
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKey(i, e)}
              onPaste={handlePaste}
              className={`w-full aspect-square text-center text-lg font-semibold border rounded-xl outline-none transition-all
                ${error ? "border-red-400 bg-red-50 text-red-500" : digit ? "border-blue-700 bg-blue-50 text-blue-700" : "border-gray-300 focus:border-[#3DBFA0]"}`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between mb-6">
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <div className={`ml-auto text-xs ${resent ? "text-gray-400" : ""}`}>
            Don&apos;t receive OTP?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={resent}
              className="text-[#3DBFA0] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resent ? "Sent!" : "Resend Code"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl text-sm font-semibold bg-[#3DBFA0] text-white hover:bg-[#2eaa8d] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>
      </form>
    </div>
  );
}