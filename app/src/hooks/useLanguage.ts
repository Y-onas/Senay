import { useContext } from 'react'
import { LanguageContext } from '@/context/language-context'
import { t, translateNavLabel, type Locale, type UiKey } from '@/i18n/translations'

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }

  const { locale, setLocale } = ctx

  return {
    locale,
    setLocale,
    t: (key: UiKey) => t(key, locale),
    navLabel: (href: string, fallback: string) => translateNavLabel(href, fallback, locale),
  }
}

export type { Locale }
