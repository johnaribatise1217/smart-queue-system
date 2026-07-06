/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MdOutlineCheckCircle, MdOutlineCancel, MdOutlineUploadFile,
  MdOutlineFilterList, MdOutlineOpenInNew, MdOutlineSmartToy,
} from "react-icons/md";
import { HiOutlineQueueList } from "react-icons/hi2";

interface Submission {
  _id: string;
  userId: { _id: string; name: string; email: string; avatar?: { url: string } };
  deliverableName: string;
  type: string;
  fileUrl?: string;
  status: "pending" | "approved" | "rejected";
  aiVerified: boolean;
  aiNotes?: string;
  rejectionReason?: string;
  createdAt: string;
}

export default function QueuePointDeliverablesPage() {
  const { data: session } = useSession()
  const userId  = session?.user?._id
  const queueId = session?.user?.assignedQueueId as unknown as string
  const queryClient = useQueryClient()

  const [statusFilter, setStatusFilter]   = useState<string>("pending")
  const [rejectingId, setRejectingId]     = useState<string | null>(null)
  const [rejectReason, setRejectReason]   = useState("")

  const { data, isLoading} = useQuery({
    queryKey: ["queue-deliverables", queueId, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ queueId })
      if (statusFilter !== "all") params.set("status", statusFilter)
      const res  = await fetch(`/api/deliverables/queue?${params}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.message)
      return json
    },
    enabled: !!queueId,
    refetchInterval: 10000,
    staleTime: 8000,
  })

  const { mutate: review, isPending: reviewing } = useMutation({
    mutationFn: async ({
      submissionId, status, rejectionReason,
    }: { submissionId: string; status: string; rejectionReason?: string }) => {
      const res = await fetch("/api/deliverables/review", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, reviewedBy: userId, status, rejectionReason }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message)
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue-deliverables", queueId] })
      setRejectingId(null)
      setRejectReason("")
    },
  })

  const submissions: Submission[] = data?.data ?? []
  const stats = data?.stats ?? { pending: 0, approved: 0, rejected: 0, total: 0 }

  return (
    <div className="font-manrope flex flex-col gap-6 p-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Document Review</h1>
          <p className="text-sm text-gray-400 mt-0.5">Review and approve submitted documents</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#3DBFA0] animate-pulse" />
          <span className="text-xs text-gray-400">Live</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total",    value: stats.total,    color: "text-gray-900",   bg: "bg-gray-100" },
          { label: "Pending",  value: stats.pending,  color: "text-orange-500", bg: "bg-orange-50" },
          { label: "Approved", value: stats.approved, color: "text-green-600",  bg: "bg-green-50" },
          { label: "Rejected", value: stats.rejected, color: "text-red-500",    bg: "bg-red-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-1">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <MdOutlineFilterList size={16} className="text-gray-400" />
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors
              ${statusFilter === f
                ? "bg-[#2347C5] text-white"
                : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col gap-3 animate-pulse">
          {[1,2,3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-32" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && submissions.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center py-16 gap-3">
          <HiOutlineQueueList size={32} className="text-gray-300" />
          <p className="text-sm text-gray-400">No {statusFilter !== "all" ? statusFilter : ""} submissions</p>
        </div>
      )}

      {/* Submission cards */}
      {!isLoading && submissions.length > 0 && (
        <div className="flex flex-col gap-4">
          {submissions.map((s) => (
            <div
              key={s._id}
              className={`bg-white rounded-2xl border p-5 flex flex-col gap-4 transition-all
                ${s.status === "approved" ? "border-green-200" :
                  s.status === "rejected" ? "border-red-200" :
                  "border-gray-100"}`}
            >
              {/* User + doc info */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {s.userId.avatar?.url ? (
                    <img src={s.userId.avatar.url} className="w-10 h-10 rounded-full object-cover shrink-0" alt="" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#2347C5] flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {s.userId.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{s.userId.name}</p>
                    <p className="text-xs text-gray-400">{s.userId.email}</p>
                  </div>
                </div>

                {/* Status badge */}
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0
                  ${s.status === "approved" ? "bg-green-50 text-green-600 border-green-200" :
                    s.status === "rejected" ? "bg-red-50 text-red-500 border-red-200" :
                    "bg-orange-50 text-orange-500 border-orange-200"}`}>
                  {s.status === "approved" ? <MdOutlineCheckCircle size={12} /> :
                   s.status === "rejected" ? <MdOutlineCancel size={12} /> : null}
                  {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                </span>
              </div>

              {/* Document info */}
              <div className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-4 py-3">
                <MdOutlineUploadFile size={16} className="text-[#2347C5] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-700">{s.deliverableName}</p>
                  <p className="text-xs text-gray-400 capitalize">{s.type}</p>
                </div>
                {s.fileUrl && (
                  <a
                    href={s.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-[#2347C5] font-semibold hover:underline shrink-0"
                  >
                    <MdOutlineOpenInNew size={14} /> View File
                  </a>
                )}
              </div>

              {/* AI verification */}
              {s.aiNotes && (
                <div className={`flex items-start gap-2.5 rounded-xl px-4 py-3 ${
                  s.aiVerified
                    ? "bg-[#f0faf7] border border-[#a7f3d0]"
                    : "bg-orange-50 border border-orange-100"
                }`}>
                  <MdOutlineSmartToy size={16} className={`shrink-0 mt-0.5 ${s.aiVerified ? "text-[#3DBFA0]" : "text-orange-400"}`} />
                  <div>
                    <p className={`text-xs font-semibold ${s.aiVerified ? "text-[#3DBFA0]" : "text-orange-600"}`}>
                      AI Verification: {s.aiVerified ? "Passed" : "Flagged"}
                    </p>
                    <p className={`text-xs mt-0.5 ${s.aiVerified ? "text-[#3DBFA0]/80" : "text-orange-500"}`}>
                      {s.aiNotes}
                    </p>
                  </div>
                </div>
              )}

              {/* Rejection reason if rejected */}
              {s.status === "rejected" && s.rejectionReason && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <MdOutlineCancel size={14} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600">
                    <span className="font-semibold">Reason:</span> {s.rejectionReason}
                  </p>
                </div>
              )}

              {/* Reject reason input */}
              {rejectingId === s._id && (
                <div className="flex flex-col gap-2">
                  <textarea
                    placeholder="Reason for rejection (required)..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={2}
                    className="w-full border border-red-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-400 resize-none bg-red-50/30"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setRejectingId(null); setRejectReason("") }}
                      className="flex-1 border border-gray-200 text-gray-600 text-xs font-semibold py-2 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => review({ submissionId: s._id, status: "rejected", rejectionReason: rejectReason })}
                      disabled={!rejectReason.trim() || reviewing}
                      className="flex-1 bg-red-500 text-white text-xs font-semibold py-2 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-60"
                    >
                      Confirm Reject
                    </button>
                  </div>
                </div>
              )}

              {/* Action buttons — only for pending */}
              {s.status === "pending" && rejectingId !== s._id && (
                <div className="flex gap-2">
                  <button
                    onClick={() => review({ submissionId: s._id, status: "approved" })}
                    disabled={reviewing}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#f0faf7] border border-[#a7f3d0] text-[#3DBFA0] text-xs font-semibold py-2.5 rounded-xl hover:bg-green-100 transition-colors disabled:opacity-60"
                  >
                    <MdOutlineCheckCircle size={15} /> Approve
                  </button>
                  <button
                    onClick={() => setRejectingId(s._id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-50 border border-red-200 text-red-500 text-xs font-semibold py-2.5 rounded-xl hover:bg-red-100 transition-colors"
                  >
                    <MdOutlineCancel size={15} /> Reject
                  </button>
                </div>
              )}

              <p className="text-xs text-gray-300">
                Submitted {new Date(s.createdAt).toLocaleDateString("en-US", {
                  day: "numeric", month: "short", year: "numeric",
                  hour: "2-digit", minute: "2-digit"
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}