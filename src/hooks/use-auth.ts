/**
 * useAuth Hook
 * 
 * Client-side hook for accessing authentication session
 */

"use client"

import { useSession } from "next-auth/react"

export function useAuth() {
  const { data: session, status } = useSession()

  return {
    user: session?.user,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    session,
    status
  }
}

// Type-safe role check
export function useIsAdmin() {
  const { user } = useAuth()
  return user?.role === "ADMIN"
}

export function useIsAgent() {
  const { user } = useAuth()
  return user?.role === "AGENT"
}
