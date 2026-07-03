import Redis from "ioredis";

const redisConfig = {
  host: process.env.REDIS_HOST!,
  port: Number(process.env.REDIS_PORT),
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

declare global {
  // eslint-disable-next-line no-var
  var redisPublisher: Redis | undefined;

  // eslint-disable-next-line no-var
  var redisSubscriber: Redis | undefined;
}

export const redisPublisher =
  global.redisPublisher ?? new Redis(redisConfig);

export const redisSubscriber =
  global.redisSubscriber ?? new Redis(redisConfig);

if (process.env.NODE_ENV !== "production") {
  global.redisPublisher = redisPublisher;
  global.redisSubscriber = redisSubscriber;
}

redisPublisher.on("error", (err) => {
  console.error("Redis Publisher:", err);
});

redisSubscriber.on("error", (err) => {
  console.error("Redis Subscriber:", err);
});