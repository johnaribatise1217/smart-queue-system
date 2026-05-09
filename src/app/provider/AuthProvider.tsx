'use client';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'sonner';

export function AuthProvider({ children } : { children: React.ReactNode }) {
  
  return( 
    <SessionProvider>
      <Toaster richColors/>
      {children}
    </SessionProvider>
  )
}