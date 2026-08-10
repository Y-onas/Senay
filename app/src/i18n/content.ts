export const CONTENT_LOCALES = ["en", "am"] as const
export type ContentLocale = (typeof CONTENT_LOCALES)[number]
export type LocaleCode = ContentLocale | (string & {})

export type LocalizedText = Partial<Record<LocaleCode, string>>

const LOCALE_KEY_RE = /^[a-z]{2}(?:-[a-z]{2})?$/i

const NON_LOCALIZED_STRING_KEYS = new Set([
  'src',
  'url',
  'href',
  'slug',
  'id',
  'key',
  'image',
  'icon',
  'emoji',
  'category',
  'type',
  'status',
  'color',
  'email',
  'phone',
  'videoUrl',
  'videoId',
  'platform',
  'location',
  'ctaHref',
  'buttonHref',
  'buttonLink',
  'link',
  'variant',
  'year',
  'mapUrl',
])

function shouldResolvePlainString(key?: string): boolean {
  if (!key) return false
  return !NON_LOCALIZED_STRING_KEYS.has(key)
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function getCurrentLocale(): ContentLocale {
  if (typeof window === 'undefined') return 'en'
  const fromUrl = new URLSearchParams(window.location.search).get('lang')
  if (fromUrl === 'am') return 'am'
  if (fromUrl === 'en') return 'en'
  const htmlLang = document.documentElement.lang?.toLowerCase()
  if (htmlLang === 'am') return 'am'
  const storage = localStorage.getItem('senay_locale')?.toLowerCase()
  if (storage === 'am') return 'am'
  return 'en'
}

export function normalizeLocale(locale?: string | null): ContentLocale {
  if ((locale ?? '').toLowerCase() === 'am') return 'am'
  return 'en'
}

export function isLocalizedText(value: unknown): value is LocalizedText {
  if (!isPlainObject(value)) return false

  const keys = Object.keys(value)
  if (!keys.length) return false
  if (!keys.some((key) => key === 'en' || key === 'am')) return false
  if (!keys.every((key) => LOCALE_KEY_RE.test(key))) return false

  return keys.every((key) => {
    const entry = value[key]
    return typeof entry === 'string' || entry == null
  })
}

export function toLocalizedText(value: unknown, locale: LocaleCode = 'en'): LocalizedText {
  if (isLocalizedText(value)) return value
  if (typeof value === 'string') return { [locale]: value }
  return {}
}

export function resolveLocalizedText(
  value: unknown,
  locale: LocaleCode = getCurrentLocale(),
  fallbackLocale: LocaleCode = 'en',
): string {
  if (typeof value === 'string') {
    return normalizeLocale(locale) === 'en' ? value : ''
  }
  if (!isLocalizedText(value)) return ''

  const normalized = normalizeLocale(locale)
  const direct = value[normalized]
  if (typeof direct === 'string' && direct.trim()) return direct

  if (normalized === 'en') {
    const fallback = normalizeLocale(fallbackLocale)
    const fallbackValue = value[fallback]
    if (typeof fallbackValue === 'string' && fallbackValue.trim()) return fallbackValue
  }

  return ''
}

export function deepResolveLocalizedTree(
  value: unknown,
  locale: LocaleCode = getCurrentLocale(),
  fallbackLocale: LocaleCode = 'en',
  key?: string,
): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => deepResolveLocalizedTree(entry, locale, fallbackLocale))
  }
  if (typeof value === 'string') {
    if (shouldResolvePlainString(key)) {
      return resolveLocalizedText(value, locale, fallbackLocale)
    }
    return value
  }
  if (!isPlainObject(value)) return value
  if (isLocalizedText(value)) return resolveLocalizedText(value, locale, fallbackLocale)

  const next: Record<string, unknown> = {}
  for (const [entryKey, entry] of Object.entries(value)) {
    next[entryKey] = deepResolveLocalizedTree(entry, locale, fallbackLocale, entryKey)
  }
  return next
}
