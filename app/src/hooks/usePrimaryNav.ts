import { useEffect, useState } from 'react'
import { primaryNavLinks } from '@/config/navigation'
import { getPrimaryNavigation } from '@/services/navigationService'
import { useLanguage } from '@/hooks/useLanguage'

export type NavLink = { label: string; to: string }

export function usePrimaryNav() {
  const { locale } = useLanguage()
  const [links, setLinks] = useState<NavLink[]>(
    primaryNavLinks.map((link) => ({ label: link.label, to: link.to })),
  )

  useEffect(() => {
    getPrimaryNavigation()
      .then((items) =>
        setLinks(
          [...items]
            .sort((a, b) => a.order - b.order)
            .map((item) => ({ label: item.label, to: item.href })),
        ),
      )
      .catch(() => {
        setLinks(primaryNavLinks.map((link) => ({ label: link.label, to: link.to })))
      })
  }, [locale])

  return links
}
