/* eslint-disable @next/next/no-img-element */
"use client";

import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MdOutlinePeople, MdOutlineHourglassTop,
  MdOutlineArrowForward, MdOutlineLocationOn,
} from "react-icons/md";
import { HiOutlineQueueList } from "react-icons/hi2";
import { errorToast, successToast } from "@/utils/toast";

interface QueueUser {
  _id: string;
  userId: { _id: string; name: string; email: string; phoneNumber: string; avatar?: { url: string } };
  position: number;
  cycleStatus: string;
  cycleId: { _id: string; name: string };
  completedQueues: any[];
}

export default function QueuePointDashboard() {
  const { data: session } = useSession()
  const userId      = session?.user?._id
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ["queue-point-dashboard", userId],
    queryFn: async () => {
      const res = await fetch(`/api/queue-point/dashboard?userId=${userId}`)
      const json = await res.json()
      if (!res.ok) {
        errorToast(json.message || "Failed to fetch queue data")
        throw new Error(json.message || "Failed to fetch queue data")
      }
      return json.data
    },
    enabled: !!userId,
    refetchInterval: 5000,
    staleTime: 4000,
  })

  const { mutate: advanceUser, isPending: advancing } = useMutation({
    mutationFn: async (history: QueueUser) => {
      const res = await fetch("/api/queue-point/advance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: session?.user?.assignedAdminId,
          userId:  history.userId._id,
          cycleId: history.cycleId._id,
          completedQueueId: data?.queue._id,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        errorToast(json.message || "Failed to advance user")
        throw new Error(json.message || "Failed to advance user")
      }
      return json
    },
    onSuccess: () => {
      successToast("User advanced successfully")
      queryClient.invalidateQueries({ queryKey: ["queue-point-dashboard", userId] })
    },
  })

  if (isLoading) {
    return (
      <div className="font-manrope flex flex-col gap-5 animate-pulse p-6">
        <div className="h-6 bg-gray-100 rounded w-48" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}
        </div>
        <div className="h-96 bg-gray-100 rounded-2xl" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="font-manrope flex items-center justify-center py-20">
        <p className="text-sm text-gray-400">Failed to load queue data</p>
      </div>
    )
  }

  const { queue, inProgress, waiting } = data

  return (
    <div className="font-manrope flex flex-col gap-6 p-6">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-900">{queue.name}</h1>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
            (queue.cycleId as any).isActive
              ? "bg-green-50 text-green-600 border border-green-200"
              : "bg-orange-50 text-orange-500 border border-orange-200"
          }`}>
            {(queue.cycleId as any).isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <MdOutlineLocationOn size={13} className="text-gray-400" />
          <p className="text-xs text-gray-400">{queue.location}</p>
          <span className="text-gray-300 mx-1">·</span>
          <p className="text-xs text-gray-400">Cycle: {(queue.cycleId as any).name}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] flex items-center justify-center">
            <MdOutlinePeople size={18} className="text-[#2347C5]" />
          </div>
          <div>
            <p className="text-xs text-gray-400">In Progress</p>
            <p className="text-lg font-bold text-gray-900">{data.inProgressCount}/{data.maxUsers}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
            <MdOutlineHourglassTop size={18} className="text-orange-400" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Waiting</p>
            <p className="text-lg font-bold text-gray-900">{data.waitingCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#f0faf7] flex items-center justify-center">
            <HiOutlineQueueList size={18} className="text-[#3DBFA0]" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Max Slots</p>
            <p className="text-lg font-bold text-gray-900">{data.maxUsers}</p>
          </div>
        </div>
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#3DBFA0] animate-pulse" />
        <span className="text-xs text-gray-400">Live — updates every 5 seconds</span>
      </div>

      {/* Queue user list */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Queue Order</h2>
          <p className="text-xs text-gray-400">{inProgress.length} user{inProgress.length !== 1 ? "s" : ""} in queue</p>
        </div>

        {inProgress.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <HiOutlineQueueList size={32} className="text-gray-300" />
            <p className="text-sm text-gray-400">No users in this queue yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {inProgress.map((entry: QueueUser) => (
              <div key={entry._id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                {/* Position badge */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0
                  ${entry.position === 1 ? "bg-[#2347C5] text-white" : "bg-gray-100 text-gray-600"}`}>
                  #{entry.position}
                </div>

                {/* Avatar */}
                {entry.userId.avatar?.url ? (
                  <img src={entry.userId.avatar.url} className="w-9 h-9 rounded-full object-cover shrink-0" alt="" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#2347C5] flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {entry.userId.name?.[0]?.toUpperCase()}
                  </div>
                )}

                {/* User info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{entry.userId.name}</p>
                  <p className="text-xs text-gray-400">{entry.userId.phoneNumber}</p>
                </div>

                {/* Cycle name */}
                <p className="text-xs text-gray-400 hidden sm:block truncate max-w-[100px]">
                  {entry.cycleId.name}
                </p>

                {/* Status */}
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 ${
                  entry.cycleStatus === "inprogress"
                    ? "bg-blue-50 text-blue-600 border border-blue-200"
                    : "bg-orange-50 text-orange-500 border border-orange-200"
                }`}>
                  {entry.cycleStatus === "inprogress" ? "In Progress" : "Waiting"}
                </span>

                {/* Advance button */}
                {entry.cycleStatus === "inprogress" && (
                  <button
                    onClick={() => advanceUser(entry)}
                    disabled={advancing}
                    className="flex items-center gap-1.5 text-xs font-semibold bg-[#2347C5] text-white px-3 py-2 rounded-xl hover:bg-[#1a38a8] transition-colors disabled:opacity-60 shrink-0"
                  >
                    <MdOutlineArrowForward size={14} />
                    Advance
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}