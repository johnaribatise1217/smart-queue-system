// import { NextRequest } from "next/server"
// import { redisSubscriber } from "backend/config/redis"

// export const dynamic = "force-dynamic"
// export const runtime = "nodejs"

// export async function GET(req: NextRequest) {
//   const { searchParams } = new URL(req.url)
//   const userId = searchParams.get("userId")

//   if (!userId) {
//     return new Response("userId is required", { status: 400 })
//   }

//   const channel = `notifications:${userId}`

//   const stream = new ReadableStream({
//     start(controller) {
//       // send initial heartbeat
//       controller.enqueue(`data: ${JSON.stringify({ type: "connected" })}\n\n`)

//       redisSubscriber.subscribe(channel, (err) => {
//         if (err) console.error("SSE subscribe error:", err)
//       })

//       redisSubscriber.on("message", (_chan: string, message: string) => {
//         try {
//           controller.enqueue(`data: ${message}\n\n`)
//         } catch {
//           // client disconnected
//         }
//       })

//       // heartbeat every 25s to keep connection alive
//       const heartbeat = setInterval(() => {
//         try {
//           controller.enqueue(`: heartbeat\n\n`)
//         } catch {
//           clearInterval(heartbeat)
//         }
//       }, 25000)

//       // cleanup on disconnect
//       req.signal.addEventListener("abort", () => {
//         clearInterval(heartbeat)
//         redisSubscriber.unsubscribe(channel)
//         redisSubscriber.quit()
//         controller.close()
//       })
//     },
//   })

//   return new Response(stream, {
//     headers: {
//       "Content-Type":  "text/event-stream",
//       "Cache-Control": "no-cache, no-transform",
//       "Connection":    "keep-alive",
//       "X-Accel-Buffering": "no", // important for nginx proxies
//     },
//   })
// }

import { NextRequest } from "next/server";
import { redisSubscriber } from "backend/config/redis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return new Response("userId is required", { status: 400 });
  }

  const channel = `notifications:${userId}`;

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        `data: ${JSON.stringify({ type: "connected" })}\n\n`
      );

      await redisSubscriber.subscribe(channel);

      const onMessage = (receivedChannel: string, message: string) => {
        if (receivedChannel !== channel) return;

        try {
          controller.enqueue(`data: ${message}\n\n`);
        } catch {}
      };

      redisSubscriber.on("message", onMessage);

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(`: heartbeat\n\n`);
        } catch {}
      }, 25000);

      req.signal.addEventListener("abort", async () => {
        clearInterval(heartbeat);

        redisSubscriber.off("message", onMessage);

        await redisSubscriber.unsubscribe(channel);

        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}