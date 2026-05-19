'use client';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function AuthProvider({ children } : { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  return( 
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <Toaster richColors/>
        {children}
      </QueryClientProvider>
    </SessionProvider>
  )
}