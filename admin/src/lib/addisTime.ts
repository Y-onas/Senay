export const ADDIS_TIME_ZONE = 'Africa/Addis_Ababa'
const ADDIS_OFFSET = '+03:00'

function part(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): string {
  return parts.find((item) => item.type === type)?.value ?? ''
}

function asDate(value: string | Date): Date {
  return typeof value === 'string' ? new Date(value) : value
}

export function formatAddisDateTime(
  value: string | Date | null | undefined,
  locale = 'en-GB',
): string {
  if (!value) return '—'
  const at = asDate(value)
  if (Number.isNaN(at.getTime())) return '—'
  return at.toLocaleString(locale, { timeZone: ADDIS_TIME_ZONE })
}

export function formatAddisTime(
  value: Date,
  locale = 'en-GB',
): string {
  return value.toLocaleTimeString(locale, {
    timeZone: ADDIS_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function toAddisDateInputValue(value: string | Date | null | undefined): string {
  if (!value) return ''
  const at = asDate(value)
  if (Number.isNaN(at.getTime())) return ''
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: ADDIS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(at)
  const year = part(parts, 'year')
  const month = part(parts, 'month')
  const day = part(parts, 'day')
  return `${year}-${month}-${day}`
}

export function toAddisDateTimeInputValue(value: string | Date | null | undefined): string {
  if (!value) return ''
  const at = asDate(value)
  if (Number.isNaN(at.getTime())) return ''
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
  const hour = part(parts, 'hour').padStart(2, '0')
  const minute = part(parts, 'minute').padStart(2, '0')
  return `${year}-${month}-${day}T${hour}:${minute}`
}

export function addisDateInputToIso(dateInput: string | undefined): string | undefined {
  if (!dateInput) return undefined
  return new Date(`${dateInput}T12:00:00${ADDIS_OFFSET}`).toISOString()
}

export function addisDateTimeInputToIso(dateTimeInput: string): string | null {
  if (!dateTimeInput) return null
  return new Date(`${dateTimeInput}:00${ADDIS_OFFSET}`).toISOString()
}

