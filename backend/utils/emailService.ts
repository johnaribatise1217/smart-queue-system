import nodemailer from "nodemailer";
import { otpTemplate, passwordResetTemplate, welcomeTemplate } from "./emailTemplates";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendWelcomeEmail = async (email: string, name: string) => {
  await transporter.sendMail({
    from: `"Queue" <${process.env.SMTP_FROM}>`,
    to: email,
    subject: "Welcome to Queue 🎉",
    html: welcomeTemplate(name),
  });
};

export const sendOtpEmail = async (email: string, name: string, otp: string) => {
  await transporter.sendMail({
    from: `"Queue" <${process.env.SMTP_FROM}>`,
    to: email,
    subject: "Your Queue verification code",
    html: otpTemplate(name, otp),
  });
};

export const sendPasswordResetEmail = async (email: string, name: string, token: string) => {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: `"Queue" <${process.env.SMTP_FROM}>`,
    to: email,
    subject: "Reset your Queue password",
    html: passwordResetTemplate(name, resetUrl),
  });
};