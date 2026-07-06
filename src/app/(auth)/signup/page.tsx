"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaGoogle, FaUser } from "react-icons/fa";
import { IoMdMail } from "react-icons/io";
import { FaPhone } from "react-icons/fa";
import { FaLock } from "react-icons/fa";
import { ImOffice } from "react-icons/im";
import { errorToast, successToast } from "@/utils/toast";
import { signIn } from "next-auth/react";

interface FormErrors {
  name?: string;
  email?: string;
  businessName?: string;
  businessAddress?: string;
  password?: string;
  confirmPassword?: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "", businessName: "", businessAddress: "",
  });
  const [role, setRole] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRole(localStorage.getItem("queue_role"));
  }, []);

  const update = (field: keyof typeof form, value: string) => {
    setForm({ ...form, [field]: value });
    setErrors({ ...errors, [field]: undefined });
  };

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Valid email address";
    if(role === "admin") {
      if (!form.businessName.trim()) e.businessName = "Business name is required";
      if (!form.businessAddress.trim()) e.businessAddress = "Business address is required";
    }
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "Minimum 8 characters";
    if (!form.confirmPassword) e.confirmPassword = "Please confirm your password";
    else if (form.password !== form.confirmPassword) e.confirmPassword = "Password does not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    const role = localStorage.getItem("queue_role") ?? "user";

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, role }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      localStorage.setItem("queue_verify_email", form.email);
      successToast("Account created successfully! Please verify your email.");
      router.push("/verify");
    } else {
      setErrors({ email: data.message ?? "Registration failed" });
      errorToast(data.message ?? "Registration failed");
    }
  };

  const handleGoogle = async() => {
    await signIn("google", { callbackUrl: "/google-welcome" })
  };

  return (
    <div>
      <div className="flex gap-1.5 mb-6">
        <div className="h-1 flex-1 rounded-full bg-blue-700" />
        <div className="h-1 flex-1 rounded-full bg-gray-200" />
      </div>

      <h1 className="text-3xl font-bold text-gray-900">Welcome to Queue</h1>
      <div className="mt-4 mb-6">
        <p className="text-sm font-semibold text-gray-800">Create Your Account</p>
        <p className="text-xs text-gray-400 mt-0.5">Set up your profile to get started.</p>
      </div>

      {role === "user" && (
        <button
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg py-3 text-sm text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          <FaGoogle />
          Sign up with Google
        </button>
      )}

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 uppercase tracking-widest">or</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Field label="Full name:" error={errors.name}>
          <InputRow icon={<FaUser />} error={!!errors.name}>
            <input
              type="text"
              placeholder="Full name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="flex-1 py-3 text-sm outline-none bg-transparent placeholder:text-gray-300"
            />
          </InputRow>
        </Field>

        <Field label="Email Address:" error={errors.email}>
          <InputRow icon={<IoMdMail />} error={!!errors.email}>
            <input
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="flex-1 py-3 text-sm outline-none bg-transparent placeholder:text-gray-300"
            />
          </InputRow>
        </Field>

        {role && role == "admin" && (
          <>
            <Field label="Business name" error={errors.businessName}>
              <InputRow icon={<FaUser />} error={!!errors.businessName}>
                <input
                  type="text"
                  placeholder="Business name"
                  value={form.businessName}
                  onChange={(e) => update("businessName", e.target.value)}
                  className="flex-1 py-3 text-sm outline-none bg-transparent placeholder:text-gray-300"
                />
              </InputRow>
            </Field>

            <Field label="Business address" error={errors.businessAddress}>
              <InputRow icon={<ImOffice />} error={!!errors.businessAddress}>
                <input
                  type="text"
                  placeholder="Business address"
                  value={form.businessAddress}
                  onChange={(e) => update("businessAddress", e.target.value)}
                  className="flex-1 py-3 text-sm outline-none bg-transparent placeholder:text-gray-300"
                />
              </InputRow>
            </Field> 
          </>
        )}

        <Field label="Enter Password" error={errors.password}>
          <InputRow icon={<FaLock />} error={!!errors.password}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              className="flex-1 py-3 text-sm outline-none bg-transparent placeholder:text-gray-300"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-xs text-gray-400 hover:text-gray-600 shrink-0">
              {showPassword ? "Hide" : "Show"}
            </button>
          </InputRow>
        </Field>

        <Field label="Confirm Password" error={errors.confirmPassword}>
          <InputRow icon={<FaLock />} error={!!errors.confirmPassword}>
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm password"
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              className="flex-1 py-3 text-sm outline-none bg-transparent placeholder:text-gray-300"
            />
            {/* <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-xs text-gray-400 hover:text-gray-600 shrink-0">
              {showConfirm ? "Hide" : "Show"}
            </button> */}
          </InputRow>
        </Field>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl text-sm font-semibold bg-[#3DBFA0] text-white hover:bg-[#2eaa8d] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-1"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-[#3DBFA0] font-medium hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
}

function Field(
  { label, error, children }: 
  { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1.5 block">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

function InputRow(
  { icon, error, children }: 
  { icon: React.ReactNode; error?: boolean; children: React.ReactNode }) {
  return (
    <div className={`flex items-center border rounded-lg px-3 gap-2 transition-colors 
    ${error ? "border-red-400 bg-red-50" : "border-gray-300 focus-within:border-[#3DBFA0]"}`}>
      <span className="text-gray-400 shrink-0">{icon}</span>
      {children}
    </div>
  );
}