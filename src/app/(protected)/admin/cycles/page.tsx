"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MdOutlineAdd,
  MdOutlinePeople,
  MdOutlineCalendarMonth,
  MdOutlineMoreVert,
  MdOutlineToggleOn,
  MdOutlineToggleOff,
  MdOutlineEdit,
} from "react-icons/md";
import { HiOutlineQueueList } from "react-icons/hi2";
import { errorToast, successToast } from "@/utils/toast";

interface ScheduleDay {
  day: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface CycleCard {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  queues: string[];
  enrolledUsers: string[];
  waitingList: string[];
  maxUsers: number;
  schedule: ScheduleDay[];
  createdAt: string;
}

const fetchAdminCycles = async (adminId: any): Promise<CycleCard[]> => {
  const res = await fetch(`/api/cycle/admin?adminId=${adminId}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? "Failed to fetch cycles")
  return data.data
}

const toggleCycleActive = async ({
  cycleId,
  isActive,
  adminId
}: {
  cycleId: string;
  isActive: boolean;
  adminId: any;
}) => {
  const res = await fetch(`/api/cycle/admin/${cycleId}?adminId=${adminId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive }),
  })
  const data = await res.json()
  if (!res.ok) {
    errorToast(data.message ?? "Failed to update cycle status")
    throw new Error(data.message ?? "Failed to update cycle")
  }

  successToast(`Cycle ${isActive ? "activated" : "deactivated"} successfully`)

  return data
}


export default function CyclesPage() {
  const { data: session } = useSession()
  const adminId = session?.user?._id
  const queryClient = useQueryClient()

  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all")
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const {
    data: cycles = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin-cycles", adminId],
    queryFn: () => fetchAdminCycles(adminId),
    enabled: !!adminId,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    staleTime: 6000,

  })

  const { mutate: toggleStatus } = useMutation({
    mutationFn: toggleCycleActive,
    // optimistic update
    onMutate: async ({ cycleId, isActive }) => {
      await queryClient.cancelQueries({ queryKey: ["admin-cycles", adminId] })
      const previous = queryClient.getQueryData<CycleCard[]>(["admin-cycles", adminId])
      queryClient.setQueryData<CycleCard[]>(["admin-cycles", adminId], (old = []) =>
        old.map((c) => c._id === cycleId ? { ...c, isActive } : c)
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      // rollback on failure
      queryClient.setQueryData(["admin-cycles", adminId], context?.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cycles", adminId] })
    },
  })

  const filtered = filter === "all"
    ? cycles
    : cycles.filter((c) => (filter === "active" ? c.isActive : !c.isActive))

  const activeCount   = cycles.filter((c) => c.isActive).length
  const inactiveCount = cycles.filter((c) => !c.isActive).length

  const getActiveDays = (schedule: ScheduleDay[]) =>
    schedule.filter((s) => s.isActive).map((s) => s.day)

  return (
    <div className="font-manrope flex flex-col gap-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cycles</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage all your queue cycles</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#3DBFA0] animate-pulse" />
            <span className="text-xs text-gray-400">Live</span>
          </div>
          <Link
            href="/admin/create-cycle"
            className="inline-flex items-center gap-2 bg-[#2347C5] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#1a38a8] transition-colors"
          >
            <MdOutlineAdd size={18} />
            Create Cycle
          </Link>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "active", "inactive"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-colors
              ${filter === f
                ? "bg-[#2347C5] text-white"
                : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
          >
            {f === "all"
              ? `All (${cycles.length})`
              : f === "active"
              ? `Active (${activeCount})`
              : `Inactive (${inactiveCount})`}
          </button>
        ))}
      </div>

      {/* ── Loading state ── */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4 animate-pulse">
              <div className="flex gap-3">
                <div className="flex-1">
                  <div className="h-4 bg-gray-100 rounded-lg w-3/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded-lg w-full" />
                  <div className="h-3 bg-gray-100 rounded-lg w-2/3 mt-1" />
                </div>
                <div className="w-8 h-8 bg-gray-100 rounded-lg shrink-0" />
              </div>
              <div className="flex gap-4">
                <div className="h-3 bg-gray-100 rounded w-20" />
                <div className="h-3 bg-gray-100 rounded w-20" />
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full w-full" />
              <div className="flex gap-1">
                {[1, 2, 3].map((d) => (
                  <div key={d} className="h-5 w-10 bg-gray-100 rounded-md" />
                ))}
              </div>
              <div className="h-9 bg-gray-100 rounded-xl w-full" />
            </div>
          ))}
        </div>
      )}

      {/* ── Error state ── */}
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-center gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
          </svg>
          <p className="text-sm text-red-600">
            {(error as Error)?.message ?? "Failed to load cycles"}
          </p>
        </div>
      )}

      {/* ── Empty state ── */}
      {!isLoading && !isError && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center py-20 gap-4">
          <HiOutlineQueueList size={36} className="text-gray-300" />
          <p className="text-sm text-gray-400">
            {filter === "all" ? "No cycles yet" : `No ${filter} cycles`}
          </p>
          {filter === "all" && (
            <Link
              href="/admin/create-cycle"
              className="inline-flex items-center gap-2 bg-[#2347C5] text-white text-xs font-semibold px-4 py-2 rounded-xl"
            >
              <MdOutlineAdd size={14} /> Create one
            </Link>
          )}
        </div>
      )}

      {/* ── Cycle cards ── */}
      {!isLoading && !isError && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((cycle) => {
            const activeDays = getActiveDays(cycle.schedule)
            const enrolledCount = cycle.enrolledUsers.length
            const capacityPct = Math.round((enrolledCount / cycle.maxUsers) * 100)

            return (
              <div
                key={cycle._id}
                className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4 hover:shadow-sm transition-shadow relative"
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-gray-900 truncate">{cycle.name}</h3>
                      <CycleStatusBadge isActive={cycle.isActive} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-2">
                      {cycle.description}
                    </p>
                  </div>

                  {/* Context menu */}
                  <div className="relative shrink-0">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === cycle._id ? null : cycle._id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
                    >
                      <MdOutlineMoreVert size={18} />
                    </button>
                    {openMenuId === cycle._id && (
                      <div className="absolute right-0 top-9 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-20 min-w-[160px]">
                        <Link
                          href={`/admin/edit-cycle/${cycle._id}`}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                          onClick={() => setOpenMenuId(null)}
                        >
                          <MdOutlineEdit size={14} /> Edit Cycle
                        </Link>
                        <button
                          onClick={() => {
                            toggleStatus({ cycleId: cycle._id, isActive: !cycle.isActive, adminId: adminId! })
                            setOpenMenuId(null)
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors text-left"
                        >
                          {cycle.isActive
                            ? <><MdOutlineToggleOff size={14} /> Deactivate</>
                            : <><MdOutlineToggleOn size={14} className="text-[#3DBFA0]" /> Activate</>
                          }
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <HiOutlineQueueList size={14} className="text-[#2347C5]" />
                    {cycle.queues.length} queue{cycle.queues.length !== 1 ? "s" : ""}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <MdOutlinePeople size={14} className="text-[#3DBFA0]" />
                    {enrolledCount}/{cycle.maxUsers} users
                  </div>
                  {cycle.waitingList.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-orange-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                      {cycle.waitingList.length} waiting
                    </div>
                  )}
                </div>

                {/* Capacity progress bar */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">Capacity</span>
                    <span className="text-xs font-medium text-gray-600">{capacityPct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        capacityPct > 80 ? "bg-red-400" :
                        capacityPct > 50 ? "bg-orange-400" : "bg-[#3DBFA0]"
                      }`}
                      style={{ width: `${Math.min(capacityPct, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Schedule days */}
                {activeDays.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <MdOutlineCalendarMonth size={13} className="text-gray-400" />
                    {activeDays.map((d) => (
                      <span key={d} className="text-xs bg-[#EEF2FF] text-[#2347C5] font-medium px-2 py-0.5 rounded-md">
                        {d.slice(0, 3)}
                      </span>
                    ))}
                  </div>
                )}

                {/* View details */}
                <Link
                  href={`/admin/cycles/${cycle._id}`}
                  className="flex items-center justify-center gap-2 w-full border border-gray-200 text-gray-600 text-xs font-semibold py-2.5 rounded-xl hover:bg-gray-50 hover:border-[#2347C5] hover:text-[#2347C5] transition-all mt-auto"
                >
                  View Details →
                </Link>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}

function CycleStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
      isActive
        ? "bg-green-50 text-green-600 border border-green-200"
        : "bg-orange-50 text-orange-500 border border-orange-200"
    }`}>
      {isActive ? "Active" : "Inactive"}
    </span>
  )
}