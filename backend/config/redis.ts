import Redis from "ioredis";

const redisConfig = {
  host: process.env.REDIS_HOST!,
  port: Number(process.env.REDIS_PORT ?? 6379),
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  lazyConnect: true,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  connectTimeout: 10000,
  keepAlive: 30000,
};

declare global {
  var redisPublisher: Redis | undefined;
  var redisSubscriber: Redis | undefined;
}

export const redisPublisher =
  globalThis.redisPublisher ?? new Redis(redisConfig);

export const redisSubscriber =
  globalThis.redisSubscriber ?? new Redis(redisConfig);

globalThis.redisPublisher = redisPublisher;
globalThis.redisSubscriber = redisSubscriber;

redisPublisher.on("error", (err) => {
  console.error("Redis Publisher:", err);
});

redisSubscriber.on("error", (err) => {
  console.error("Redis Subscriber:", err);
});