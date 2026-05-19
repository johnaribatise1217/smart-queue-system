import 'dotenv/config'
import { emailWorker } from "./email/email.worker"
import { cycleWorker } from './cycle/cycle.worker'

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