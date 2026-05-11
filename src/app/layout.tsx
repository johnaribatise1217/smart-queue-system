import "@/styles/globals.css";

import { type Metadata } from "next";
import {Manrope, Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { Toaster } from "sonner";
import dbConnect from "backend/config/dbConnect";
import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "./provider/AuthProvider";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Smart Queue System",
  description: "No more guessing—see your queue status and get notified when it’s your turn.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["200", "300", "400", "500", "600", "700"],
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  dbConnect()
  return (
    <html lang="en" className={cn(manrope.variable, "font-sans", geist.variable)}>
      <body>
        <AuthProvider>
          <TRPCReactProvider>
            {children}
          </TRPCReactProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
