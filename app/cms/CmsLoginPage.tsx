import { useEffect, useState } from 'react'
import { Navigate } from 'react-router'
import { CMS_BASE } from '@/config/cms'
import { getCmsToken } from '@/services/cmsApi'

/**
 * CMS login now uses the Clerk-branded page under /st-hq/login.
 * Keep this route so deep links still work.
 */
export default function CmsLoginPage() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (getCmsToken()) {
      setReady(true)
      return
    }
    window.location.replace('/st-hq/login.html')
  }, [])

  if (getCmsToken()) return <Navigate to={CMS_BASE} replace />

  return (
    <div className="flex min-h-screen items-center justify-center bg-burgundy px-4 text-cream">
      {ready ? null : 'Redirecting to secure sign-in…'}
    </div>
  )
}
