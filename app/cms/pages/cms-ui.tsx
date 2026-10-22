import { useEffect, useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getLocalizedValue, setLocalizedValue } from '@/cms/i18n'

/** Common site images — quick pick for non-technical editors */
export const SITE_IMAGES = [
  { path: '/images/tela-clean.png', label: 'House Tela' },
  { path: '/images/shiro-clean.png', label: 'Shiro' },
  { path: '/images/senay-tej-cut.png', label: 'Tej' },
  { path: '/images/berbere-clean.png', label: 'Berbere' },
  { path: '/images/foodreference.png', label: 'Mesob platter' },
  { path: '/images/chef-video.mp4', label: 'Chef video' },
]

export function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs leading-relaxed text-gray-500">{children}</p>
}

export function FormField({
  label,
  children,
  hint,
  error,
  required,
  className,
}: {
  label: string
  children: React.ReactNode
  hint?: string
  error?: string
  required?: boolean
  className?: string
}) {
  return (
    <label className={cn('block', className)}>
      <span className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </label>
  )
}

export function LocalizedInput({
  label,
  value,
  onChange,
  enPlaceholder,
  amPlaceholder,
  required,
  className,
  commitOnBlur = false,
}: {
  label: string
  value: unknown
  onChange: (next: Partial<Record<string, string>>) => void
  enPlaceholder?: string
  amPlaceholder?: string
  required?: boolean
  className?: string
  commitOnBlur?: boolean
}) {
  const [en, setEn] = useState(getLocalizedValue(value, 'en'))
  const [am, setAm] = useState(getLocalizedValue(value, 'am'))

  useEffect(() => {
    setEn(getLocalizedValue(value, 'en'))
    setAm(getLocalizedValue(value, 'am'))
  }, [value])

  const commit = (nextEn: string, nextAm: string) => {
    const withEn = setLocalizedValue(value, 'en', nextEn)
    const withAm = setLocalizedValue(withEn, 'am', nextAm)
    onChange(withAm)
  }

  return (
    <FormField label={label} required={required} className={className}>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          EN
          <input
            className={inputClass()}
            value={en}
            placeholder={enPlaceholder}
            onChange={(e) => {
              const next = e.target.value
              setEn(next)
              if (!commitOnBlur) commit(next, am)
            }}
            onBlur={() => {
              if (commitOnBlur) commit(en, am)
            }}
          />
        </label>
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          AM
          <input
            className={inputClass()}
            value={am}
            placeholder={amPlaceholder}
            onChange={(e) => {
              const next = e.target.value
              setAm(next)
              if (!commitOnBlur) commit(en, next)
            }}
            onBlur={() => {
              if (commitOnBlur) commit(en, am)
            }}
          />
        </label>
      </div>
    </FormField>
  )
}

export function LocalizedTextarea({
  label,
  value,
  onChange,
  rows = 3,
  enPlaceholder,
  amPlaceholder,
  className,
  commitOnBlur = false,
}: {
  label: string
  value: unknown
  onChange: (next: Partial<Record<string, string>>) => void
  rows?: number
  enPlaceholder?: string
  amPlaceholder?: string
  className?: string
  commitOnBlur?: boolean
}) {
  const [en, setEn] = useState(getLocalizedValue(value, 'en'))
  const [am, setAm] = useState(getLocalizedValue(value, 'am'))

  useEffect(() => {
    setEn(getLocalizedValue(value, 'en'))
    setAm(getLocalizedValue(value, 'am'))
  }, [value])

  const commit = (nextEn: string, nextAm: string) => {
    const withEn = setLocalizedValue(value, 'en', nextEn)
    const withAm = setLocalizedValue(withEn, 'am', nextAm)
    onChange(withAm)
  }

  return (
    <FormField label={label} className={className}>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          EN
          <textarea
            className={inputClass()}
            rows={rows}
            value={en}
            placeholder={enPlaceholder}
            onChange={(e) => {
              const next = e.target.value
              setEn(next)
              if (!commitOnBlur) commit(next, am)
            }}
            onBlur={() => {
              if (commitOnBlur) commit(en, am)
            }}
          />
        </label>
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          AM
          <textarea
            className={inputClass()}
            rows={rows}
            value={am}
            placeholder={amPlaceholder}
            onChange={(e) => {
              const next = e.target.value
              setAm(next)
              if (!commitOnBlur) commit(en, next)
            }}
            onBlur={() => {
              if (commitOnBlur) commit(en, am)
            }}
          />
        </label>
      </div>
    </FormField>
  )
}

export function inputClass({
  error,
  small,
}: {
  error?: boolean
  small?: boolean
} = {}) {
  return cn(
    'w-full rounded-xl border bg-white px-3 text-gray-900 transition focus:border-burgundy focus:outline-none focus:ring-2 focus:ring-burgundy/10',
    small ? 'py-1.5 text-xs' : 'py-2.5 text-sm',
    error ? 'border-red-300' : 'border-gray-200',
  )
}

export function SectionPanel({
  title,
  description,
  defaultOpen = false,
  children,
  badge,
  action,
}: {
  title: string
  description?: string
  defaultOpen?: boolean
  badge?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="overflow-hidden rounded-2xl border border-burgundy/10 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-burgundy/[0.02]"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-base uppercase tracking-wide">{title}</h2>
            {badge && (
              <span className="rounded-full bg-burgundy/10 px-2 py-0.5 text-[10px] font-medium uppercase text-burgundy">
                {badge}
              </span>
            )}
          </div>
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {action}
          {open ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
          )}
        </div>
      </button>
      {open && <div className="space-y-4 border-t border-burgundy/5 px-5 py-4">{children}</div>}
    </section>
  )
}

export function StickySaveBar({
  label = 'Save changes',
  saving,
  dirty,
  onSave,
  onCancel,
  msg,
}: {
  label?: string
  saving?: boolean
  dirty?: boolean
  onSave: () => void
  onCancel?: () => void
  msg?: string
}) {
  return (
    <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-burgundy/15 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
      <div>
        <p className="text-sm font-medium text-gray-800">
          {dirty ? 'You have unsaved changes' : 'All changes saved'}
        </p>
        {msg && <p className="text-xs text-green-700">{msg}</p>}
      </div>
      <div className="flex items-center gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !dirty}
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Saving…' : label}
        </button>
      </div>
    </div>
  )
}

export function ImageField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  hint?: string
}) {
  return (
    <FormField label={label} hint={hint}>
      <div className="flex gap-3">
        {value && !value.endsWith('.mp4') && (
          <img
            src={value}
            alt=""
            className="h-16 w-16 shrink-0 rounded-lg border object-cover"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <input
            className={inputClass()}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/images/your-photo.png"
          />
          <div className="flex flex-wrap gap-1.5">
            {SITE_IMAGES.filter((i) => !i.path.endsWith('.mp4')).map((img) => (
              <button
                key={img.path}
                type="button"
                onClick={() => onChange(img.path)}
                className={cn(
                  'rounded-lg border px-2 py-1 text-xs transition',
                  value === img.path
                    ? 'border-burgundy bg-burgundy/10 text-burgundy'
                    : 'border-gray-200 hover:border-burgundy/30',
                )}
              >
                {img.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </FormField>
  )
}

export function DeleteButton({
  label = 'Remove',
  onConfirm,
  small,
}: {
  label?: string
  onConfirm: () => void
  small?: boolean
}) {
  return (
    <button
      type="button"
      onClick={() => {
        if (confirm(`Remove this item?`)) onConfirm()
      }}
      className={cn(
        'inline-flex items-center gap-1 text-red-600 hover:text-red-700',
        small ? 'text-xs' : 'text-sm',
      )}
    >
      <Trash2 className={cn('shrink-0', small ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
      {label}
    </button>
  )
}

export function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full bg-burgundy px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-burgundy-light"
    >
      <Plus className="h-4 w-4" />
      {label}
    </button>
  )
}

export function AddRowButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-dashed border-burgundy/25 px-4 py-2 text-sm text-burgundy hover:bg-burgundy/[0.03]"
    >
      + {label}
    </button>
  )
}

export function Toolbar({
  search,
  onSearch,
  searchPlaceholder = 'Search…',
  children,
  action,
}: {
  search?: string
  onSearch?: (q: string) => void
  searchPlaceholder?: string
  children?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {onSearch && (
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className={cn(inputClass(), 'pl-9')}
            placeholder={searchPlaceholder}
            value={search ?? ''}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      )}
      {children}
      {action}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  icon?: LucideIcon
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-burgundy/20 bg-white px-6 py-12 text-center">
      {Icon && <Icon className="mb-3 h-10 w-10 text-burgundy/30" />}
      <p className="font-medium text-gray-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function StatusBadge({
  children,
  variant,
}: {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'neutral'
}) {
  const styles = {
    default: 'bg-burgundy/10 text-burgundy',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    neutral: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', styles[variant ?? 'default'])}>
      {children}
    </span>
  )
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="font-display text-lg uppercase">{title}</h3>
        {description && <p className="mt-2 text-sm text-gray-600">{description}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium text-white',
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-burgundy hover:bg-burgundy-light',
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', onKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  useEffect(() => {
    if (open && ref.current) ref.current.focus()
  }, [open])

  if (!open) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={ref}
        tabIndex={-1}
        className={cn(
          'w-full overflow-hidden rounded-2xl bg-white shadow-2xl outline-none',
          sizes[size],
        )}
      >
        <div className="flex items-start justify-between border-b border-burgundy/10 px-6 py-4">
          <div>
            <h3 className="font-display text-lg uppercase">{title}</h3>
            {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-burgundy/10 bg-gray-50 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export function ActionMenu({
  items,
}: {
  items: Array<{
    label: string
    icon?: LucideIcon
    danger?: boolean
    onClick: () => void
  }>
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          {items.map((item, i) => {
            const Icon = item.icon
            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  item.onClick()
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition',
                  item.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50',
                )}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {item.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

type Column<T> = {
  key: string
  header: string
  width?: string
  cell: (row: T, index: number) => React.ReactNode
}

export function DataTable<T>({
  columns,
  rows,
  keyExtractor,
  action,
  loading,
  empty,
}: {
  columns: Column<T>[]
  rows: T[]
  keyExtractor?: (row: T) => string
  action?: (row: T, index: number) => React.ReactNode
  loading?: boolean
  empty?: React.ReactNode
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-burgundy/10 bg-white p-8 text-center text-sm text-gray-500">
        Loading…
      </div>
    )
  }

  if (!loading && rows.length === 0) {
    return empty ?? (
      <div className="rounded-2xl border border-burgundy/10 bg-white p-8 text-center text-sm text-gray-500">
        No items found
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-burgundy/10 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-burgundy/[0.04] text-xs uppercase tracking-wide text-gray-500">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="px-4 py-3 font-medium"
                  style={c.width ? { width: c.width } : undefined}
                >
                  {c.header}
                </th>
              ))}
              {action && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-burgundy/5">
            {rows.map((row, index) => (
              <tr key={keyExtractor ? keyExtractor(row) : index} className="hover:bg-burgundy/[0.02]">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3 align-top">
                    {c.cell(row, index)}
                  </td>
                ))}
                {action && <td className="px-4 py-3 text-right">{action(row, index)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2">
      <span
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition',
          checked ? 'bg-green-600' : 'bg-gray-200',
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white transition',
            checked ? 'translate-x-6' : 'translate-x-1',
          )}
        />
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
      </span>
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  )
}

export function KeyValueList({
  items,
  onChange,
  fieldA,
  fieldB,
  placeholderA,
  placeholderB,
}: {
  items: Array<{ [k: string]: string }>
  onChange: (next: Array<{ [k: string]: string }>) => void
  fieldA: string
  fieldB: string
  placeholderA: string
  placeholderB: string
}) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex flex-wrap items-start gap-2 rounded-xl bg-gray-50 p-3">
          <input
            className="w-24 shrink-0 rounded-lg border border-gray-200 px-2 py-2 text-sm"
            placeholder={placeholderA}
            value={item[fieldA] ?? ''}
            onChange={(e) => {
              const next = [...items]
              next[i] = { ...next[i], [fieldA]: e.target.value }
              onChange(next)
            }}
          />
          <input
            className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2 py-2 text-sm"
            placeholder={placeholderB}
            value={item[fieldB] ?? ''}
            onChange={(e) => {
              const next = [...items]
              next[i] = { ...next[i], [fieldB]: e.target.value }
              onChange(next)
            }}
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="text-xs text-red-600 hover:text-red-700"
          >
            Remove
          </button>
        </div>
      ))}
      <AddRowButton
        label="Add row"
        onClick={() => onChange([...items, { [fieldA]: '', [fieldB]: '' }])}
      />
    </div>
  )
}

export type OfferCardData = {
  id: string
  label?: string
  title: string
  subtitle?: string
  image?: string
  link: string
  linkText: string
  discount?: string
  variant?: 'yellow' | 'green' | 'burgundy'
  tall?: boolean
}

export function OfferCardEditor({
  card,
  onChange,
}: {
  card: OfferCardData
  onChange: (c: OfferCardData) => void
}) {
  const set = (key: keyof OfferCardData, v: string | boolean) => onChange({ ...card, [key]: v })

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Small label">
          <input
            className={inputClass()}
            value={card.label ?? ''}
            onChange={(e) => set('label', e.target.value)}
            placeholder="e.g. House Brew"
          />
        </FormField>
        <FormField label="Headline">
          <input
            className={inputClass()}
            value={card.title}
            onChange={(e) => set('title', e.target.value)}
          />
        </FormField>
        <FormField label="Subtitle (optional)" className="sm:col-span-2">
          <input
            className={inputClass()}
            value={card.subtitle ?? ''}
            onChange={(e) => set('subtitle', e.target.value)}
          />
        </FormField>
        <FormField label="Button text">
          <input
            className={inputClass()}
            value={card.linkText}
            onChange={(e) => set('linkText', e.target.value)}
          />
        </FormField>
        <FormField label="Link (page on site)">
          <select
            className={inputClass()}
            value={card.link}
            onChange={(e) => set('link', e.target.value)}
          >
            <option value="/shop">Drinks shop</option>
            <option value="/menu">Menu</option>
            <option value="/catering">Catering</option>
            <option value="/agelgil">Agelgil</option>
            <option value="/baltina">Baltina</option>
            <option value="/festival">Festival</option>
            <option value="/contact">Contact</option>
          </select>
        </FormField>
        <FormField label="Discount badge">
          <input
            className={inputClass()}
            value={card.discount ?? ''}
            onChange={(e) => set('discount', e.target.value)}
            placeholder="25%"
          />
        </FormField>
        <FormField label="Color style">
          <select
            className={inputClass()}
            value={card.variant ?? 'yellow'}
            onChange={(e) => set('variant', e.target.value)}
          >
            <option value="yellow">Yellow / orange</option>
            <option value="green">Green (with photo)</option>
            <option value="burgundy">Burgundy</option>
          </select>
        </FormField>
        <label className="flex items-center gap-2 text-sm text-gray-700 sm:col-span-2">
          <input
            type="checkbox"
            checked={Boolean(card.tall)}
            onChange={(e) => set('tall', e.target.checked)}
          />
          Large featured card (spans two rows)
        </label>
      </div>
      {(card.variant === 'green' || card.image) && (
        <ImageField
          label="Background image"
          value={card.image ?? ''}
          onChange={(v) => set('image', v)}
          hint="Used on the large green offer card"
        />
      )}
    </div>
  )
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function ViewSiteLink({ path = '/' }: { path?: string }) {
  return (
    <a
      href={path}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-xs text-burgundy hover:underline"
    >
      Preview on website <ExternalLink className="h-3 w-3" />
    </a>
  )
}
