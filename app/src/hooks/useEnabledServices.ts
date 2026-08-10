import { useEffect, useState } from 'react'
import { hrefForServiceSlug, isServiceHref } from '@/config/serviceRoutes'
import { getPublicServices } from '@/services/catalogApi'
import { useLanguage } from '@/hooks/useLanguage'

export function useEnabledServices() {
  const { locale } = useLanguage()
  const [slugs, setSlugs] = useState<Set<string>>(new Set())
  const [hrefs, setHrefs] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    getPublicServices()
      .then((services) => {
        setSlugs(new Set(services.map((service) => service.slug)))
        setHrefs(
          new Set(
            services
              .map((service) => hrefForServiceSlug(service.slug))
              .filter((href): href is string => Boolean(href)),
          ),
        )
        setReady(true)
      })
      .catch(() => {
        setSlugs(new Set())
        setHrefs(new Set())
        setReady(false)
      })
      .finally(() => setLoading(false))
  }, [locale])

  const isHrefEnabled = (href: string) => {
    if (!isServiceHref(href) || !ready) return true
    return hrefs.has(href)
  }
  const isSlugEnabled = (slug: string) => !ready || slugs.has(slug)

  return { slugs, hrefs, loading, ready, isHrefEnabled, isSlugEnabled }
}
