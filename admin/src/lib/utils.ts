import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return '—'
  const d = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString()
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
