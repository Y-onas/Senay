import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatAddisDateTime } from '@/lib/addisTime'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(value: string | Date | null | undefined) {
  return formatAddisDateTime(value)
}

export function readLocale(
  base: string | null | undefined,
  i18n: Record<string, string> | null | undefined,
  lang: 'en' | 'am',
) {
  if (i18n && typeof i18n[lang] === 'string' && i18n[lang]) return i18n[lang]
  return lang === 'en' ? base || '' : ''
}

export function ensureLocalized(
  base: string | null | undefined,
  i18n: Record<string, string> | null | undefined,
) {
  return {
    en: readLocale(base, i18n, 'en'),
    am: readLocale(base, i18n, 'am'),
  }
}
