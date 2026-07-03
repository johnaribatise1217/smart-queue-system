import { Queue, Worker } from 'bullmq';

const queues = new Map<string, Queue>();

export const QueueConnection = {
  host: process.env.REDIS_HOST,
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  port: parseInt(process.env.REDIS_PORT || '16489')
}

export const generateQueue = (queueName: string) => {
  if (queues.has(queueName)) {
    return queues.get(queueName)!;
  }

  const queue = new Queue(queueName, {
    connection: {
      ...QueueConnection,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    },
  });

  queues.set(queueName, queue);

  return queue;
};

const workers = new Map<string, Worker>();

export const generateWorker = (
  queueName: string,
  processor: any
) => {
  if (workers.has(queueName)) {
    return workers.get(queueName)!;
  }

  const worker = new Worker(queueName, processor, {
    connection: {
      ...QueueConnection,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    },
  });

  worker.on("ready", () =>
    console.log(`${queueName} worker ready`)
  );

  workers.set(queueName, worker);

  return worker;
};