import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { catalogApi } from '@/lib/api'
import { FormField, type CatalogEditorProps } from './shared'

const FESTIVAL_ICONS = [
  { value: 'chicken', label: 'Chicken' },
  { value: 'eggs', label: 'Eggs' },
  { value: 'injera', label: 'Injera' },
  { value: 'bread', label: 'Bread' },
  { value: 'cheese', label: 'Cheese' },
  { value: 'oil', label: 'Oil' },
  { value: 'drink', label: 'Drink' },
] as const

type FestivalItem = {
  id: string
  label: string
  icon: string
  choice?: string[]
}

function slugifyLabel(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function FestivalPackageEditor({ item, onDelete, onSaved, embedded = false }: CatalogEditorProps) {
  const [pkg, setPkg] = useState(item)
  const meta = pkg.metadata ?? {}
  const [tagline, setTagline] = useState(String(meta.tagline ?? item.description ?? ''))
  const [badge, setBadge] = useState(String(meta.badge ?? ''))
  const [items, setItems] = useState<FestivalItem[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setPkg(item)
    const nextMeta = item.metadata ?? {}
    setTagline(String(nextMeta.tagline ?? item.description ?? ''))
    setBadge(String(nextMeta.badge ?? ''))
    const list = Array.isArray(nextMeta.items) ? nextMeta.items : []
    setItems(
      list.map((row, index) => ({
        id: String((row as FestivalItem).id ?? `item-${index}`),
        label: String((row as FestivalItem).label ?? ''),
        icon: String((row as FestivalItem).icon ?? 'chicken'),
        choice: Array.isArray((row as FestivalItem).choice) ? (row as FestivalItem).choice : undefined,
      })),
    )
  }, [item])

  const save = async () => {
    setSaving(true)
    try {
      const nextItems = items
        .map((row, index) => ({
          id: row.id.trim() || slugifyLabel(row.label) || `item-${index + 1}`,
          label: row.label.trim(),
          icon: row.icon,
          choice: row.choice?.length ? row.choice : undefined,
        }))
        .filter((row) => row.label)

      await catalogApi.update(pkg.id, {
        name: pkg.name,
        description: tagline.trim(),
        image: pkg.image,
        available: pkg.available,
        sortOrder: pkg.sortOrder,
        price: pkg.price,
        metadata: {
          ...meta,
          tagline: tagline.trim(),
          badge: badge || undefined,
          items: nextItems,
        },
      })
      toast.success(`${pkg.name} saved`)
      await onSaved()
    } finally {
      setSaving(false)
    }
  }

  const form = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <FormField label="Package name" className="md:col-span-2">
          <Input value={pkg.name} onChange={(e) => setPkg({ ...pkg, name: e.target.value })} />
        </FormField>
        <FormField label="Slug">
          <Input value={pkg.slug} disabled />
        </FormField>
        <FormField label="Price">
          <Input
            type="number"
            value={pkg.price ?? ''}
            onChange={(e) => setPkg({ ...pkg, price: e.target.value ? Number(e.target.value) : 0 })}
          />
        </FormField>
        <FormField label="Tagline" className="md:col-span-2">
          <Input value={tagline} onChange={(e) => setTagline(e.target.value)} />
        </FormField>
        <FormField label="Badge">
          <Select value={badge} onValueChange={setBadge}>
            <SelectTrigger>
              <SelectValue placeholder="Optional badge" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              <SelectItem value="Best Value">Best Value</SelectItem>
              <SelectItem value="Most Popular">Most Popular</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <Label>Package item list</Label>
          <Button size="sm" variant="secondary" onClick={() => setItems((rows) => [...rows, { id: '', label: '', icon: 'chicken' }])}>
            Add item
          </Button>
        </div>
        <div className="space-y-2">
          {items.map((row, index) => (
            <div key={`${pkg.id}-festival-item-${index}`} className="grid grid-cols-1 gap-2 rounded-md border p-2 md:grid-cols-12">
              <Input
                className="md:col-span-2"
                placeholder="id (optional)"
                value={row.id}
                onChange={(e) =>
                  setItems((rows) => rows.map((entry, i) => (i === index ? { ...entry, id: e.target.value } : entry)))
                }
              />
              <Input
                className="md:col-span-5"
                placeholder="Item label"
                value={row.label}
                onChange={(e) =>
                  setItems((rows) => rows.map((entry, i) => (i === index ? { ...entry, label: e.target.value } : entry)))
                }
              />
              <Select
                value={row.icon}
                onValueChange={(value) =>
                  setItems((rows) => rows.map((entry, i) => (i === index ? { ...entry, icon: value } : entry)))
                }
              >
                <SelectTrigger className="md:col-span-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FESTIVAL_ICONS.map((icon) => (
                    <SelectItem key={icon.value} value={icon.value}>
                      {icon.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="md:col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!row.choice?.length}
                  onChange={(e) =>
                    setItems((rows) =>
                      rows.map((entry, i) =>
                        i === index ? { ...entry, choice: e.target.checked ? ['tej', 'berz'] : undefined } : entry,
                      ),
                    )
                  }
                />
                <Label className="font-normal">Drink choice</Label>
              </div>
              <Button
                className="md:col-span-1"
                variant="ghost"
                onClick={() => setItems((rows) => rows.filter((_, i) => i !== index))}
              >
                X
              </Button>
            </div>
          ))}
          {!items.length ? <p className="text-sm text-brown/60">No package items yet.</p> : null}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border/60 pt-4">
        <div className="flex items-center gap-2">
          <Switch checked={pkg.available} onCheckedChange={(available) => setPkg({ ...pkg, available })} />
          <span className="text-sm">Available</span>
        </div>
        <div className="flex gap-2">
          <Button onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save package'}
          </Button>
          <Button variant="destructive" onClick={() => onDelete(pkg.id)} className="gap-2">
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  )

  if (embedded) return form

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {pkg.name} <span className="text-xs text-brown/55">(Festival Package)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>{form}</CardContent>
    </Card>
  )
}
