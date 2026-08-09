import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuantityStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  step?: number
  max?: number
  /** Suffix shown after the value, e.g. "L" or "kg". */
  suffix?: string
  size?: 'sm' | 'md'
  className?: string
}

/** Accessible +/- quantity control supporting fractional steps (kg, liters). */
export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  step = 1,
  max,
  suffix,
  size = 'md',
  className,
}: QuantityStepperProps) {
  const round = (n: number) => Math.round(n * 100) / 100
  const dec = () => onChange(round(Math.max(min, value - step)))
  const inc = () => onChange(round(max ? Math.min(max, value + step) : value + step))

  const btn =
    size === 'sm'
      ? 'h-8 w-8'
      : 'h-10 w-10'

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border border-burgundy/20 bg-white',
        className,
      )}
    >
      <button
        type="button"
        onClick={dec}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className={cn(
          'flex items-center justify-center rounded-full text-burgundy transition-colors hover:bg-burgundy/10 disabled:opacity-30',
          btn,
        )}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span
        className={cn(
          'min-w-[3.25rem] select-none text-center font-semibold text-gray-900',
          size === 'sm' && 'text-sm',
        )}
      >
        {value}
        {suffix ? ` ${suffix}` : ''}
      </span>
      <button
        type="button"
        onClick={inc}
        disabled={max !== undefined && value >= max}
        aria-label="Increase quantity"
        className={cn(
          'flex items-center justify-center rounded-full text-burgundy transition-colors hover:bg-burgundy/10 disabled:opacity-30',
          btn,
        )}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}
