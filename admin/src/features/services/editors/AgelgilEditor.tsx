import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { catalogApi, type CatalogItem } from '@/lib/api'
import { FormField, parseNumber } from './shared'

type Props = {
  item: CatalogItem
  onSaved: () => void | Promise<void>
  onDelete: (id: string) => void | Promise<void>
}

type MenuEntry = { label: string; dishes: string[] }

function normalizeMenus(raw: unknown): Record<string, MenuEntry> {
  if (!raw || typeof raw !== 'object') return {}
  const obj = raw as Record<string, unknown>
  if (obj['fasting-regular'] || obj['fasting-special']) return obj as Record<string, MenuEntry>
  const out: Record<string, MenuEntry> = {}
  for (const meal of ['fasting', 'non-fasting'] as const) {
    const group = obj[meal]
    if (!group || typeof group !== 'object') continue
    const groupObj = group as Record<string, unknown>
    for (const kind of ['regular', 'special'] as const) {
      const entry = groupObj[kind]
      if (entry && typeof entry === 'object') {
        const entryObj = entry as Record<string, unknown>
        out[`${meal}-${kind}`] = {
          label: typeof entryObj.label === 'string' ? entryObj.label : '',
          dishes: Array.isArray(entryObj.dishes) ? (entryObj.dishes as string[]) : [],
        }
      }
    }
  }
  return out
}

const SIZES = [10, 15, 20, 30]
const PACKAGES = [
  { label: 'Fasting Regular', mealType: 'fasting', kind: 'regular' },
  { label: 'Fasting Special', mealType: 'fasting', kind: 'special' },
  { label: 'Non-fasting Regular', mealType: 'non-fasting', kind: 'regular' },
  { label: 'Non-fasting Special', mealType: 'non-fasting', kind: 'special' },
] as const

export function AgelgilEditor({ item, onSaved, onDelete }: Props) {
  const [row, setRow] = useState(() => {
    const meta = item.metadata ?? {}
    return {
      ...item,
      metadata: {
        ...meta,
        priceTable: (meta.priceTable as Record<string, Record<string, number>>) ?? {},
        menus: normalizeMenus(meta.menus),
      },
    }
  })
  const [saving, setSaving] = useState(false)
  const meta = row.metadata ?? {}
  const priceTable = (meta.priceTable as Record<string, Record<string, number>>) ?? {}
  const menus = (meta.menus as Record<string, MenuEntry>) ?? {}

  useEffect(() => {
    const nextMeta = item.metadata ?? {}
    setRow({
      ...item,
      metadata: {
        ...nextMeta,
        priceTable: (nextMeta.priceTable as Record<string, Record<string, number>>) ?? {},
        menus: normalizeMenus(nextMeta.menus),
      },
    })
  }, [item])

  const menuKey = (mealType: string, kind: string) => `${mealType}-${kind}`

  const readPrice = (mealType: string, kind: string, size: number) => {
    const key = menuKey(mealType, kind)
    return parseNumber(priceTable[key]?.[String(size)] ?? 0)
  }

  const setPrice = (mealType: string, kind: string, size: number, value: number) => {
    const key = menuKey(mealType, kind)
    const nextTable = {
      ...priceTable,
      [key]: { ...(priceTable[key] ?? {}), [String(size)]: value },
    }
    setRow((prev) => ({
      ...prev,
      metadata: { ...prev.metadata, priceTable: nextTable },
    }))
  }

  const readLabel = (mealType: string, kind: string, fallback: string) =>
    String(menus[menuKey(mealType, kind)]?.label ?? fallback)

  const readDishes = (mealType: string, kind: string) =>
    (menus[menuKey(mealType, kind)]?.dishes ?? []).join('\n')

  const setMenu = (mealType: string, kind: string, label: string, dishesText: string) => {
    const key = menuKey(mealType, kind)
    const dishes = dishesText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    const nextMenus = { ...menus, [key]: { label, dishes } }
    setRow((prev) => ({
      ...prev,
      metadata: { ...prev.metadata, menus: nextMenus },
    }))
  }

  const save = async () => {
    setSaving(true)
    try {
      await catalogApi.update(row.id, {
        name: row.name,
        description: row.description,
        available: row.available,
        sortOrder: row.sortOrder,
        metadata: row.metadata,
      })
      toast.success('Agelgil pricing saved')
      await onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <FormField label="Config name">
          <Input value={row.name} onChange={(e) => setRow({ ...row, name: e.target.value })} />
        </FormField>
        <FormField label="Description" className="md:col-span-2">
          <Input value={row.description || ''} onChange={(e) => setRow({ ...row, description: e.target.value })} />
        </FormField>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="p-3 text-left">Package type</th>
              {SIZES.map((size) => (
                <th key={size} className="p-3 text-left">
                  {size} people
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PACKAGES.map((pkg) => (
              <tr key={`${pkg.mealType}-${pkg.kind}`} className="border-t">
                <td className="p-3 font-medium">{pkg.label}</td>
                {SIZES.map((size) => (
                  <td key={size} className="p-2">
                    <Input
                      type="number"
                      value={readPrice(pkg.mealType, pkg.kind, size)}
                      onChange={(e) => setPrice(pkg.mealType, pkg.kind, size, parseNumber(e.target.value))}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 rounded-lg border p-4">
        <p className="font-medium">Agelgil Menu Dishes</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {PACKAGES.map((pkg) => {
            const label = readLabel(pkg.mealType, pkg.kind, pkg.label)
            const dishes = readDishes(pkg.mealType, pkg.kind)
            return (
              <div key={`menu-${pkg.label}`} className="space-y-2">
                <Label>{pkg.label} label</Label>
                <Input
                  value={label}
                  onChange={(e) => setMenu(pkg.mealType, pkg.kind, e.target.value, dishes)}
                />
                <Label>{pkg.label} dishes (one per line)</Label>
                <Textarea
                  rows={5}
                  value={dishes}
                  onChange={(e) => setMenu(pkg.mealType, pkg.kind, label, e.target.value)}
                />
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch checked={row.available} onCheckedChange={(next) => setRow({ ...row, available: next })} />
          <span className="text-sm">Available</span>
        </div>
        <div className="flex gap-2">
          <Button onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save Agelgil pricing'}
          </Button>
          <Button variant="destructive" onClick={() => onDelete(row.id)}>
            Delete config
          </Button>
        </div>
      </div>
    </div>
  )
}
