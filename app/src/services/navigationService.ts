import { primaryNavLinks } from '@/config/navigation'
import { apiRequest, USE_MOCK, mockResolve, unwrapData } from './apiClient'

export type NavItem = {
  label: string
  href: string
  order: number
}

export async function getPrimaryNavigation(): Promise<NavItem[]> {
  const fallback = primaryNavLinks.map((link, order) => ({
    label: link.label,
    href: link.to,
    order: order + 1,
  }))

  if (USE_MOCK) return mockResolve(fallback)

  try {
    const res = await apiRequest<{ data: NavItem[] }>('/navigation?location=PRIMARY')
    const items = unwrapData(res)
    return items.length ? items : fallback
  } catch {
    return fallback
  }
}
