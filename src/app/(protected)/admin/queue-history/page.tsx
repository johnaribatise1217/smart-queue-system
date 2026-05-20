"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MdOutlinePeople,
  MdOutlineHourglassTop,
  MdOutlineCheckCircle,
  MdOutlinePlayCircle,
  MdOutlineArrowForward,
  MdOutlinePersonRemove,
  MdOutlineFilterList,
} from "react-icons/md";
import { HiOutlineQueueList } from "react-icons/hi2";
import Image from "next/image";

type CycleStatus = "waiting" | "inprogress" | "completed";

interface HistoryUser {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  avatar?: { url: string };
}

interface HistoryEntry {
  _id: string;
  userId: HistoryUser;
  cycleId: { _id: string; name: string };
  currentQueueId: { _id: string; name: string; location: string; order: number } | null;
  position: number;
  cycleStatus: CycleStatus;
  isOnWaitingList: boolean;
  completedQueues: { _id: string; name: string; order: number }[];
  joinedAt: string;
  completedAt?: string;
}

interface Stats {
  total: number;
  waiting: number;
  inprogress: number;
  completed: number;
}

const fetchAdminHistory = async (
  adminId: any,
  status: string,
): Promise<{ data: HistoryEntry[]; stats: Stats }> => {
  const params = new URLSearchParams({ adminId })
  if (status !== "all") params.set("status", status)
  const res = await fetch(`/api/cycle/queue/history?${params}`)
  const json = await res.json()
  if (!res.ok) throw new Error(json.message ?? "Failed to fetch history")
  return { data: json.data, stats: json.stats }
}

export default function AdminQueueHistoryPage() {
  const { data: session } = useSession()
  const adminId = session?.user?._id as any
  const queryClient = useQueryClient()

  const [status, setStatus] = useState<string>("all")
  const [confirmAction, setConfirmAction] = useState<{
    type: "advance" | "remove";
    entry: HistoryEntry;
  } | null>(null)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-queue-history", adminId, status],
    queryFn: () => fetchAdminHistory(adminId, status),
    enabled: !!adminId,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    staleTime: 4000,
  })

  const history = data?.data ?? []
  const stats   = data?.stats ?? { total: 0, waiting: 0, inprogress: 0, completed: 0 }

  const { mutate: advanceUser, isPending: advancing } = useMutation({
    mutationFn: async (entry: HistoryEntry) => {
      const res = await fetch("/api/cycle/queue/advance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId,
          userId: entry.userId._id,
          cycleId: entry.cycleId._id,
          completedQueueId: entry.currentQueueId?._id,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message)
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-queue-history", adminId] })
      setConfirmAction(null)
    },
  })

  const { mutate: removeUser, isPending: removing } = useMutation({
    mutationFn: async (entry: HistoryEntry) => {
      const params = new URLSearchParams({
        adminId,
        userId: entry.userId._id,
        cycleId: entry.cycleId._id,
      })
      const res = await fetch(`/api/cycle/queue?${params}`, {
        method: "DELETE",
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message)
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-queue-history", adminId] })
      setConfirmAction(null)
    },
  })

  return (
    <div className="font-manrope flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Queue History</h1>
          <p className="text-sm text-gray-400 mt-0.5">Monitor and manage users across your cycles</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#3DBFA0] animate-pulse" />
          <span className="text-xs text-gray-400">Live</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <HistoryStatCard label="Total Users"  value={stats.total}      icon={<MdOutlinePeople size={18} className="text-[#2347C5]" />}   accent="bg-[#EEF2FF]" />
        <HistoryStatCard label="Waiting"      value={stats.waiting}    icon={<MdOutlineHourglassTop size={18} className="text-orange-400" />} accent="bg-orange-50" />
        <HistoryStatCard label="In Progress"  value={stats.inprogress} icon={<MdOutlinePlayCircle size={18} className="text-blue-500" />}  accent="bg-blue-50" />
        <HistoryStatCard label="Completed"    value={stats.completed}  icon={<MdOutlineCheckCircle size={18} className="text-[#3DBFA0]" />} accent="bg-[#f0faf7]" />
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        <MdOutlineFilterList size={16} className="text-gray-400" />
        {(["all", "waiting", "inprogress", "completed"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-colors
              ${status === s
                ? "bg-[#2347C5] text-white"
                : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
          >
            {s === "all" ? `All (${stats.total})` :
             s === "waiting" ? `Waiting (${stats.waiting})` :
             s === "inprogress" ? `In Progress (${stats.inprogress})` :
             `Completed (${stats.completed})`}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-gray-50">
              <div className="w-8 h-8 rounded-full bg-gray-100 shrink-0" />
              <div className="flex-1">
                <div className="h-3.5 bg-gray-100 rounded w-40 mb-1.5" />
                <div className="h-3 bg-gray-100 rounded w-28" />
              </div>
              <div className="h-3 bg-gray-100 rounded w-24" />
              <div className="h-3 bg-gray-100 rounded w-20" />
              <div className="h-6 bg-gray-100 rounded-full w-20" />
              <div className="h-7 bg-gray-100 rounded-lg w-16" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-center gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
          </svg>
          <p className="text-sm text-red-600">{(error as Error)?.message}</p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && history.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center py-20 gap-3">
          <HiOutlineQueueList size={32} className="text-gray-300" />
          <p className="text-sm text-gray-400">No queue history found</p>
        </div>
      )}

      {/* Table */}
      {!isLoading && !isError && history.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#2347C5]">
                  {["User", "Cycle", "Current Queue", "Position", "Status", "Joined", "Actions"].map((col) => (
                    <th key={col} className="text-left text-white text-xs font-semibold px-5 py-3.5 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {history.map((entry) => (
                  <tr key={entry._id} className="hover:bg-gray-50 transition-colors group">

                    {/* User */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        {entry.userId.avatar?.url ? (
                          <Image src={entry.userId.avatar.url} alt={entry.userId.name} className="w-8 h-8 rounded-full object-cover shrink-0" height={32} width={32} />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#2347C5] flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {entry.userId.name?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-gray-800 whitespace-nowrap">{entry.userId.name}</p>
                          <p className="text-xs text-gray-400">{entry.userId.phoneNumber}</p>
                        </div>
                      </div>
                    </td>

                    {/* Cycle */}
                    <td className="px-5 py-4 text-gray-600 text-xs whitespace-nowrap">
                      {entry.cycleId.name}
                    </td>

                    {/* Current Queue */}
                    <td className="px-5 py-4">
                      {entry.currentQueueId ? (
                        <div>
                          <p className="text-xs font-medium text-gray-700 whitespace-nowrap">
                            {entry.currentQueueId.name}
                          </p>
                          <p className="text-xs text-gray-400">{entry.currentQueueId.location}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">
                          {entry.cycleStatus === "completed" ? "Done" : "—"}
                        </span>
                      )}
                    </td>

                    {/* Position */}
                    <td className="px-5 py-4">
                      <span className={`text-sm font-bold ${entry.position > 0 ? "text-[#2347C5]" : "text-gray-400"}`}>
                        {entry.position > 0 ? `#${entry.position}` : "—"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <HistoryStatusBadge status={entry.cycleStatus} isOnWaitingList={entry.isOnWaitingList} />
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(entry.joinedAt).toLocaleDateString("en-US", {
                        day: "numeric", month: "short", year: "numeric"
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {entry.cycleStatus !== "completed" && entry.currentQueueId && (
                          <button
                            onClick={() => setConfirmAction({ type: "advance", entry })}
                            className="flex items-center gap-1 text-xs text-[#2347C5] font-semibold bg-[#EEF2FF] px-2.5 py-1.5 rounded-lg hover:bg-[#dbe4ff] transition-colors whitespace-nowrap"
                          >
                            <MdOutlineArrowForward size={13} /> Advance
                          </button>
                        )}
                        {entry.cycleStatus !== "completed" && (
                          <button
                            onClick={() => setConfirmAction({ type: "remove", entry })}
                            className="flex items-center gap-1 text-xs text-red-500 font-semibold bg-red-50 px-2.5 py-1.5 rounded-lg hover:bg-red-100 transition-colors whitespace-nowrap"
                          >
                            <MdOutlinePersonRemove size={13} /> Remove
                          </button>
                        )}
                        {entry.cycleStatus === "completed" && (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-5">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {confirmAction.type === "advance" ? "Advance User?" : "Remove User?"}
              </h3>
              <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">
                {confirmAction.type === "advance"
                  ? `Move ${confirmAction.entry.userId.name} from "${confirmAction.entry.currentQueueId?.name}" to the next queue step. This cannot be undone.`
                  : `Remove ${confirmAction.entry.userId.name} from "${confirmAction.entry.cycleId.name}" entirely. They will lose their position.`
                }
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={advancing || removing}
                onClick={() =>
                  confirmAction.type === "advance"
                    ? advanceUser(confirmAction.entry)
                    : removeUser(confirmAction.entry)
                }
                className={`flex-1 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60
                  ${confirmAction.type === "advance"
                    ? "bg-[#2347C5] hover:bg-[#1a38a8]"
                    : "bg-red-500 hover:bg-red-600"
                  }`}
              >
                {advancing || removing ? "Processing..." :
                  confirmAction.type === "advance" ? "Yes, Advance" : "Yes, Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

function HistoryStatCard({ label, value, icon, accent }: {
  label: string; value: number; icon: React.ReactNode; accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl ${accent} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}

function HistoryStatusBadge({ status, isOnWaitingList }: {
  status: CycleStatus; isOnWaitingList: boolean;
}) {
  if (isOnWaitingList) {
    return (
      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-600 border border-purple-200">
        Waiting List
      </span>
    )
  }
  const styles: Record<CycleStatus, string> = {
    waiting:    "bg-orange-50 text-orange-500 border border-orange-200",
    inprogress: "bg-blue-50 text-blue-600 border border-blue-200",
    completed:  "bg-green-50 text-green-600 border border-green-200",
  }
  const labels: Record<CycleStatus, string> = {
    waiting: "Waiting", inprogress: "In Progress", completed: "Completed",
  }
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}