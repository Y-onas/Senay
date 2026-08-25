import { useState, type ReactNode } from 'react'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  EthiopianDatePicker,
  formatEthiopianFieldValue,
} from '@/components/common/EthiopianDatePicker'

interface BaseProps {
  label: string
  name: string
  error?: string
  required?: boolean
  hint?: string
  className?: string
}

const baseInput =
  'w-full rounded-xl border border-burgundy/15 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-burgundy focus:ring-2 focus:ring-burgundy/20'

function Wrapper({
  label,
  name,
  error,
  required,
  hint,
  className,
  children,
}: BaseProps & { children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-burgundy">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  )
}

type InputProps = BaseProps &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name'>

export function TextField({
  label,
  name,
  error,
  required,
  hint,
  className,
  ...props
}: InputProps) {
  return (
    <Wrapper
      label={label}
      name={name}
      error={error}
      required={required}
      hint={hint}
      className={className}
    >
      <input
        id={name}
        name={name}
        required={required}
        className={cn(baseInput, error && 'border-destructive focus:border-destructive')}
        {...props}
      />
    </Wrapper>
  )
}

type TextAreaProps = BaseProps &
  Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'name'>

export function TextAreaField({
  label,
  name,
  error,
  required,
  hint,
  className,
  ...props
}: TextAreaProps) {
  return (
    <Wrapper
      label={label}
      name={name}
      error={error}
      required={required}
      hint={hint}
      className={className}
    >
      <textarea
        id={name}
        name={name}
        required={required}
        rows={4}
        className={cn(baseInput, 'resize-none', error && 'border-destructive focus:border-destructive')}
        {...props}
      />
    </Wrapper>
  )
}

type DateFieldProps = BaseProps & {
  value: string
  onChange: (value: string) => void
  min?: string
  placeholder?: string
}

export function DateField({
  label,
  name,
  error,
  required,
  hint,
  className,
  value,
  onChange,
  min,
  placeholder = 'ቀን ይምረጡ',
}: DateFieldProps) {
  const [open, setOpen] = useState(false)
  const formatted = value ? formatEthiopianFieldValue(value) : ''

  return (
    <Wrapper
      label={label}
      name={name}
      error={error}
      required={required}
      hint={hint}
      className={className}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            id={name}
            className={cn(
              baseInput,
              'flex items-center justify-between text-left',
              !value && 'text-gray-400',
              error && 'border-destructive focus:border-destructive',
            )}
          >
            <span>{formatted || placeholder}</span>
            <CalendarIcon className="h-4 w-4 text-gray-500" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto border-0 bg-transparent p-0 shadow-none" align="start">
          <EthiopianDatePicker
            value={value}
            min={min}
            onChange={(next) => {
              onChange(next)
              if (next) setOpen(false)
            }}
            onClear={() => setOpen(false)}
            onSelectToday={() => setOpen(false)}
          />
        </PopoverContent>
      </Popover>
      <input type="hidden" name={name} value={value} required={required} />
    </Wrapper>
  )
}
