import 'dotenv/config'
import { emailWorker } from "./email/email.worker"

emailWorker.on('completed', (job) => {
  console.log(`Email job ${job.id} completed successfully.`)
})
emailWorker.on('failed', (job, err) => {
  console.error(`Email job ${job?.id} failed with error: ${err.message}`)
})