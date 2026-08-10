import type { Unit } from '@/types'
import { CURRENCY } from '@/data/restaurant'

/** Format a number as Ethiopian Birr (or the provided currency). */
export function formatPrice(amount: number, currency: string = CURRENCY): string {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
  return `${formatted} ${currency}`
}

/** Short unit label for display, e.g. "/L", "/kg". */
export function unitLabel(unit: Unit): string {
  switch (unit) {
    case 'liter':
      return '/L'
    case 'kg':
      return '/kg'
    case 'pack':
      return '/pack'
    case 'piece':
    default:
      return ' each'
  }
}

/** Short unit suffix for quantity controls, e.g. "L", "kg", "pack". */
export function unitSuffix(unit: Unit): string {
  switch (unit) {
    case 'liter':
      return 'L'
    case 'kg':
      return 'kg'
    case 'pack':
      return 'pack'
    case 'piece':
    default:
      return 'pc'
  }
}

/** Pluralised unit for quantity display, e.g. "2 L", "1.5 kg". */
export function formatQuantity(quantity: number, unit: Unit): string {
  return `${quantity} ${unitSuffix(unit)}`
}
