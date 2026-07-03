"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MdOutlineAdd, MdOutlinePerson, MdOutlineEmail,
  MdOutlineLock, MdOutlineLocationOn,
} from "react-icons/md";
import { HiOutlineQueueList } from "react-icons/hi2";
import { successToast } from "@/utils/toast";

interface QueuePointAccount {
  _id: string;
  name: string;
  email: string;
  assignedQueueId: { _id: string; name: string; location: string; cycleId: { name: string } };
  createdAt: string;
}

interface FormState {
  name: string;
  email: string;
  password: string;
  queueId: string;
}

export default function AdminQueuePointsPage() {
  const { data: session } = useSession()
  const adminId     = session?.user?._id
  const queryClient = useQueryClient()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState<FormState>({ name: "", email: "", password: "", queueId: "" })
  const [formError, setFormError] = useState("")

  // fetch queue point accounts
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["queue-point-accounts", adminId],
    queryFn: async () => {
      const res  = await fetch(`/api/queue-point?adminId=${adminId}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.message)
      return json.data
    },
    enabled: !!adminId,
  })

  // fetch admin's queues for the dropdown
  const { data: cyclesData = [] } = useQuery({
    queryKey: ["admin-cycles-queues", adminId],
    queryFn: async () => {
      const res  = await fetch(`/api/cycle/admin?adminId=${adminId}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.message)
      return json.data
    },
    enabled: !!adminId,
  })


  // flatten all queues from all cycles for the dropdown
  const allQueues = cyclesData.flatMap((cycle: any) =>
    (cycle.queues ?? []).map((q: any) => ({
      ...q,
      cycleName: cycle.name,
    }))
  )

  console.log("queueId", form.queueId)

  const { mutate: createAccount, isPending: creating } = useMutation({
    mutationFn: async () => {
      if (!form.name.trim() || !form.email.trim() || !form.password.trim() || !form.queueId) {
        throw new Error("All fields are required")
      }
      const res = await fetch("/api/queue-point", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId, ...form }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message)
      return json
    },
    onSuccess: () => {
      successToast("Queue point account created successfully")
      queryClient.invalidateQueries({ queryKey: ["queue-point-accounts", adminId] })
      setShowForm(false)
      setForm({ name: "", email: "", password: "", queueId: "" })
      setFormError("")
    },
    onError: (err: any) => {
      setFormError(err.message ?? "Failed to create account")
    },
  })

  return (
    <div className="font-manrope flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Queue Point Accounts</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Create accounts for staff who manage individual queue points
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[#2347C5] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#1a38a8] transition-colors"
        >
          <MdOutlineAdd size={18} /> Create Account
        </button>
      </div>

      {/* Create account form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">New Queue Point Account</h2>
              <button
                onClick={() => { setShowForm(false); setFormError("") }}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-xs text-red-600">{formError}</p>
              </div>
            )}

            <div className="flex flex-col gap-4">
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-500 font-medium">Full Name</label>
                <div className="flex items-center border border-gray-200 rounded-xl px-3 gap-2 focus-within:border-[#2347C5] transition-colors">
                  <MdOutlinePerson size={16} className="text-gray-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="e.g. John Staff"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="flex-1 py-3 text-sm outline-none bg-transparent placeholder:text-gray-300"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-500 font-medium">Email</label>
                <div className="flex items-center border border-gray-200 rounded-xl px-3 gap-2 focus-within:border-[#2347C5] transition-colors">
                  <MdOutlineEmail size={16} className="text-gray-400 shrink-0" />
                  <input
                    type="email"
                    placeholder="staff@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="flex-1 py-3 text-sm outline-none bg-transparent placeholder:text-gray-300"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-500 font-medium">Password</label>
                <div className="flex items-center border border-gray-200 rounded-xl px-3 gap-2 focus-within:border-[#2347C5] transition-colors">
                  <MdOutlineLock size={16} className="text-gray-400 shrink-0" />
                  <input
                    type="password"
                    placeholder="Min 8 characters"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="flex-1 py-3 text-sm outline-none bg-transparent placeholder:text-gray-300"
                  />
                </div>
              </div>

              {/* Queue assignment */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-500 font-medium">Assign to Queue</label>
                <div className="relative">
                  <select
                    value={form.queueId}
                    onChange={(e) => setForm({ ...form, queueId: e.target.value })}
                    className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 pr-9 text-sm outline-none focus:border-[#2347C5] transition-colors bg-white"
                  >
                    <option value="">Select a queue point...</option>
                    {allQueues.map((q: any) => (
                      <option key={q._id} value={q._id}>
                        {q.name} ({q.location})
                      </option>
                    ))}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setShowForm(false); setFormError("") }}
                className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => createAccount()}
                disabled={creating}
                className="flex-1 bg-[#2347C5] text-white text-sm font-semibold py-3 rounded-xl hover:bg-[#1a38a8] transition-colors disabled:opacity-60"
              >
                {creating ? "Creating..." : "Create Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accounts list */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 animate-pulse">
          {[1,2,3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-40" />
          ))}
        </div>
      )}

      {!isLoading && accounts.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center py-20 gap-4">
          <HiOutlineQueueList size={36} className="text-gray-300" />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500">No queue point accounts yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Create accounts for staff who will manage each queue point
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-[#2347C5] text-white text-xs font-semibold px-4 py-2 rounded-xl"
          >
            <MdOutlineAdd size={14} /> Create First Account
          </button>
        </div>
      )}

      {!isLoading && accounts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {accounts.map((account: QueuePointAccount) => (
            <div
              key={account._id}
              className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4 hover:shadow-sm transition-shadow"
            >
              {/* Avatar + name */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#EEF2FF] flex items-center justify-center text-[#2347C5] text-base font-bold shrink-0">
                  {account.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{account.name}</p>
                  <p className="text-xs text-gray-400 truncate">{account.email}</p>
                </div>
                <span className="text-xs bg-[#f0faf7] text-[#3DBFA0] border border-[#a7f3d0] px-2.5 py-0.5 rounded-full font-semibold shrink-0">
                  Queue Point
                </span>
              </div>

              {/* Assigned queue */}
              {account.assignedQueueId && (
                <div className="bg-gray-50 rounded-xl px-4 py-3 flex flex-col gap-1">
                  <p className="text-xs text-gray-400">Assigned Queue</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {account.assignedQueueId.name}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <MdOutlineLocationOn size={12} className="text-gray-400 shrink-0" />
                    <p className="text-xs text-gray-400">{account.assignedQueueId.location}</p>
                  </div>
                  <p className="text-xs text-[#2347C5] font-medium mt-0.5">
                    Cycle: {(account.assignedQueueId as any).cycleId?.name ?? "—"}
                  </p>
                </div>
              )}

              <p className="text-xs text-gray-300">
                Created {new Date(account.createdAt).toLocaleDateString("en-US", {
                  day: "numeric", month: "short", year: "numeric"
                })}
              </p>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}