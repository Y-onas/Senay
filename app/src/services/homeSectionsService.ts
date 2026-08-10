import { apiRequest, USE_MOCK, mockResolve, unwrapData } from './apiClient'

export interface HomeSectionRecord {
  id: string
  key: string
  label: string
  order: number
  enabled: boolean
  content: Record<string, unknown>
  media?: { id: string; url: string; alt: string | null } | null
}

let rawCache: HomeSectionRecord[] | null = null
let inflight: Promise<HomeSectionRecord[]> | null = null

/** Fetch all home sections once (raw localized JSON from CMS). */
export async function getRawHomeSections(force = false): Promise<HomeSectionRecord[]> {
  if (!force && rawCache) return rawCache
  if (!force && inflight) return inflight

  inflight = (async () => {
    if (USE_MOCK) {
      rawCache = await mockResolve([], 100)
      return rawCache
    }

    try {
      const res = await apiRequest<{ data: HomeSectionRecord[] }>('/home-sections')
      rawCache = unwrapData(res) ?? []
      return rawCache
    } catch {
      return rawCache ?? []
    } finally {
      inflight = null
    }
  })()

  return inflight
}

/** @deprecated Use getRawHomeSections + client locale resolution instead. */
export async function getHomeSections(force = false): Promise<HomeSectionRecord[]> {
  return getRawHomeSections(force)
}

export function getSectionContent<T extends Record<string, unknown>>(
  sections: HomeSectionRecord[],
  key: string,
): T | null {
  const section = sections.find((s) => s.key === key)
  if (!section?.enabled) return null
  return (section.content ?? {}) as T
}

export function isSectionEnabled(sections: HomeSectionRecord[], key: string): boolean {
  const section = sections.find((s) => s.key === key)
  return section?.enabled ?? true
}
