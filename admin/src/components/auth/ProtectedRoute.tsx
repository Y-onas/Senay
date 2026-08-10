import { useEffect, useRef } from 'react'
import { Outlet } from 'react-router'
import { getToken } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

function RedirectToLogin() {
  const redirected = useRef(false)

  useEffect(() => {
    if (redirected.current) return
    redirected.current = true
    window.location.replace('/st-hq/login.html')
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream text-brown">
      Redirecting to sign in…
    </div>
  )
}

export function ProtectedRoute() {
  const { loading } = useAuth()

  if (!getToken()) {
    return <RedirectToLogin />
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream text-brown">
        Loading admin…
      </div>
    )
  }

  return <Outlet />
}
