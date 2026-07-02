"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  MdOutlineLocationOn,
  MdOutlineCalendarMonth,
  MdOutlineCheckCircle,
  MdOutlineHourglassTop,
  MdOutlinePlayCircle,
  MdOutlineFilterList,
} from "react-icons/md";
import { HiOutlineQueueList } from "react-icons/hi2";
import { BsArrowRight } from "react-icons/bs";

type CycleStatus = "waiting" | "inprogress" | "completed";

interface QueueRef {
  _id: string;
  name: string;
  location: string;
  order: number;
}

interface CycleRef {
  _id: string;
  name: string;
  description: string;
  schedule: { day: string; isActive: boolean; startTime: string; endTime: string }[];
}

interface HistoryEntry {
  _id: string;
  cycleId: CycleRef;
  currentQueueId: QueueRef | null;
  position: number;
  cycleStatus: CycleStatus;
  isOnWaitingList: boolean;
  completedQueues: QueueRef[];
  joinedAt: string;
  completedAt?: string;
}

interface Stats {
  total: number;
  waiting: number;
  inprogress: number;
  completed: number;
}

const fetchUserHistory = async (
  userId: string,
  status: string
): Promise<{ data: HistoryEntry[]; stats: Stats }> => {
  const params = new URLSearchParams({ userId })
  if (status !== "all") params.set("status", status)
  const res = await fetch(`/api/cycle/user/history?${params}`)
  const json = await res.json()
  if (!res.ok) throw new Error(json.message ?? "Failed to fetch history")
  return { data: json.data, stats: json.stats }
}

export default function UserHistoryPage() {
  const { data: session } = useSession()
  const userId = session?.user?._id as any
  const [status, setStatus] = useState<string>("all")

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["user-queue-history", userId, status],
    queryFn: () => fetchUserHistory(userId, status),
    enabled: !!userId,
    refetchInterval: 5000,
    staleTime: 4000,
  })

  const history = data?.data ?? []
  const stats   = data?.stats ?? { total: 0, waiting: 0, inprogress: 0, completed: 0 }

  return (
    <div className="flex flex-col gap-6 font-manrope">

      {/* ── My Queue Status cards ── */}
      <section>
        <h3 className="text-base font-semibold text-gray-800 mb-4">My Queue Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QueueStatusCard
            title="My Ticket (s)"
            description="Total cycles you have joined."
            value={isLoading ? "..." : stats.total}
            valueColor="bg-[#3DBFA0]"
          />
          <QueueStatusCard
            title="In Progress"
            description="Cycles you are currently active in."
            value={isLoading ? "..." : stats.inprogress}
            valueColor="bg-[#2347C5]"
          />
          <QueueStatusCard
            title="Completed"
            description="Cycles you have fully completed."
            value={isLoading ? "..." : stats.completed}
            valueColor="bg-[#F5A623]"
          />
        </div>
      </section>

      {/* ── Filter + Report ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <MdOutlineFilterList size={16} className="text-gray-400" />
          {(["all", "waiting", "inprogress", "completed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors
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

        <button className="sm:ml-auto flex items-center gap-2 bg-[#3DBFA0] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#2eaa8d] transition-colors">
          Queue Reports
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </button>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-800">Recent Queue</h3>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#3DBFA0] animate-pulse" />
            <span className="text-xs text-gray-400">Live</span>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col gap-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3">
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-100 rounded w-48" />
                  <div className="h-6 bg-gray-100 rounded-full w-20" />
                </div>
                <div className="h-3 bg-gray-100 rounded w-64" />
                <div className="h-3 bg-gray-100 rounded w-40" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
            <p className="text-sm text-red-600">{(error as Error)?.message}</p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && history.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <HiOutlineQueueList size={24} className="text-gray-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">No queue history yet</p>
              <p className="text-xs text-gray-400 mt-1">Join a cycle to get started</p>
            </div>
            <Link
              href="/user/join-cycle"
              className="text-sm text-[#2347C5] font-semibold hover:underline"
            >
              + Join a cycle
            </Link>
          </div>
        )}

        {/* History cards */}
        {!isLoading && !isError && history.length > 0 && (
          <div className="flex flex-col gap-3">
            {history.map((entry) => {
              const activeDays = entry.cycleId.schedule
                .filter((s) => s.isActive)
                .map((s) => s.day.slice(0, 3))

              return (
                <div
                  key={entry._id}
                  className={`bg-white rounded-2xl border p-5 flex flex-col gap-4 transition-all
                    ${entry.cycleStatus === "inprogress" && !entry.isOnWaitingList
                      ? "border-[#2347C5] shadow-sm shadow-blue-100"
                      : "border-gray-100"
                    }`}
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-gray-900 truncate">
                          {entry.cycleId.name}
                        </h3>
                        <HistoryStatusBadge
                          status={entry.cycleStatus}
                          isOnWaitingList={entry.isOnWaitingList}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1 leading-relaxed">
                        {entry.cycleId.description}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-400">Joined</p>
                      <p className="text-xs font-medium text-gray-600 mt-0.5">
                        {new Date(entry.joinedAt).toLocaleDateString("en-US", {
                          day: "numeric", month: "short"
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Current queue step */}
                  {entry.currentQueueId && entry.cycleStatus !== "completed" && (
                    <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                      entry.isOnWaitingList
                        ? "bg-purple-50 border border-purple-100"
                        : entry.cycleStatus === "inprogress"
                        ? "bg-[#f5f7ff] border border-[#e0e7ff]"
                        : "bg-orange-50 border border-orange-100"
                    }`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 text-white
                        ${entry.isOnWaitingList ? "bg-purple-400" :
                          entry.cycleStatus === "inprogress" ? "bg-[#2347C5]" : "bg-orange-400"}`}>
                        {entry.currentQueueId.order}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700 truncate">
                          {entry.currentQueueId.name}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MdOutlineLocationOn size={11} className="text-gray-400 shrink-0" />
                          <p className="text-xs text-gray-400 truncate">
                            {entry.currentQueueId.location}
                          </p>
                        </div>
                      </div>
                      {entry.position > 0 && (
                        <div className="text-right shrink-0">
                          <p className="text-xs text-gray-400">Position</p>
                          <p className={`text-lg font-bold ${
                            entry.isOnWaitingList ? "text-purple-500" :
                            entry.cycleStatus === "inprogress" ? "text-[#2347C5]" : "text-orange-500"
                          }`}>
                            #{entry.position}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Completed steps progress */}
                  {entry.completedQueues.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 mb-2">
                        {entry.completedQueues.length} step{entry.completedQueues.length !== 1 ? "s" : ""} completed
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {entry.completedQueues.map((q, i) => (
                          <div key={q._id} className="flex items-center gap-1.5">
                            <span className="text-xs bg-[#f0faf7] text-[#3DBFA0] border border-[#a7f3d0] px-2.5 py-1 rounded-lg font-medium">
                              ✓ {q.name}
                            </span>
                            {i < entry.completedQueues.length - 1 && (
                              <BsArrowRight size={10} className="text-gray-300" />
                            )}
                          </div>
                        ))}
                        {entry.currentQueueId && entry.cycleStatus !== "completed" && (
                          <>
                            <BsArrowRight size={10} className="text-gray-300" />
                            <span className="text-xs bg-[#f5f7ff] text-[#2347C5] border border-[#c7d2fe] px-2.5 py-1 rounded-lg font-medium">
                              → {entry.currentQueueId.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Completed state */}
                  {entry.cycleStatus === "completed" && (
                    <div className="flex items-center gap-2 bg-[#f0faf7] border border-[#a7f3d0] rounded-xl px-4 py-3">
                      <MdOutlineCheckCircle size={16} className="text-[#3DBFA0] shrink-0" />
                      <p className="text-xs text-[#3DBFA0] font-semibold">
                        Cycle completed
                        {entry.completedAt && ` · ${new Date(entry.completedAt).toLocaleDateString("en-US", {
                          day: "numeric", month: "short", year: "numeric"
                        })}`}
                      </p>
                    </div>
                  )}

                  {/* Schedule pills */}
                  {activeDays.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-gray-50">
                      <MdOutlineCalendarMonth size={12} className="text-gray-400" />
                      {activeDays.map((d) => (
                        <span key={d} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">
                          {d}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                    <p className="text-xs text-gray-400">
                      {stats.completed} steps done
                    </p>
                    <Link
                      href={`/user/history/detail/${entry._id}`}
                      className="text-xs text-[#2347C5] font-semibold hover:underline flex items-center gap-1"
                    >
                      View Details →
                    </Link>
                  </div>

                </div>
              )
            })}
          </div>
        )}
      </section>

    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function QueueStatusCard({ title, description, value, valueColor }: {
  title: string; description: string; value: number | string; valueColor: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 flex flex-col justify-between min-h-[160px]">
      <div>
        <p className="text-sm font-bold text-gray-900">{title}</p>
        <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-[65%]">{description}</p>
      </div>
      <div className={`${valueColor} text-white text-sm font-bold min-w-10 h-10 px-3 rounded-xl flex items-center justify-center mt-4 w-fit`}>
        {value}
      </div>
    </div>
  )
}

function HistoryStatusBadge({ status, isOnWaitingList }: {
  status: CycleStatus; isOnWaitingList: boolean;
}) {
  if (isOnWaitingList) {
    return (
      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-600 border border-purple-200">
        Waiting List
      </span>
    )
  }
  const map: Record<CycleStatus, { style: string; label: string }> = {
    waiting:    { style: "bg-orange-50 text-orange-500 border border-orange-200", label: "Waiting" },
    inprogress: { style: "bg-blue-50 text-blue-600 border border-blue-200",       label: "In Progress" },
    completed:  { style: "bg-green-50 text-green-600 border border-green-200",    label: "Completed" },
  }
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[status].style}`}>
      {map[status].label}
    </span>
  )
}