import { useEffect, useState } from 'react'
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

/** Accessible +/- quantity control. Customers can also type a number. */
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
  const [draft, setDraft] = useState(String(value))

  useEffect(() => {
    setDraft(String(value))
  }, [value])

  const minDigits = String(Math.max(0, Math.floor(min))).length
  const round = (n: number) => (step >= 1 ? Math.round(n) : Math.round(n * 100) / 100)
  const clamp = (n: number) => {
    let next = round(n)
    if (next < min) next = min
    if (max !== undefined && next > max) next = max
    return next
  }

  const commit = (raw: string) => {
    const parsed = Number(raw)
    if (!Number.isFinite(parsed)) {
      setDraft(String(value))
      return
    }
    const next = clamp(parsed)
    setDraft(String(next))
    onChange(next)
  }

  const handleTyped = (raw: string) => {
    if (raw === '' || raw === '-') {
      setDraft(raw)
      return
    }

    const parsed = Number(raw)
    if (!Number.isFinite(parsed)) return

    const typedDigits = String(Math.floor(Math.abs(parsed))).length
    if (parsed < min && typedDigits >= minDigits) {
      setDraft(String(min))
      onChange(min)
      return
    }

    setDraft(raw)
    if (parsed >= min && (max === undefined || parsed <= max)) {
      onChange(clamp(parsed))
    }
  }

  const dec = () => onChange(clamp(value - step))
  const inc = () => onChange(clamp(value + step))

  const btn = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
  const inputWidth = suffix ? 'w-16' : 'w-14'

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
      <div className="flex min-w-[3.25rem] items-center justify-center">
        <input
          type="number"
          inputMode={step < 1 ? 'decimal' : 'numeric'}
          min={min}
          max={max}
          step={step}
          value={draft}
          aria-label="Quantity"
          onChange={(e) => handleTyped(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              e.currentTarget.blur()
            }
            if (e.key === 'ArrowDown' && value <= min) {
              e.preventDefault()
            }
          }}
          className={cn(
            'bg-transparent text-center font-semibold text-gray-900 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
            inputWidth,
            size === 'sm' && 'text-sm',
          )}
        />
        {suffix ? (
          <span className={cn('pr-1 font-semibold text-gray-900', size === 'sm' && 'text-sm')}>
            {suffix}
          </span>
        ) : null}
      </div>
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
