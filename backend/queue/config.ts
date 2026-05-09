import { Queue, Worker } from 'bullmq';

export const QueueConnection = {
  host: process.env.REDIS_HOST,
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  port: parseInt(process.env.REDIS_PORT || '16489')
}

export const generateQueue = (queueName: string) => {
  return new Queue(queueName, {
    connection : {...QueueConnection, maxRetriesPerRequest: null, enableReadyCheck: false}
  })
}

export const generateWorker = (queueName: string, processor: any) => {
  return new Worker(queueName, processor, {
    connection : {...QueueConnection, maxRetriesPerRequest: null, enableReadyCheck: false}
  })
}