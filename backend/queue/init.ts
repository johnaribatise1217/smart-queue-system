import 'dotenv/config'
import { emailWorker } from "./email/email.worker"
import { cycleWorker } from './cycle/cycle.worker'
import { notificationWorker } from './notification/notification.worker'
import {redisPublisher, redisSubscriber} from "backend/config/redis"

emailWorker.on('completed', (job) => {
  console.log(`Email job ${job.id} completed successfully.`)
})
emailWorker.on('failed', (job, err) => {
  console.error(`Email job ${job?.id} failed with error: ${err.message}`)
})
cycleWorker.on("completed", (job) => {
  console.log(`Cycle job ${job.id} completed`)
})
cycleWorker.on("failed", (job, err) => {
  console.error(`Cycle job ${job?.id} failed:`, err.message)
})
notificationWorker.on('completed', (job) => {
  console.log(`Notification job ${job.id} completed successfully.`)
})
notificationWorker.on('failed', (job, err) => {
  console.error(`Email job ${job?.id} failed with error: ${err.message}`)
})

process.on("SIGINT", async () => {
  await Promise.all([
    emailWorker.close(),
    cycleWorker.close(),
    notificationWorker.close(),
  ]);

  await Promise.allSettled([
    redisPublisher.quit(),
    redisSubscriber.quit(),
  ]);

  process.exit(0);
});