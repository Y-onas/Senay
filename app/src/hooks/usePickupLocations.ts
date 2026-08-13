import { useEffect, useState } from 'react'
import { getPageContent } from '@/services/contentService'
import { useLanguage } from '@/hooks/useLanguage'

export type PickupLocation = {
  id: string
  name: string
  area: string
  mapUrl?: string
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function asText(value: unknown, locale: 'en' | 'am'): string {
  if (typeof value === 'string') return value.trim()
  const rec = asRecord(value)
  if (!rec) return ''
  const localized = rec[locale]
  const fallback = rec.en
  if (typeof localized === 'string' && localized.trim()) return localized.trim()
  if (typeof fallback === 'string' && fallback.trim()) return fallback.trim()
  return ''
}

function normalizeBranches(raw: unknown, locale: 'en' | 'am'): PickupLocation[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item, index) => {
    const row = asRecord(item)
    if (!row) return []
    const name = asText(row.name, locale)
    if (!name) return []
    const id =
      typeof row.id === 'string' && row.id.trim()
        ? row.id.trim()
        : `location-${index}`
    return [
      {
        id,
        name,
        area: asText(row.area, locale),
        mapUrl: typeof row.mapUrl === 'string' ? row.mapUrl : undefined,
      },
    ]
  })
}

export function formatPickupLocationLabel(location: PickupLocation): string {
  return location.area ? `${location.name} · ${location.area}` : location.name
}

/** Live branch list from Contact CMS — never falls back to hardcoded locations. */
export function usePickupLocations() {
  const { locale } = useLanguage()
  const [locations, setLocations] = useState<PickupLocation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getPageContent('contact')
      .then((data) => {
        if (cancelled) return
        const branches = (data as { branches?: unknown }).branches
        setLocations(normalizeBranches(branches, locale))
      })
      .catch(() => {
        if (!cancelled) setLocations([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [locale])

  return { locations, loading }
}
