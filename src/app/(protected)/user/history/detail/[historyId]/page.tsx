"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  MdOutlineArrowBack, MdOutlineLocationOn, MdOutlineCheckCircle,
  MdOutlineUploadFile, MdOutlineArticle, MdOutlineCalendarMonth, MdOutlineAccessTime,
} from "react-icons/md";
import { HiOutlineQueueList } from "react-icons/hi2";
import { BsArrowDown } from "react-icons/bs";
import DeliverableUpload from "@/app/_components/user/DeliveryUpload";
import { useSession } from "next-auth/react";

export default function UserCycleDetailPage() {
  const { historyId } = useParams<{ historyId: string }>()
  const router = useRouter()
  const { data: session } = useSession()

  const { data, isLoading, isError } = useQuery({
    queryKey: ["user-cycle-detail", historyId],
    queryFn: async () => {
      const res = await fetch(`/api/cycle/user/history/detail?historyId=${historyId}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.message)
      return json.data
    },
    refetchInterval: 10000,
    staleTime: 8000,
  })

  if (isLoading) {
    return (
      <div className="font-manrope flex flex-col gap-5 animate-pulse">
        <div className="h-8 bg-gray-100 rounded-xl w-48" />
        <div className="bg-white rounded-2xl border border-gray-100 p-6 h-40" />
        <div className="bg-white rounded-2xl border border-gray-100 p-6 h-64" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="font-manrope flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-sm text-gray-400">Could not load cycle details</p>
        <button onClick={() => router.back()} className="text-sm text-[#2347C5] font-semibold hover:underline">
          ← Go back
        </button>
      </div>
    )
  }

  const cycle    = data.cycleId
  const queues   = cycle.queues ?? []
  const current  = data.currentQueueId
  const completed = data.completedQueues ?? []
  const completedIds = completed.map((q: any) => q._id)
  const activeSchedule = cycle.schedule?.filter((s: any) => s.isActive) ?? []

  return (
    <div className="font-manrope flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <MdOutlineArrowBack size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{cycle.name}</h1>
          <p className="text-xs text-gray-400 mt-0.5">{cycle.description}</p>
        </div>
        <span className="ml-auto text-xs font-mono bg-[#EEF2FF] text-[#2347C5] px-2.5 py-1 rounded-lg font-semibold">
          {cycle.cycleCode}
        </span>
      </div>

      {/* Your status strip */}
      <div className={`flex items-center gap-3 rounded-xl px-4 py-3 border
        ${data.cycleStatus === "completed"
          ? "bg-[#f0faf7] border-[#a7f3d0]"
          : data.cycleStatus === "inprogress"
          ? "bg-[#f5f7ff] border-[#e0e7ff]"
          : "bg-orange-50 border-orange-100"
        }`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
          ${data.cycleStatus === "completed" ? "bg-[#3DBFA0]" :
            data.cycleStatus === "inprogress" ? "bg-[#2347C5]" : "bg-orange-400"}`}>
          {data.cycleStatus === "completed"
            ? <MdOutlineCheckCircle size={16} className="text-white" />
            : <HiOutlineQueueList size={16} className="text-white" />
          }
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-700">
            {data.cycleStatus === "completed"
              ? "You have completed this cycle"
              : data.isOnWaitingList
              ? "You are on the waiting list"
              : `Currently at: ${current?.name ?? "—"}`
            }
          </p>
          {data.position > 0 && data.cycleStatus !== "completed" && (
            <p className="text-xs text-gray-400 mt-0.5">Position #{data.position}</p>
          )}
        </div>
      </div>

      {/* Schedule */}
      {activeSchedule.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-gray-800">Schedule</h2>
          {activeSchedule.map((s: any) => (
            <div key={s.day} className="flex items-center justify-between bg-[#f5f7ff] border border-[#e0e7ff] rounded-xl px-4 py-2.5">
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

      {/* Queue flow — full details */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-gray-800">Queue Steps</h2>
        <div className="flex flex-col">
          {queues.map((q: any, i: number) => {
            const isDone    = completedIds.includes(q._id)
            const isCurrent = current?._id === q._id
            const isPending = !isDone && !isCurrent

            return (
              <div key={q._id} className="flex flex-col items-start">
                <div className={`w-full flex items-start gap-3 p-4 rounded-xl border transition-all
                  ${isDone    ? "border-[#a7f3d0] bg-[#f0faf7]" :
                    isCurrent ? "border-[#2347C5] bg-[#f5f7ff] shadow-sm" :
                    "border-gray-100 bg-gray-50"}`}>

                  {/* Step badge */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0
                    ${isDone    ? "bg-[#3DBFA0] text-white" :
                      isCurrent ? "bg-[#2347C5] text-white" :
                      "bg-gray-200 text-gray-500"}`}>
                    {isDone ? "✓" : i + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-bold ${isDone ? "text-[#3DBFA0]" : isCurrent ? "text-[#2347C5]" : "text-gray-600"}`}>
                        {q.name}
                      </p>
                      {isCurrent && (
                        <span className="text-xs bg-[#2347C5] text-white px-2 py-0.5 rounded-full font-medium">
                          You are here
                        </span>
                      )}
                      {isDone && (
                        <span className="text-xs bg-[#f0faf7] text-[#3DBFA0] border border-[#a7f3d0] px-2 py-0.5 rounded-full font-medium">
                          Completed
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-400 mt-0.5">{q.description}</p>

                    <div className="flex items-center gap-1 mt-1">
                      <MdOutlineLocationOn size={11} className="text-gray-400 shrink-0" />
                      <p className="text-xs text-gray-400">{q.location}</p>
                    </div>

                    {/* Deliverables — only show for current or upcoming */}
                    {!isDone && q.deliverables?.length > 0 && (
                      <div className="mt-3 flex flex-col gap-1.5">
                        <p className="text-xs font-medium text-gray-500">Required documents:</p>
                        {q.deliverables.map((d: any, di: number) => (
                          <div key={di} className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg
                            ${d.type === "uploadable" ? "bg-[#EEF2FF] text-[#2347C5]" : "bg-white border border-gray-200 text-gray-600"}`}>
                            {d.type === "uploadable"
                              ? <MdOutlineUploadFile size={12} />
                              : <MdOutlineArticle size={12} />
                            }
                            <span className="font-medium">{d.name}</span>
                            {d.required && <span className="text-red-400 ml-auto">Required</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {i < queues.length - 1 && (
                  <div className="flex flex-col items-center self-center py-0.5">
                    <div className="w-px h-3 bg-gray-200" />
                    <BsArrowDown size={11} className={isDone ? "text-[#3DBFA0]" : "text-gray-300"} />
                    <div className="w-px h-3 bg-gray-200" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {!isLoading && current && queues.length > 0 && (() => {
        const currentQueue = queues.find((q: any) => q._id === current._id)
        const uploadableDeliverables = currentQueue?.deliverables?.filter(
          (d: any) => d.type === "uploadable" || d.type === "hardcopy"
        ) ?? []

        if (uploadableDeliverables.length === 0) return null

        return (
          <DeliverableUpload
            userId={session?.user?._id}
            cycleId={data.cycleId._id}
            queueId={current._id}
            deliverables={uploadableDeliverables}
          />
        )
      })()}

    </div>
  )
}