export const CMS_LANGUAGES = ['en', 'am'] as const
export type CmsLanguage = (typeof CMS_LANGUAGES)[number]

export type LocalizedMap = Partial<Record<string, string>>

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function isLocalizedMap(value: unknown): value is LocalizedMap {
  if (!isPlainObject(value)) return false
  const keys = Object.keys(value)
  if (!keys.length) return false
  if (!keys.some((key) => key === 'en' || key === 'am')) return false
  return keys.every((key) => typeof value[key] === 'string' || value[key] == null)
}

export function getLocalizedValue(
  value: unknown,
  language: CmsLanguage,
  fallback: CmsLanguage = 'en',
): string {
  if (typeof value === 'string') return value
  if (!isLocalizedMap(value)) return ''
  const direct = value[language]
  if (typeof direct === 'string' && direct.trim()) return direct
  const fallbackValue = value[fallback]
  if (typeof fallbackValue === 'string' && fallbackValue.trim()) return fallbackValue
  for (const entry of Object.values(value)) {
    if (typeof entry === 'string' && entry.trim()) return entry
  }
  return ''
}

export function setLocalizedValue(
  current: unknown,
  language: CmsLanguage,
  next: string,
): LocalizedMap {
  const base = isLocalizedMap(current)
    ? { ...current }
    : typeof current === 'string'
      ? ({ en: current } as LocalizedMap)
      : ({} as LocalizedMap)

  base[language] = next
  return base
}

export function localizeRecordField<T extends Record<string, unknown>>(
  record: T,
  key: keyof T,
  language: CmsLanguage,
  next: string,
): T {
  return {
    ...record,
    [key]: setLocalizedValue(record[key], language, next),
  }
}
