import { sendOtpEmail, sendWelcomeEmail } from "backend/utils/emailService";
import { generateQueue, generateWorker } from "../config";

export interface WelcomeEmailJob {
  email: string;
  name: string;
}

export interface OtpEmailJob {
  email: string;
  name: string;
  otpCode: string;
}

export const emailQueue = generateQueue('emailQueue')
export const emailWorker = generateWorker(
  'emailQueue',
  async (job : any) => {
    try {
      console.log(`Processing job ${job.id}:`, job.name)

      if(job.name === 'welcome') {
        const {email, name} = job.data as WelcomeEmailJob;
        console.log(`Sending welcome email to ${email}`)
        await sendWelcomeEmail(email, name)
      } else if(job.name === 'otp') {
        const {email, name, otpCode} = job.data as OtpEmailJob;
        console.log(`Sending OTP email to ${email}`)
        await sendOtpEmail(email, name, otpCode)
      }

      console.log(`Job ${job.id} completed successfully.`)
    } catch (error) {
      console.error(`Error processing job ${job.id}:`, error)
    }
  }
)