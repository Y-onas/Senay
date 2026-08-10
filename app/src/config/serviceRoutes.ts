/** Maps service slugs to their public URL paths. */
export const SERVICE_ROUTES: Record<string, string> = {
  agelgil: '/agelgil',
  baltina: '/baltina',
  festival: '/festival-package',
  drinks: '/traditional-drinks',
  catering: '/catering',
}

export function hrefForServiceSlug(slug: string): string | null {
  return SERVICE_ROUTES[slug] ?? null
}

export function slugForServiceHref(href: string): string | null {
  const entry = Object.entries(SERVICE_ROUTES).find(([, path]) => path === href)
  return entry?.[0] ?? null
}

export function isServiceHref(href: string): boolean {
  return Object.values(SERVICE_ROUTES).includes(href)
}
