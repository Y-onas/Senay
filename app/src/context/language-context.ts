import { createContext } from 'react'
import type { Locale } from '@/i18n/translations'

export type LanguageContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
}

export const LanguageContext = createContext<LanguageContextValue | null>(null)
