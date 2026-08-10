import { useEffect, useState } from 'react'
import type { HomeSection } from '@/lib/api'
import { ensureLocalized, normalizeField, writeLocale, type CmsLanguage } from '@/lib/i18n'
import type { SectionEditorProps } from '@/features/home/editors/types'

export { normalizeField, ensureLocalized, writeLocale }
export type { CmsLanguage }

export function useSectionEditor(section: HomeSection, normalizer: (c: Record<string, unknown>) => Record<string, unknown>) {
  const [draft, setDraft] = useState(section)
  const [content, setContent] = useState<Record<string, unknown>>(() => normalizer((section.content ?? {}) as Record<string, unknown>))

  useEffect(() => {
    setDraft(section)
    setContent(normalizer((section.content ?? {}) as Record<string, unknown>))
  }, [section, normalizer])

  const setLocalized = (key: string, lang: CmsLanguage, text: string) => {
    setContent((prev) => ({ ...prev, [key]: writeLocale(prev[key], lang, text) }))
  }

  const finalizeLocalized = (keys: string[]) => {
    const next = { ...content }
    for (const key of keys) next[key] = ensureLocalized(content[key])
    return next
  }

  return { draft, setDraft, content, setContent, setLocalized, finalizeLocalized }
}

export type SectionEditorHook = ReturnType<typeof useSectionEditor>

export function buildSectionSave(
  draft: HomeSection,
  content: Record<string, unknown>,
  onSave: SectionEditorProps['onSave'],
) {
  onSave(draft, content)
}
