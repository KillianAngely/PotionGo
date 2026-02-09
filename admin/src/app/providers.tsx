"use client"

import { AuthProvider } from "./00_INFRA/Context/AuthContext"
import { ThemeProvider } from "./00_INFRA/Context/ThemeContext"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  )
}
