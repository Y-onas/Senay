/** All customer date/time selection is in Ethiopian local time. */
export const ADDIS_TIME_ZONE = 'Africa/Addis_Ababa'
const ETHIOPIAN_LOCALE = 'en-US-u-ca-ethiopic-nu-latn'

export type AddisNow = {
  date: string
  time: string
}

const DATE_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  timeZone: ADDIS_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function part(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): string {
  return parts.find((item) => item.type === type)?.value ?? ''
}

/** Current calendar date (`YYYY-MM-DD`) and clock (`HH:mm`) in Addis Ababa. */
export function getAddisNow(at = new Date()): AddisNow {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: ADDIS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(at)

  const year = part(parts, 'year')
  const month = part(parts, 'month')
  const day = part(parts, 'day')
  let hour = part(parts, 'hour')
  const minute = part(parts, 'minute')
  if (hour === '24') hour = '00'

  return {
    date: `${year}-${month}-${day}`,
    time: `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`,
  }
}

export function isAddisDateInPast(dateIso: string, now: AddisNow = getAddisNow()): boolean {
  return Boolean(dateIso) && dateIso < now.date
}

export function isAddisDateTimeInPast(
  dateIso: string,
  time: string,
  now: AddisNow = getAddisNow(),
): boolean {
  if (!dateIso || !time) return false
  if (dateIso < now.date) return true
  if (dateIso > now.date) return false
  return time < now.time
}

/** `min` for `<input type="date">` — today in Addis Ababa. */
export function addisDateInputMin(now: AddisNow = getAddisNow()): string {
  return now.date
}

/** `min` for `<input type="time">` when the chosen date is today. */
export function addisTimeInputMin(
  dateIso: string,
  now: AddisNow = getAddisNow(),
): string | undefined {
  if (!dateIso || dateIso !== now.date) return undefined
  return now.time
}

export function addisDateError(dateIso: string, now: AddisNow = getAddisNow()): string | null {
  if (!dateIso) return 'Please choose a date.'
  if (isAddisDateInPast(dateIso, now)) {
    return 'That date has already passed. Choose today or a future date.'
  }
  return null
}

export function addisTimeError(
  dateIso: string,
  time: string,
  now: AddisNow = getAddisNow(),
): string | null {
  if (!time) return 'Please choose a time.'
  if (isAddisDateTimeInPast(dateIso, time, now)) {
    return 'That time has already passed. Choose a later time.'
  }
  return null
}

export function formatAddisDate(
  value: string | Date,
  locale: string = ETHIOPIAN_LOCALE,
): string {
  const at = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(at.getTime())) return typeof value === 'string' ? value : ''
  return at.toLocaleDateString(locale, {
    timeZone: ADDIS_TIME_ZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function getEthiopianYear(
  at: Date = new Date(),
  locale: string = ETHIOPIAN_LOCALE,
): string {
  const parts = new Intl.DateTimeFormat(locale, {
    timeZone: ADDIS_TIME_ZONE,
    year: 'numeric',
  }).formatToParts(at)
  return part(parts, 'year') || ''
}

/** Convert `YYYY-MM-DD` input values to Ethiopian calendar display. */
export function formatAddisDateInput(dateIso: string): string {
  if (!dateIso) return ''
  const at = new Date(`${dateIso}T12:00:00+03:00`)
  if (Number.isNaN(at.getTime())) return dateIso
  return formatAddisDate(at)
}

export function formatAddisDateInputAmharic(dateIso: string): string {
  if (!dateIso) return ''
  const at = new Date(`${dateIso}T12:00:00+03:00`)
  if (Number.isNaN(at.getTime())) return dateIso
  return at.toLocaleDateString('am-ET-u-ca-ethiopic-nu-latn', {
    timeZone: ADDIS_TIME_ZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function toAddisDateInputValue(value: string | Date): string {
  const at = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(at.getTime())) return ''
  const parts = DATE_FORMATTER.formatToParts(at)
  const year = part(parts, 'year')
  const month = part(parts, 'month')
  const day = part(parts, 'day')
  return `${year}-${month}-${day}`
}
