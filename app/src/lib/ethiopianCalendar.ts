/**
 * Ethiopian (Ethiopic) calendar — Beyene–Kudlek / JDN conversion.
 * 13 months: 1–12 have 30 days; Pagumen (13) has 5 days (6 in leap years).
 * Leap year when year % 4 === 3.
 */

export type EthDate = { year: number; month: number; day: number }
export type GregDate = { year: number; month: number; day: number }

/** Amete Mihret (ዓ/ም) epoch offset used by Beyene–Kudlek. */
const JD_EPOCH_OFFSET_AMETE_MIHRET = 1723856

export const ETHIOPIAN_MONTHS_AM = [
  'መስከረም',
  'ጥቅምት',
  'ኅዳር',
  'ታኅሣሥ',
  'ጥር',
  'የካቲት',
  'መጋቢት',
  'ሚያዝያ',
  'ግንቦት',
  'ሰኔ',
  'ሐምሌ',
  'ነሐሴ',
  'ጳጉሜን',
] as const

export const ETHIOPIAN_WEEKDAYS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const

export function isEthiopianLeapYear(year: number): boolean {
  return year % 4 === 3
}

export function ethiopianDaysInMonth(year: number, month: number): number {
  if (month < 1 || month > 13) return 0
  if (month === 13) return isEthiopianLeapYear(year) ? 6 : 5
  return 30
}

function gregorianToJdn(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12)
  const y = year + 4800 - a
  const m = month + 12 * a - 3
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  )
}

function jdnToGregorian(jdn: number): GregDate {
  const a = jdn + 32044
  const b = Math.floor((4 * a + 3) / 146097)
  const c = a - Math.floor((146097 * b) / 4)
  const d = Math.floor((4 * c + 3) / 1461)
  const e = c - Math.floor((1461 * d) / 4)
  const m = Math.floor((5 * e + 2) / 153)
  const day = e - Math.floor((153 * m + 2) / 5) + 1
  const month = m + 3 - 12 * Math.floor(m / 10)
  const year = 100 * b + d - 4800 + Math.floor(m / 10)
  return { year, month, day }
}

function ethiopianToJdn(year: number, month: number, day: number): number {
  return (
    JD_EPOCH_OFFSET_AMETE_MIHRET +
    365 +
    365 * (year - 1) +
    Math.floor(year / 4) +
    30 * month +
    day -
    31
  )
}

function jdnToEthiopian(jdn: number): EthDate {
  const r = (jdn - JD_EPOCH_OFFSET_AMETE_MIHRET) % 1461
  const n = (r % 365) + 365 * Math.floor(r / 1460)
  const year =
    4 * Math.floor((jdn - JD_EPOCH_OFFSET_AMETE_MIHRET) / 1461) +
    Math.floor(r / 365) -
    Math.floor(r / 1460)
  const month = Math.floor(n / 30) + 1
  const day = (n % 30) + 1
  return { year, month, day }
}

export function ethiopianToGregorian(eth: EthDate): GregDate {
  return jdnToGregorian(ethiopianToJdn(eth.year, eth.month, eth.day))
}

export function gregorianToEthiopian(greg: GregDate): EthDate {
  return jdnToEthiopian(gregorianToJdn(greg.year, greg.month, greg.day))
}

/** Parse Addis-local Gregorian `YYYY-MM-DD` into Ethiopian. */
export function gregorianIsoToEthiopian(dateIso: string): EthDate | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) return null
  const [year, month, day] = dateIso.split('-').map(Number)
  return gregorianToEthiopian({ year, month, day })
}

/** Convert Ethiopian date to Gregorian `YYYY-MM-DD` (for form storage / API). */
export function ethiopianToGregorianIso(eth: EthDate): string {
  const g = ethiopianToGregorian(eth)
  return `${g.year}-${String(g.month).padStart(2, '0')}-${String(g.day).padStart(2, '0')}`
}

export function todayEthiopian(at = new Date()): EthDate {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Addis_Ababa',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(at)
  const year = Number(parts.find((p) => p.type === 'year')?.value)
  const month = Number(parts.find((p) => p.type === 'month')?.value)
  const day = Number(parts.find((p) => p.type === 'day')?.value)
  return gregorianToEthiopian({ year, month, day })
}

export function formatEthiopianDateAm(eth: EthDate): string {
  const monthName = ETHIOPIAN_MONTHS_AM[eth.month - 1] ?? String(eth.month)
  return `${monthName} ${eth.day}፣ ${eth.year}`
}

export function addEthiopianMonths(eth: EthDate, delta: number): EthDate {
  let year = eth.year
  let month = eth.month + delta
  while (month > 13) {
    month -= 13
    year += 1
  }
  while (month < 1) {
    month += 13
    year -= 1
  }
  const maxDay = ethiopianDaysInMonth(year, month)
  return { year, month, day: Math.min(eth.day, maxDay) }
}

/** Weekday index 0=Sunday for Ethiopian date. */
export function ethiopianWeekday(eth: EthDate): number {
  const g = ethiopianToGregorian(eth)
  return new Date(Date.UTC(g.year, g.month - 1, g.day)).getUTCDay()
}

export function compareEthDates(a: EthDate, b: EthDate): number {
  if (a.year !== b.year) return a.year - b.year
  if (a.month !== b.month) return a.month - b.month
  return a.day - b.day
}

export function ethDatesEqual(a: EthDate, b: EthDate): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day
}
