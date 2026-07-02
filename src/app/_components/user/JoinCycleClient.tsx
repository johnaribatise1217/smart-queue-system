/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import {
  MdOutlineLocationOn,
  MdOutlineCalendarMonth,
  MdOutlinePeople,
  MdOutlineQrCodeScanner,
  MdOutlineKeyboard,
  MdOutlineCheckCircle,
  MdOutlineAccessTime,
  MdOutlineUploadFile,
  MdOutlineArticle,
  MdOutlineArrowBack,
  MdOutlineBusiness,
} from "react-icons/md";
import { HiOutlineQueueList } from "react-icons/hi2";
import { BsArrowDown } from "react-icons/bs";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Deliverable {
  name: string;
  description: string;
  type: "hardcopy" | "uploadable";
  required: boolean;
  acceptedFormats?: string[];
}

interface QueueStep {
  _id: string;
  name: string;
  description: string;
  location: string;
  maxUsers: number;
  deliverables: Deliverable[];
  order: number;
  isActive: boolean;
}

interface ScheduleDay {
  day: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface CycleData {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  queues: QueueStep[];
  schedule: ScheduleDay[];
  maxUsers: number;
  cycleCode: string;
  adminId: string;
}

interface BusinessData {
  _id: string;
  name: string;
  businessName: string;
  businessAddress: string;
  email: string;
}

interface CycleResponse {
  cycle: CycleData;
  business: BusinessData;
}

interface OtherCycle {
  _id: string;
  name: string;
  description: string;
  maxUsers: number;
  cycleCode: string;
  schedule: ScheduleDay[];
}

// ── API ───────────────────────────────────────────────────────────────────────

const fetchByQRParams = async (adminId: string, cycleId: string): Promise<CycleResponse> => {
  const res = await fetch(`/api/cycle/user/join?adminId=${adminId}&cycleId=${cycleId}`)
  const json = await res.json()
  if (!res.ok) throw new Error(json.message ?? "Cycle not found")
  return json.data
}

const fetchByCycleCode = async (code: string): Promise<CycleResponse> => {
  const res = await fetch(`/api/cycle/user/details?cycleCode=${code.toUpperCase()}`)
  const json = await res.json()
  if (!res.ok) throw new Error(json.message ?? "Cycle not found")
  return json.data
}

const fetchBusinessCycles = async (adminId: string): Promise<{ cycles: OtherCycle[]; business: BusinessData }> => {
  const res = await fetch(`/api/cycle/user/business?adminId=${adminId}`)
  const json = await res.json()
  if (!res.ok) throw new Error(json.message)
  return json.data
}

export default function JoinCycleClient() {
  const searchParams  = useSearchParams()
  const router        = useRouter()
  const { data: session } = useSession()
  const userId        = session?.user?._id as any

  const adminIdParam = searchParams.get("adminId")
  const cycleIdParam = searchParams.get("cycleId")
  const hasQRParams  = !!(adminIdParam && cycleIdParam)

  const [mode, setMode] = useState<"qr" | "code">("code")
  const [codeInput, setCodeInput]     = useState("")
  const [codeError, setCodeError]     = useState("")
  const [resolvedData, setResolvedData] = useState<CycleResponse | null>(null)
  const [showOtherCycles, setShowOtherCycles] = useState(false)
  const [joinSuccess, setJoinSuccess] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)

  const { data: qrData, isLoading: qrLoading, error: qrError } = useQuery({
    queryKey: ["join-cycle-qr", adminIdParam, cycleIdParam],
    queryFn: () => fetchByQRParams(adminIdParam!, cycleIdParam!),
    enabled: hasQRParams,
  })

  useEffect(() => {
    if (qrData) setResolvedData(qrData)
  }, [qrData])

  const adminId = resolvedData?.cycle?.adminId ?? adminIdParam ?? ""

  const { data: businessData, isLoading: businessLoading } = useQuery({
    queryKey: ["business-cycles", adminId],
    queryFn: () => fetchBusinessCycles(adminId),
    enabled: !!adminId && showOtherCycles,
  })

  const handleCodeSubmit = async () => {
    if (!codeInput.trim()) { setCodeError("Please enter a cycle code"); return }
    const formatted = codeInput.trim().toUpperCase()
    if (!/^SMQ\d{4}$/.test(formatted)) {
      setCodeError("Invalid format — should be like SMQ1234")
      return
    }
    setCodeError("")
    setSearchLoading(true)
    try {
      const data = await fetchByCycleCode(formatted)
      setResolvedData(data)
    } catch (err: any) {
      setCodeError(err.message ?? "Cycle not found")
    } finally {
      setSearchLoading(false)
    }
  }

  // ── Join mutation ─────────────────────────────────────────────────────────
  const { mutate: joinCycle, isPending: joining, error: joinError } = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/cycle/user/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, cycleId: resolvedData!.cycle._id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? "Failed to join cycle")
      return json
    },
    onSuccess: () => {
      setJoinSuccess(true)
      setTimeout(() => router.push("/user/history"), 2500)
    },
  })

  const cycle           = resolvedData?.cycle
  const business        = resolvedData?.business
  const activeSchedule  = cycle?.schedule.filter((s) => s.isActive) ?? []

  // ── Render: code entry ────────────────────────────────────────────────────
  if (mode === "code" && !hasQRParams && !cycle && !business) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 font-manrope">
        <div className="w-full max-w-md">

          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-[#3DBFA0] flex items-center justify-center">
              <HiOutlineQueueList size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">Queue</span>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-8 flex flex-col gap-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Join a Cycle</h1>
              <p className="text-sm text-gray-400 mt-1.5">
                Enter a cycle code or scan a QR code to get started.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode("code")}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-[#2347C5] bg-[#f5f7ff] transition-all"
              >
                <MdOutlineKeyboard size={22} className="text-[#2347C5]" />
                <span className="text-xs font-semibold text-[#2347C5]">Enter Code</span>
              </button>
              <button
                onClick={() => setMode("qr")}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 bg-white transition-all"
              >
                <MdOutlineQrCodeScanner size={22} className="text-gray-500" />
                <span className="text-xs font-semibold text-gray-500">Scan QR</span>
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-gray-500">Cycle Code</label>
              <div className="flex gap-2">
                <div className={`flex-1 flex items-center border rounded-xl px-4 gap-2 transition-colors
                  ${codeError ? "border-red-400" : "border-gray-200 focus-within:border-[#2347C5]"}`}>
                  <span className="text-sm font-bold text-gray-400">SMQ</span>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="1234"
                    value={codeInput.replace(/^SMQ/i, "")}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 4)
                      setCodeInput(`SMQ${digits}`)
                      setCodeError("")
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleCodeSubmit()}
                    className="flex-1 py-3.5 text-sm outline-none bg-transparent placeholder:text-gray-300 font-mono tracking-widest"
                  />
                </div>
                <button
                  onClick={handleCodeSubmit}
                  disabled={searchLoading}
                  className="bg-[#2347C5] text-white text-sm font-semibold px-5 rounded-xl hover:bg-[#1a38a8] transition-colors disabled:opacity-60"
                >
                  {searchLoading ? "..." : "Find"}
                </button>
              </div>
              {codeError && <p className="text-red-500 text-xs">{codeError}</p>}
              <p className="text-xs text-gray-400">Format: SMQ followed by 4 digits, e.g. SMQ1234</p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Already in a cycle?{" "}
            <Link href="/user/history" className="text-[#2347C5] font-semibold hover:underline">
              View your history
            </Link>
          </p>
        </div>
      </div>
    )
  }

  // ── Render: QR scanner ────────────────────────────────────────────────────
  if (mode === "qr" && !cycle && !business) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 font-manrope">
        <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 p-8 flex flex-col gap-6">
          <button onClick={() => setMode("code")} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 w-fit">
            <MdOutlineArrowBack size={16} /> Back
          </button>
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-900">Scan QR Code</h2>
            <p className="text-xs text-gray-400 mt-1">Point your camera at the admin's QR code</p>
          </div>
          <div className="w-full aspect-square bg-gray-100 rounded-2xl flex flex-col items-center justify-center gap-4 border-2 border-dashed border-gray-200">
            <MdOutlineQrCodeScanner size={48} className="text-gray-300" />
            <p className="text-xs text-gray-400 text-center max-w-[200px]">
              Use your phone's camera app to scan the QR code — it will open this page automatically
            </p>
          </div>
          <p className="text-center text-xs text-gray-400">
            Or{" "}
            <button onClick={() => setMode("code")} className="text-[#2347C5] font-semibold">
              enter a cycle code manually
            </button>
          </p>
        </div>
      </div>
    )
  }

  // ── Render: loading ───────────────────────────────────────────────────────
  if (hasQRParams && qrLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 font-manrope">
        <div className="w-full max-w-lg flex flex-col gap-4 animate-pulse">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="h-5 bg-gray-100 rounded w-48 mb-3" />
            <div className="h-3 bg-gray-100 rounded w-64 mb-1.5" />
            <div className="h-3 bg-gray-100 rounded w-40" />
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 h-48" />
          <div className="bg-white rounded-2xl border border-gray-100 p-6 h-32" />
        </div>
      </div>
    )
  }

  if (qrError && hasQRParams) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 font-manrope">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-sm w-full flex flex-col items-center gap-5 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
            <HiOutlineQueueList size={24} className="text-red-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Cycle not found</h2>
            <p className="text-xs text-gray-400 mt-1">{(qrError as Error).message}</p>
          </div>
          <button
            onClick={() => { setMode("code"); router.replace("/user/join-cycle") }}
            className="w-full bg-[#2347C5] text-white text-sm font-semibold py-3 rounded-xl hover:bg-[#1a38a8] transition-colors"
          >
            Try a cycle code instead
          </button>
        </div>
      </div>
    )
  }

  if (joinSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 font-manrope">
        <div className="bg-white rounded-2xl border border-gray-100 p-10 max-w-sm w-full flex flex-col items-center gap-5 text-center">
          <div className="w-16 h-16 rounded-full bg-[#f0faf7] flex items-center justify-center">
            <MdOutlineCheckCircle size={32} className="text-[#3DBFA0]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">You're in!</h2>
            <p className="text-sm text-gray-400 mt-1">
              Successfully joined <span className="font-semibold text-gray-700">{cycle?.name}</span>
            </p>
          </div>
          <p className="text-xs text-gray-400">Redirecting to your queue history...</p>
        </div>
      </div>
    )
  }

  if (!cycle || !business) return null

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 font-manrope">
      <div className="max-w-lg mx-auto flex flex-col gap-5">

        <button
          onClick={() => {setResolvedData(null); router.replace("/join-cycle") }}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 w-fit"
        >
          <MdOutlineArrowBack size={16} /> Back
        </button>

        {/* Business card */}
        <div className="bg-[#2347C5] rounded-2xl p-6 text-white">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <MdOutlineBusiness size={22} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-blue-200 font-medium">Business</p>
              <h2 className="text-lg font-bold mt-0.5">{business.businessName ?? business.name}</h2>
              {business.businessAddress && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <MdOutlineLocationOn size={13} className="text-blue-200 shrink-0" />
                  <p className="text-xs text-blue-200">{business.businessAddress}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cycle info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-gray-900">{cycle.name}</h3>
            <span className="text-xs font-mono bg-[#EEF2FF] text-[#2347C5] px-2 py-0.5 rounded-lg font-semibold">
              {cycle.cycleCode}
            </span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed -mt-2">{cycle.description}</p>

          {/* Stats — only what we have */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
              <p className="text-xs text-gray-400">Queue Steps</p>
              <p className="text-lg font-bold text-gray-900">{cycle.queues.length}</p>
            </div>
            <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
              <p className="text-xs text-gray-400">Max Capacity</p>
              <div className="flex items-center justify-center gap-1">
                <MdOutlinePeople size={14} className="text-[#3DBFA0]" />
                <p className="text-lg font-bold text-gray-900">{cycle.maxUsers}</p>
              </div>
            </div>
          </div>

          {/* Schedule */}
          {activeSchedule.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-gray-500">Schedule</p>
              {activeSchedule.map((s) => (
                <div
                  key={s.day}
                  className="flex items-center justify-between bg-[#f5f7ff] border border-[#e0e7ff] rounded-xl px-4 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <MdOutlineCalendarMonth size={13} className="text-[#2347C5]" />
                    <span className="text-sm font-medium text-gray-700">{s.day}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <MdOutlineAccessTime size={12} className="text-gray-400" />
                    {s.startTime} — {s.endTime}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Queue flow */}
        {cycle.queues.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Queue Flow</h3>
              <p className="text-xs text-gray-400 mt-0.5">Steps you'll go through in this cycle</p>
            </div>
            <div className="flex flex-col">
              {cycle.queues.map((q, i) => (
                <div key={q._id} className="flex flex-col items-start">
                  <div className="flex items-start gap-3 w-full p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="w-8 h-8 rounded-lg bg-[#2347C5] text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{q.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MdOutlineLocationOn size={11} className="text-gray-400" />
                        <p className="text-xs text-gray-400">{q.location}</p>
                      </div>
                      {q.deliverables.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap mt-2">
                          {q.deliverables.map((d, di) => (
                            <span
                              key={di}
                              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-medium ${
                                d.type === "uploadable"
                                  ? "bg-[#EEF2FF] text-[#2347C5]"
                                  : "bg-[#f0faf7] text-[#3DBFA0]"
                              }`}
                            >
                              {d.type === "uploadable"
                                ? <MdOutlineUploadFile size={11} />
                                : <MdOutlineArticle size={11} />
                              }
                              {d.name}{d.required && " *"}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* max users per queue point — still available */}
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-400">Max</p>
                      <p className="text-xs font-semibold text-gray-600">{q.maxUsers}</p>
                    </div>
                  </div>
                  {i < cycle.queues.length - 1 && (
                    <div className="flex flex-col items-center self-center py-1">
                      <div className="w-px h-3 bg-gray-200" />
                      <BsArrowDown size={11} className="text-gray-300" />
                      <div className="w-px h-3 bg-gray-200" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Join error */}
        {joinError && (
          <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
            </svg>
            <p className="text-xs text-red-600">{(joinError as Error).message}</p>
          </div>
        )}

        {/* Join button */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => joinCycle()}
            disabled={joining || !userId}
            className="w-full bg-[#2347C5] text-white text-sm font-semibold py-4 rounded-xl hover:bg-[#1a38a8] active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {joining ? "Joining..." : "Join Cycle"}
          </button>

          {!userId && (
            <p className="text-center text-xs text-gray-400">
              <Link href="/login" className="text-[#2347C5] font-semibold">Sign in</Link>{" "}
              to join this cycle
            </p>
          )}
        </div>

        {/* Other cycles */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <button
            onClick={() => setShowOtherCycles(!showOtherCycles)}
            className="w-full flex items-center justify-between text-left"
          >
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Other cycles from {business.businessName ?? business.name}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Browse more queues from this business</p>
            </div>
            <span className={`text-[#2347C5] text-xs font-semibold transition-transform duration-200 inline-block ${showOtherCycles ? "rotate-180" : ""}`}>
              ▼
            </span>
          </button>

          {showOtherCycles && (
            <div className="mt-4 flex flex-col gap-2">
              {businessLoading ? (
                <div className="flex flex-col gap-2 animate-pulse">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded-xl" />
                  ))}
                </div>
              ) : (
                <>
                  {(businessData?.cycles ?? [])
                    .filter((c) => c._id !== cycle._id)
                    .map((c) => (
                      <Link
                        key={c._id}
                        href={`/user/join-cycle?adminId=${adminId}&cycleId=${c._id}`}
                        className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-[#2347C5] hover:bg-[#f5f7ff] transition-all group"
                      >
                        <div>
                          <p className="text-sm font-semibold text-gray-800 group-hover:text-[#2347C5]">
                            {c.name}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Max {c.maxUsers} users · {c.cycleCode}
                          </p>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-[#2347C5]">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </Link>
                    ))}
                  {(businessData?.cycles ?? []).filter((c) => c._id !== cycle._id).length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">
                      No other active cycles from this business
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}