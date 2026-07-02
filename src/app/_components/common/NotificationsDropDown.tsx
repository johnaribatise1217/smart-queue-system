"use client"

import { useQuery } from "@tanstack/react-query"
import { MdOutlineNotificationsNone, MdOutlineCheckCircle, MdOutlineHourglassTop, MdOutlinePlayCircle } from "react-icons/md"

const iconMap: Record<string, React.ReactNode> = {
  position_moved:       <MdOutlinePlayCircle size={16} className="text-blue-500" />,
  queue_advanced:       <MdOutlinePlayCircle size={16} className="text-[#2347C5]" />,
  near_advance:         <MdOutlineHourglassTop size={16} className="text-orange-400" />,
  immediate_advance:    <MdOutlineHourglassTop size={16} className="text-red-500" />,
  cycle_completed:      <MdOutlineCheckCircle size={16} className="text-[#3DBFA0]" />,
  waiting_list_promoted:<MdOutlinePlayCircle size={16} className="text-purple-500" />,
}

export function NotificationDropdown({ userId, onClose }: { userId: any; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      const res = await fetch(`/api/notifications?userId=${userId}`)
      const json = await res.json()
      return json.data ?? []
    },
    enabled: !!userId,
  })

  return (
    <>
      {/* backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div className="absolute right-0 top-11 z-50 w-80 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-800">Notifications</p>
          <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600">Close</button>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {isLoading && (
            <div className="flex flex-col gap-2 p-4 animate-pulse">
              {[1,2,3].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg shrink-0" />
                  <div className="flex-1">
                    <div className="h-3 bg-gray-100 rounded w-3/4 mb-1.5" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && (!data || data.length === 0) && (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <MdOutlineNotificationsNone size={28} className="text-gray-300" />
              <p className="text-xs text-gray-400">No notifications yet</p>
            </div>
          )}

          {!isLoading && data?.map((n: any) => (
            <div
              key={n._id}
              className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors
                ${!n.isRead ? "bg-[#f5f7ff]" : ""}`}
            >
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                {iconMap[n.type] ?? <MdOutlineNotificationsNone size={16} className="text-gray-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800">{n.title}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{n.message}</p>
                <p className="text-xs text-gray-300 mt-1">
                  {new Date(n.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              {!n.isRead && (
                <span className="w-2 h-2 rounded-full bg-[#2347C5] shrink-0 mt-1.5" />
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}