import { NextRequest } from "next/server"
import Redis from "ioredis"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return new Response("userId is required", { status: 400 })
  }

  const channel = `notifications:${userId}`

  // each SSE connection needs its own subscriber instance
  const subscriber = new Redis({
    host:     process.env.REDIS_HOST!,
    port:     parseInt(process.env.REDIS_PORT ?? "10541"),
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  })

  const stream = new ReadableStream({
    start(controller) {
      // send initial heartbeat
      controller.enqueue(`data: ${JSON.stringify({ type: "connected" })}\n\n`)

      subscriber.subscribe(channel, (err) => {
        if (err) console.error("SSE subscribe error:", err)
      })

      subscriber.on("message", (_chan: string, message: string) => {
        try {
          controller.enqueue(`data: ${message}\n\n`)
        } catch {
          // client disconnected
        }
      })

      // heartbeat every 25s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(`: heartbeat\n\n`)
        } catch {
          clearInterval(heartbeat)
        }
      }, 25000)

      // cleanup on disconnect
      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat)
        subscriber.unsubscribe(channel)
        subscriber.quit()
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection":    "keep-alive",
      "X-Accel-Buffering": "no", // important for nginx proxies
    },
  })
}