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
    if(job.name === 'welcome') {
      const {email, name} = job.data as WelcomeEmailJob;
      await sendWelcomeEmail(email, name)
    } else if(job.name === 'otp') {
      const {email, name, otpCode} = job.data as OtpEmailJob;
      await sendOtpEmail(email, name, otpCode)
    }
  }
)