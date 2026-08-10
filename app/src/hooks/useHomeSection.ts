import { useMemo } from 'react'
import { deepResolveLocalizedTree } from '@/i18n/content'
import { useOptionalHomeSectionsContext } from '@/context/HomeSectionsProvider'
import { useLanguage } from '@/hooks/useLanguage'
import type { HomeSectionRecord } from '@/services/homeSectionsService'

export function useHomeSection<T extends Record<string, unknown>>(key: string) {
  const ctx = useOptionalHomeSectionsContext()
  const { locale } = useLanguage()

  const section = ctx?.sections?.find((s) => s.key === key)
  const enabled = section?.enabled ?? true

  const content = useMemo(() => {
    if (!section?.content) return null
    return deepResolveLocalizedTree(section.content, locale, 'en') as T
  }, [section?.content, locale])

  const loading = Boolean(ctx?.loading && !ctx.sections)

  return { content, enabled, loading, section }
}

export function useHomeSections() {
  const ctx = useOptionalHomeSectionsContext()
  const { locale } = useLanguage()

  const sections = useMemo(() => {
    if (!ctx?.sections) return []
    return ctx.sections.map((section: HomeSectionRecord) => ({
      ...section,
      content: deepResolveLocalizedTree(section.content, locale, 'en') as Record<
        string,
        unknown
      >,
    }))
  }, [ctx?.sections, locale])

  return { sections, loading: Boolean(ctx?.loading && !ctx.sections) }
}
