import { useEffect } from 'react'

type TelegramWebApp = {
  initData?: string
  ready?: () => void
  expand?: () => void
  setHeaderColor?: (color: string) => void
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp }
  }
}

/** True only for URLs launched by the Telegram bot WebApp button. */
export function isTelegramWebApp(search?: string): boolean {
  if (typeof window === 'undefined') return false
  const query = search ?? window.location.search
  return (
    new URLSearchParams(query).get('tg') === '1' ||
    Boolean(window.Telegram?.WebApp?.initData)
  )
}

/** Keep ?tg=1&lang=… when navigating inside the Telegram WebApp. */
export function withTelegramSearch(path: string, search: string): string {
  if (!isTelegramWebApp(search)) return path
  const params = new URLSearchParams()
  params.set('tg', '1')
  const lang = new URLSearchParams(search).get('lang')
  if (lang === 'am' || lang === 'en') params.set('lang', lang)
  const qs = params.toString()
  return qs ? `${path}?${qs}` : path
}

/** Prepare the Telegram container without changing the regular website. */
export function useTelegramWebApp(search: string): boolean {
  const telegram = isTelegramWebApp(search)

  useEffect(() => {
    if (!telegram) return
    const webApp = window.Telegram?.WebApp
    webApp?.ready?.()
    webApp?.expand?.()
    webApp?.setHeaderColor?.('#f8f3eb')
  }, [telegram])

  return telegram
}
