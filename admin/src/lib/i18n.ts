export type LocalizedText = { en: string; am: string }
export type CmsLanguage = 'en' | 'am'

export function isLocalized(value: unknown): value is LocalizedText {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    ('en' in (value as object) || 'am' in (value as object))
  )
}

export function normalizeField(value: unknown): LocalizedText {
  if (isLocalized(value)) return { en: value.en ?? '', am: value.am ?? '' }
  if (typeof value === 'string') return { en: value, am: '' }
  return { en: '', am: '' }
}

/** For public display — falls back across languages */
export function getLocalizedValue(value: unknown, language: CmsLanguage = 'en'): string {
  if (typeof value === 'string') return value
  if (!isLocalized(value)) return ''
  return value[language]?.trim() || value.en?.trim() || value.am?.trim() || ''
}

/** For edit surfaces — only the requested language, no fallback */
export function getRawLocalizedValue(value: unknown, language: CmsLanguage): string {
  if (typeof value === 'string') return language === 'en' ? value : ''
  if (!isLocalized(value)) return ''
  return typeof value[language] === 'string' ? value[language] : ''
}

export function readLocale(value: unknown, language: CmsLanguage): string {
  return getRawLocalizedValue(value, language)
}

export function writeLocale(value: unknown, language: CmsLanguage, text: string): LocalizedText {
  return { ...normalizeField(value), [language]: text }
}

export function ensureLocalized(value: unknown): LocalizedText {
  return {
    en: readLocale(value, 'en'),
    am: readLocale(value, 'am'),
  }
}

export function setLocalizedValue(
  value: unknown,
  language: CmsLanguage,
  text: string,
): LocalizedText {
  return writeLocale(value, language, text)
}
