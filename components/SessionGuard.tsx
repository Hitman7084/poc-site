'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface SessionGuardProps {
  children: React.ReactNode
}

/**
 * SessionGuard component that monitors session validity
 * and automatically logs out users when their session is invalidated
 * (e.g., when they log in from another device)
 */
export function SessionGuard({ children }: SessionGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  const handleSessionInvalidated = useCallback(async () => {
    toast.error('Session expired', {
      description: 'You have been logged in from another device.',
      duration: 5000,
    })
    await signOut({ redirect: false })
    router.push('/login')
  }, [router])

  useEffect(() => {
    // Check if session authentication failed (invalidated from another device)
    if (status === 'unauthenticated') {
      const currentPath = window.location.pathname
      // Only show toast if we're on a protected route (not already on login page)
      if (currentPath !== '/login' && currentPath.startsWith('/dashboard')) {
        handleSessionInvalidated()
      }
    }
  }, [status, handleSessionInvalidated])

  return <>{children}</>
}
