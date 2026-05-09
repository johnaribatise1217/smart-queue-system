import crypto from "crypto";

export const generateOtp = (length: number = 6): string => {
  return crypto.randomInt(0, 10 ** length).toString().padStart(length, "0");
}