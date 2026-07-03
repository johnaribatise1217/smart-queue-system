"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { MdOutlineLocationOn, MdOutlineHourglassTop, MdOutlinePlayCircle } from "react-icons/md";
import { HiOutlineQueueList } from "react-icons/hi2";
import { BsArrowRight } from "react-icons/bs";
import Image from "next/image";

// ── Types

type CycleStatus = "waiting" | "inprogress" | "completed";

interface QueueETA {
  position: number
  avgProcessingMinutes: number
  estimatedMinutes: number
  estimatedTime: string
  aiSummary: string
  basedOnSamples: number
}

interface ActiveQueue {
  _id: string;
  cycleId: { _id: string; name: string; description: string };
  currentQueueId: { _id: string; name: string; location: string; order: number; maxUsers: number } | null;
  position: number;
  cycleStatus: CycleStatus;
  isOnWaitingList: boolean;
  completedQueues: { _id: string; name: string; order: number }[];
}

const fetchQueueETA = async (queueId: string, position: number): Promise<QueueETA> => {
  const res = await fetch(`/api/queue-point/eta?queueId=${queueId}&position=${position}`)
  const json = await res.json()
  if (!res.ok) throw new Error(json.message)
  return json.data
}

const fetchActiveQueue = async (userId: string): Promise<ActiveQueue | null> => {
  const res = await fetch(`/api/cycle/user/history/active?userId=${userId}`)
  const json = await res.json()
  if (!res.ok) throw new Error(json.message)
  return json.data
}

export default function UserDashboardPage() {
  const { data: session } = useSession()
  const userId = session?.user?._id as any

  const { data: active, isLoading } = useQuery({
    queryKey: ["user-active-queue", userId],
    queryFn: () => fetchActiveQueue(userId),
    enabled: !!userId,
    refetchInterval: 5000,
    staleTime: 4000,
  })

  const hasActive  = !!active
  const tickets    = hasActive ? 1 : 0
  const position   = active?.position ?? 0
  const eta        = position > 1 ? `~${(position - 1) * 5}m` : hasActive ? "Soon" : 0

  const queueId = active?.currentQueueId?._id

  const { data: etaData, isLoading: etaLoading } = useQuery({
    queryKey: ["queue-point-eta", queueId, position],
    queryFn: () => fetchQueueETA(queueId!, position),
    enabled: !!queueId && position > 0,
    staleTime: 5000,
  })

  const etaLabel = etaData?.estimatedTime ?? (position > 1 ? `${(position - 1) * 5}m` : hasActive ? "Soon" : "0")
  const aiSummary = etaData?.aiSummary ?? "Calculating queue summary..."

  return (
    <div className="flex flex-col gap-8 font-manrope">

      {/* ── Hero ── */}
      <div className="relative w-full rounded-2xl bg-[#EAF6FE] overflow-hidden min-h-55 flex items-center">
        <div className="relative z-10 px-8 py-12 max-w-lg">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
            Monitor Your{" "}
            <span className="text-[#2347C5]">Queue Time</span>{" "}
            Anywhere, Anytime
          </h2>
          <p className="text-sm text-gray-500 mt-3 leading-relaxed">
            Don&apos;t just stand aimlessly, know when it&apos;s time to submit the document
          </p>
          <Link
            href="/user/join-cycle"
            className="mt-6 inline-flex items-center gap-2 bg-[#2347C5] text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#1a38a8] transition-colors"
          >
            Join a Cycle
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <div className="absolute right-0 bottom-0 top-0 w-[45%] hidden sm:flex items-end justify-end">
          <Image
            src="/images/queue-hero.png"
            alt="Queue illustration"
            className="h-full object-contain object-bottom-right"
            height={40} width={40}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
          />
        </div>
      </div>

      {/* ── My Queue Status ── */}
      <section>
        <h3 className="text-base font-semibold text-gray-800 mb-4">My Queue Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QueueStatusCard
            title="My Ticket (s)"
            description="Your digital description in the queue."
            value={isLoading ? "..." : tickets}
            valueColor="bg-[#3DBFA0]"
          />
          <QueueStatusCard
            title="My Position"
            description="Your digital place in the queue."
            value={isLoading ? "..." : position > 0 ? `#${position}` : 0}
            valueColor="bg-[#2347C5]"
          />
          <QueueStatusCard
            title="ETA to Turn"
            description="Your estimated time to be attended to"
            value={isLoading ? "..." : etaLabel}
            valueColor="bg-[#F5A623]"
          />
        </div>

        <p>{etaLabel}</p>
        {etaData?.aiSummary && (
          <p className="text-sm text-gray-500">{aiSummary}</p>
        )}

        {/* Active cycle strip */}
        {!isLoading && active && (
          <div className={`mt-3 flex items-center gap-3 rounded-xl px-4 py-3 border transition-all
            ${active.isOnWaitingList
              ? "bg-purple-50 border-purple-100"
              : active.cycleStatus === "inprogress"
              ? "bg-[#f5f7ff] border-[#e0e7ff]"
              : "bg-orange-50 border-orange-100"
            }`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
              ${active.isOnWaitingList ? "bg-purple-400" :
                active.cycleStatus === "inprogress" ? "bg-[#2347C5]" : "bg-orange-400"}`}>
              {active.isOnWaitingList
                ? <MdOutlineHourglassTop size={16} className="text-white" />
                : active.cycleStatus === "inprogress"
                ? <MdOutlinePlayCircle size={16} className="text-white" />
                : <MdOutlineHourglassTop size={16} className="text-white" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-700 truncate">
                {active.cycleId.name}
                {active.isOnWaitingList && (
                  <span className="ml-1.5 text-purple-500 font-normal">— on waiting list</span>
                )}
              </p>
              {active.currentQueueId && (
                <div className="flex items-center gap-1 mt-0.5">
                  <MdOutlineLocationOn size={11} className="text-gray-400 shrink-0" />
                  <p className="text-xs text-gray-400 truncate">
                    {active.currentQueueId.name} · {active.currentQueueId.location}
                  </p>
                </div>
              )}
            </div>
            <Link
              href="/user/history"
              className="text-xs text-[#2347C5] font-semibold hover:underline shrink-0"
            >
              View →
            </Link>
          </div>
        )}

        {/* No active queue nudge */}
        {!isLoading && !active && (
          <div className="mt-3 flex items-center gap-3 rounded-xl px-4 py-3 border border-dashed border-gray-200 bg-white">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <HiOutlineQueueList size={16} className="text-gray-400" />
            </div>
            <p className="text-xs text-gray-400 flex-1">You are not in any active queue.</p>
            <Link href="/user/join-cycle" className="text-xs text-[#2347C5] font-semibold hover:underline shrink-0">
              Join one →
            </Link>
          </div>
        )}
      </section>

      {/* ── Completed queues progress (if active) ── */}
      {!isLoading && active && active.completedQueues.length > 0 && (
        <section>
          <h3 className="text-base font-semibold text-gray-800 mb-4">Your Progress</h3>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs text-gray-400 mb-3">
              {active.completedQueues.length} queue step{active.completedQueues.length !== 1 ? "s" : ""} completed in <span className="font-medium text-gray-600">{active.cycleId.name}</span>
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {active.completedQueues.map((q, i) => (
                <div key={q._id} className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs bg-[#f0faf7] text-[#3DBFA0] border border-[#a7f3d0] px-3 py-1.5 rounded-lg font-medium">
                    ✓ {q.name}
                  </span>
                  {i < active.completedQueues.length - 1 && (
                    <BsArrowRight size={12} className="text-gray-300 shrink-0" />
                  )}
                </div>
              ))}
              {active.currentQueueId && (
                <>
                  <BsArrowRight size={12} className="text-gray-300 shrink-0" />
                  <span className="inline-flex items-center gap-1.5 text-xs bg-[#f5f7ff] text-[#2347C5] border border-[#c7d2fe] px-3 py-1.5 rounded-lg font-medium">
                    → {active.currentQueueId.name}
                  </span>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Quick actions ── */}
      <section>
        <h3 className="text-base font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Link
            href="/user/join-cycle"
            className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-[#3DBFA0] hover:shadow-sm transition-all group flex flex-col gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center group-hover:bg-[#3DBFA0]/10 transition-colors">
              <HiOutlineQueueList size={20} className="text-[#2347C5]" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Join a Cycle</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">Scan QR or enter a cycle code</p>
            </div>
          </Link>
          <Link
            href="/user/history"
            className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-[#3DBFA0] hover:shadow-sm transition-all group flex flex-col gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-[#f0faf7] flex items-center justify-center group-hover:bg-[#3DBFA0]/10 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3DBFA0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" /><path d="M12 7v5l4 2" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Queue History</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">View your past and active queues</p>
            </div>
          </Link>
          <Link
            href="/user/tickets"
            className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-[#3DBFA0] hover:shadow-sm transition-all group flex flex-col gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center group-hover:bg-[#3DBFA0]/10 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">My Tickets</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">View your queue tickets</p>
            </div>
          </Link>
        </div>
      </section>

    </div>
  )
}

// ── Sub-components

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