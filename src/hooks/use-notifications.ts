"use client"
import { useEffect, useRef, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useQueryClient } from "@tanstack/react-query"

interface NotificationPayload {
  _id: string
  type: string
  title: string
  message: string
  metadata: Record<string, any>
  isRead: boolean
  createdAt: string
}

export function useNotifications() {
  const { data: session } = useSession()
  const userId = session?.user?._id
  const queryClient = useQueryClient()

  const [connected, setConnected]   = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [latest, setLatest]         = useState<NotificationPayload | null>(null)
  const eventSourceRef              = useRef<EventSource | null>(null)

  // fetch initial unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return
    const res = await fetch(`/api/notifications?userId=${userId}&unreadOnly=true`)
    const json = await res.json()
    if (json.success) setUnreadCount(json.unreadCount)
  }, [userId])

  useEffect(() => {
    if (!userId) return

    fetchUnreadCount()

    // open SSE connection
    const es = new EventSource(`/api/notifications/stream?userId=${userId}`)
    eventSourceRef.current = es

    es.onopen = () => setConnected(true)

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === "connected") return

        // new notification arrived
        const notification = data as NotificationPayload
        setLatest(notification)
        setUnreadCount((prev) => prev + 1)

        // invalidate relevant queries so dashboard/history refresh
        queryClient.invalidateQueries({ queryKey: ["user-active-queue", userId] })
        queryClient.invalidateQueries({ queryKey: ["user-queue-history", userId] })
      } catch {
        // heartbeat comment lines are not JSON, ignore
      }
    }

    es.onerror = () => {
      setConnected(false)
      // browser auto-reconnects SSE after error
    }

    return () => {
      es.close()
      setConnected(false)
    }
  }, [userId, fetchUnreadCount, queryClient])

  const markAllRead = async () => {
    if (!userId) return
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })
    setUnreadCount(0)
    queryClient.invalidateQueries({ queryKey: ["notifications", userId] })
  }

  const markOneRead = async (notificationId: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, notificationId }),
    })
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  return { connected, unreadCount, latest, markAllRead, markOneRead }
}