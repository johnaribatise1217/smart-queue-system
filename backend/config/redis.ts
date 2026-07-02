import Redis from "ioredis"

const redisConfig = {
  host:     process.env.REDIS_HOST!,
  port:     parseInt(process.env.REDIS_PORT ?? "10541"),
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
}

// publisher — used by workers to publish events
export const redisPublisher = new Redis(redisConfig)

// subscriber — used by SSE endpoints to subscribe to channels
// must be a separate connection from publisher
export const redisSubscriber = new Redis(redisConfig)

redisPublisher.on("error",  (err) => console.error("Redis publisher error:", err))
redisSubscriber.on("error", (err) => console.error("Redis subscriber error:", err))