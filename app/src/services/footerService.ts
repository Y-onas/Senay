import { apiRequest, mockResolve, USE_MOCK, unwrapData } from './apiClient'
import { restaurant } from '@/data/restaurant'

export interface FooterLink {
  label: string
  href: string
}

export interface FooterContent {
  brand: {
    tagline: string
    social: FooterLink[]
  }
  explore: {
    title: string
    links: FooterLink[]
  }
  company: {
    title: string
    links: FooterLink[]
  }
  bottom: {
    creditText: string
  }
}

const defaults: FooterContent = {
  brand: {
    tagline: restaurant.tagline,
    social: restaurant.social.map(({ label, href }) => ({ label, href })),
  },
  explore: {
    title: 'Explore',
    links: [
      { label: 'Agelgil', href: '/agelgil' },
      { label: 'Baltina', href: '/baltina' },
      { label: 'Festival', href: '/festival-package' },
      { label: 'Drinks', href: '/traditional-drinks' },
      { label: 'Catering', href: '/catering' },
      { label: 'Blog', href: '/blog' },
    ],
  },
  company: {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Checkout', href: '/checkout' },
    ],
  },
  bottom: {
    creditText: 'Made with care in Addis Ababa.',
  },
}

type FooterRow = {
  column: string
  title?: string | null
  content?: Record<string, unknown>
}

function parseFooter(rows: FooterRow[]): FooterContent {
  const byColumn = Object.fromEntries(rows.map((row) => [row.column, row]))

  const brandContent = (byColumn.brand?.content ?? {}) as Partial<FooterContent['brand']>
  const exploreContent = (byColumn.explore?.content ?? {}) as { links?: FooterLink[] }
  const companyContent = (byColumn.company?.content ?? {}) as { links?: FooterLink[] }
  const bottomContent = (byColumn.bottom?.content ?? {}) as Partial<FooterContent['bottom']>

  return {
    brand: {
      tagline: brandContent.tagline ?? defaults.brand.tagline,
      social:
        Array.isArray(brandContent.social) && brandContent.social.length
          ? brandContent.social
          : defaults.brand.social,
    },
    explore: {
      title: byColumn.explore?.title ?? defaults.explore.title,
      links:
        Array.isArray(exploreContent.links) && exploreContent.links.length
          ? exploreContent.links
          : defaults.explore.links,
    },
    company: {
      title: byColumn.company?.title ?? defaults.company.title,
      links:
        Array.isArray(companyContent.links) && companyContent.links.length
          ? companyContent.links
          : defaults.company.links,
    },
    bottom: {
      creditText: bottomContent.creditText ?? defaults.bottom.creditText,
    },
  }
}

export async function getFooter(): Promise<FooterContent> {
  if (USE_MOCK) return mockResolve(defaults)

  try {
    const res = await apiRequest<{ data: FooterRow[] }>('/footer')
    const rows = unwrapData(res)
    return rows.length ? parseFooter(rows) : defaults
  } catch {
    return defaults
  }
}

export { defaults as footerDefaults }
