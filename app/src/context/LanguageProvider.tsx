import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import {
  LOCALE_STORAGE_KEY,
  readInitialLocale,
  readLocaleFromSearch,
  type Locale,
} from '@/i18n/translations'
import { LanguageContext } from './language-context'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [searchParams] = useSearchParams()
  const [locale, setLocaleState] = useState<Locale>(() => readInitialLocale())

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  // Telegram bot opens WebApp with ?lang=am|en — apply it immediately.
  useEffect(() => {
    const fromUrl = readLocaleFromSearch(searchParams.toString())
    if (!fromUrl) return
    setLocaleState(fromUrl)
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, fromUrl)
    } catch {
      /* ignore */
    }
  }, [searchParams])

  useEffect(() => {
    document.documentElement.lang = locale === 'am' ? 'am' : 'en'
  }, [locale])

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
