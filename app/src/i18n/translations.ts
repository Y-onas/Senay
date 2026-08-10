export type Locale = 'en' | 'am'

export const LOCALE_STORAGE_KEY = 'senay_locale'

/** Read ?lang=en|am from a query string (Telegram bot WebApp links). */
export function readLocaleFromSearch(search: string): Locale | null {
  const lang = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search).get('lang')
  if (lang === 'am' || lang === 'en') return lang
  return null
}

function readStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (stored === 'am' || stored === 'en') return stored
  } catch {
    /* ignore */
  }
  return 'en'
}

/** URL lang (bot WebApp) wins over localStorage. */
export function readInitialLocale(search = ''): Locale {
  if (typeof window !== 'undefined') {
    const fromUrl = readLocaleFromSearch(search || window.location.search)
    if (fromUrl) return fromUrl
  }
  return readStoredLocale()
}

export const navLabels: Record<string, { en: string; am: string }> = {
  '/': { en: 'Home', am: 'መነሻ' },
  '/baltina': { en: 'Baltina', am: 'ባልቲና' },
  '/traditional-drinks': { en: 'Drinks', am: 'መጠጦች' },
  '/festival-package': { en: 'Festival', am: 'ፌስቲቫል' },
  '/agelgil': { en: 'Agelgil', am: 'አገልግል' },
  '/catering': { en: 'Catering', am: 'ካተሪንግ' },
  '/blog': { en: 'Blog', am: 'ብሎግ' },
  '/about': { en: 'About', am: 'ስለ እኛ' },
  '/contact': { en: 'Contact', am: 'እውቂያ' },
}

const ui = {
  orderNow: { en: 'Order Now', am: 'አሁን ይዘዙ' },
  openMenu: { en: 'Open menu', am: 'ምናሌ ክፈት' },
  closeMenu: { en: 'Close menu', am: 'ምናሌ ዝጋ' },
  language: { en: 'Language', am: 'ቋንቋ' },
  exploreMenu: { en: 'Explore our menu', am: 'ምናሌያችንን ይመልከቱ' },
  ourJourney: { en: 'Our journey', am: 'ጉዞያችን' },
  fromOnePot: {
    en: 'From one pot to many tables',
    am: 'ከአንድ ገበታ ወደ ብዙ ጠረጴዛዎች',
  },
  contactName: { en: 'Your name', am: 'ስምዎ' },
  contactEmail: { en: 'Email', am: 'ኢሜይል' },
  contactPhoneOptional: { en: 'Phone (optional)', am: 'ስልክ (አማራጭ)' },
  contactMessage: { en: 'Message', am: 'መልእክት' },
  contactMessagePlaceholder: {
    en: 'Tell us how we can help…',
    am: 'እንዴት እንድንረዳዎ ይንገሩን…',
  },
  contactSendMessage: { en: 'Send message', am: 'መልእክት ይላኩ' },
  contactSending: { en: 'Sending…', am: 'በመላክ ላይ…' },
  contactMessageSent: { en: 'Message sent!', am: 'መልእክት ተልኳል!' },
  contactThanksReply: {
    en: "Thanks for reaching out. We'll reply as soon as we can.",
    am: 'ስለተገናኙን እናመሰግናለን። በተቻለ ፍጥነት እንመልስልዎታለን።',
  },
  contactSendAnother: { en: 'Send another', am: 'ሌላ መልእክት ይላኩ' },
  contactErrorName: { en: 'Please enter your name.', am: 'እባክዎ ስምዎን ያስገቡ።' },
  contactErrorEmail: { en: 'Please enter your email.', am: 'እባክዎ ኢሜይልዎን ያስገቡ።' },
  contactErrorMessage: { en: 'How can we help?', am: 'እንዴት እንድንረዳዎ?' },
  contactErrorSendFailed: { en: 'Failed to send message', am: 'መልእክት መላክ አልተሳካም' },
  shareExperience: { en: 'Share Your Experience', am: 'ልምድዎን ያጋሩ' },
  shareExperienceTitle: { en: 'Share Your Experience', am: 'ልምድዎን ያጋሩ' },
  shareExperienceHint: {
    en: 'Tell us about your visit. Reviews appear on the site after we approve them.',
    am: 'ስለ ጉብኝትዎ ይንገሩን። ግምገማዎች ከፀደቁ በኋላ በድረ-ገጹ ላይ ይታያሉ።',
  },
  shareName: { en: 'Your name', am: 'ስምዎ' },
  shareRole: { en: 'Role / occasion (optional)', am: 'ሚና / አጋጣሚ (አማራጭ)' },
  shareRolePlaceholder: { en: 'e.g. Wedding guest', am: 'ምሳሌ፡ የሰርግ እንግዳ' },
  shareDish: { en: 'Favourite dish (optional)', am: 'ተወዳጅ ምግብ (አማራጭ)' },
  shareQuote: { en: 'Your review', am: 'ግምገማዎ' },
  shareQuotePlaceholder: {
    en: 'What did you enjoy most?',
    am: 'ምን ነው በጣም የወደዱት?',
  },
  shareRating: { en: 'Rating', am: 'ደረጃ' },
  shareSubmit: { en: 'Submit review', am: 'ግምገማ ያስገቡ' },
  shareSubmitting: { en: 'Submitting…', am: 'በማስገባት ላይ…' },
  shareThanksTitle: { en: 'Thank you!', am: 'አመሰግናለን!' },
  shareThanksBody: {
    en: 'Your review was received and is waiting for approval.',
    am: 'ግምገማዎ ተቀብሏል እና ለማጽደቅ በመጠባበቅ ላይ ነው።',
  },
  shareClose: { en: 'Close', am: 'ዝጋ' },
  shareErrorName: { en: 'Please enter your name.', am: 'እባክዎ ስምዎን ያስገቡ።' },
  shareErrorQuote: {
    en: 'Please write a short review (at least a few words).',
    am: 'እባክዎ አጭር ግምገማ ይጻፉ።',
  },
  shareErrorSendFailed: {
    en: 'Could not submit your review. Please try again.',
    am: 'ግምገማዎን ማስገባት አልተሳካም። እባክዎ እንደገና ይሞክሩ።',
  },
  footerVisitUs: { en: 'Visit Us', am: 'ይጎብኙን' },
  footerContactUs: { en: 'Contact us', am: 'ያግኙን' },
  footerAllRightsReserved: {
    en: 'All rights reserved.',
    am: 'ሁሉም መብቶች የተጠበቁ ናቸው።',
  },
} as const

export type UiKey = keyof typeof ui

export function translateNavLabel(href: string, fallback: string, locale: Locale): string {
  const entry = navLabels[href]
  if (!entry) return fallback
  return entry[locale]
}

export function t(key: UiKey, locale: Locale): string {
  return ui[key][locale]
}
