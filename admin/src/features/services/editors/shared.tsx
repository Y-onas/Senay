import type { ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { CatalogItem } from '@/lib/api'

export type CatalogEditorProps = {
  item: CatalogItem
  onDelete: (id: string) => void | Promise<void>
  onSaved: () => void | Promise<void>
  embedded?: boolean
}

export const BALTINA_CATEGORIES = [
  { value: 'spices', label: 'Spices' },
  { value: 'flours', label: 'Flours' },
  { value: 'mixes', label: 'Traditional Mixes' },
] as const

export function parseNumber(value: string | number): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

export function readI18n(item: CatalogItem, field: 'name' | 'description', lang: 'en' | 'am'): string {
  const map = item[`${field}I18n`]
  if (map && typeof map === 'object' && typeof map[lang] === 'string' && map[lang]) return map[lang]
  return lang === 'en' ? item[field] || '' : ''
}

export function FormField({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label>{label}</Label>
      {children}
    </div>
  )
}

export function LocalePair({
  label,
  enValue,
  amValue,
  onEn,
  onAm,
  enPlaceholder,
  amPlaceholder,
}: {
  label: string
  enValue: string
  amValue: string
  onEn: (value: string) => void
  onAm: (value: string) => void
  enPlaceholder?: string
  amPlaceholder?: string
}) {
  return (
    <div className="space-y-2 md:col-span-2">
      <Label>{label}</Label>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brown/50">EN</p>
          <Input value={enValue} placeholder={enPlaceholder} onChange={(e) => onEn(e.target.value)} />
        </div>
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brown/50">AM</p>
          <Input value={amValue} placeholder={amPlaceholder} onChange={(e) => onAm(e.target.value)} />
        </div>
      </div>
    </div>
  )
}
