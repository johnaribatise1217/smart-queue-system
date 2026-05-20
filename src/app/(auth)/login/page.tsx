"use client";

import { useState } from "react";
import { signIn, useSession} from "next-auth/react";
import type { SignInResponse } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaGoogle } from "react-icons/fa";
import { IoMdMail } from "react-icons/io";
import { FaLock } from "react-icons/fa";
import { errorToast, successToast } from "@/utils/toast";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";

const GOOGLE_ERRORS: Record<string, string> = {
  OAuthAccountNotLinked: "This email is already linked to another sign in method.",
  OAuthCallbackError: "Google sign in failed. Please try again.",
  AccessDenied: "Access denied. You may not have permission to sign in.",
  Verification: "Your verification link has expired.",
  Default: "Something went wrong. Please try again.",
}

function GoogleErrorBanner() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  if (!error) return null

  return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 8v4M12 16h.01"/>
      </svg>
      <p className="text-sm text-red-600">
        {GOOGLE_ERRORS[error] ?? GOOGLE_ERRORS.Default}
      </p>
    </div>
  )
}

interface FormErrors {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Valid email address";
    }
    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Incorrect password";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setAuthError("");

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: form.email,
        password: form.password,
      });

      if(result && (result as SignInResponse).ok) {
        successToast("Logged in successfully!");
        const userRole = session?.user?.role;
        router.push(userRole === "admin" ? "/admin/dashboard" : "/user/dashboard");
      } else {
        const msg = (result && (result as any).error) ?? 'Invalid credentials'
        errorToast(msg)
      }
    } catch (error: any) {
      errorToast(error?.message ?? 'Sign in failed')
    } finally{
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    await signIn("google", { callbackUrl: "/google-welcome"})
  };

  return (
    <div>
      <div className="relative z-10 lg:hidden">
        <div className="w-20 h-20 rounded-xl bg-transparent flex items-center justify-center">
          <Image src={"/images/queue-logo.png"} alt="Queue Logo" width={64} height={64} />
        </div>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Welcome Back!</h1>
      <Suspense>
        <GoogleErrorBanner />
      </Suspense>
      <button
        onClick={handleGoogle}
        className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg py-3 text-sm text-gray-700 font-medium hover:bg-gray-50 transition-colors"
      >
        <FaGoogle />
        Sign in with Google
      </button>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 uppercase tracking-widest">or</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">Email Address:</label>
          <div className={`flex items-center border rounded-lg px-3 gap-2 transition-colors ${errors.email ? "border-red-400 bg-red-50" : "border-gray-300 focus-within:border-[#3DBFA0]"}`}>
            <IoMdMail className="text-gray-400 shrink-0" />
            <input
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: undefined }); }}
              className="flex-1 py-3 text-sm outline-none bg-transparent placeholder:text-gray-300"
            />
          </div>
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">Enter Password</label>
          <div className={`flex items-center border rounded-lg px-3 gap-2 transition-colors ${errors.password ? "border-red-400 bg-red-50" : "border-gray-300 focus-within:border-[#3DBFA0]"}`}>
            <FaLock className="text-gray-400 shrink-0" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create password"
              value={form.password}
              onChange={(e) => 
                { setForm({ ...form, password: e.target.value }); 
                setErrors({ ...errors, password: undefined }); }}
              className="flex-1 py-3 text-sm outline-none bg-transparent placeholder:text-gray-300"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-xs text-gray-400 hover:text-gray-600 shrink-0"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
        </div>

        {authError && (
          <p className="text-red-500 text-sm text-center -mt-2">{authError}</p>
        )}

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.remember}
              onChange={(e) => setForm({ ...form, remember: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 accent-[#3DBFA0]"
            />
            <span className="text-sm text-gray-600">Remember me</span>
          </label>
          <Link href="/forgot-password" className="text-sm text-[#3DBFA0] hover:underline">
            Forget Password
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl text-sm font-semibold bg-[#3DBFA0] text-white hover:bg-[#2eaa8d] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-1"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Are you a new user?{" "}
        <Link href="/welcome" className="text-[#3DBFA0] font-medium hover:underline">
          Create Account
        </Link>
      </p>
    </div>
  );
}