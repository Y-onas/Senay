import { useEffect, useState } from 'react'
import { getPublicServices } from '@/services/catalogApi'

export function useServiceEnabled(slug: string) {
  const [allowed, setAllowed] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPublicServices()
      .then((services) => {
        setAllowed(services.some((s) => s.slug === slug))
      })
      .catch(() => setAllowed(true))
      .finally(() => setLoading(false))
  }, [slug])

  return { allowed, loading }
}
