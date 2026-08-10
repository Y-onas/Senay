import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ImageUploader } from '@/components/forms/ImageUploader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { catalogApi } from '@/lib/api'
import { FormField, parseNumber, type CatalogEditorProps } from './shared'

type BeveragePricing = {
  regular: number
  addTela: number
  addTej: number
  addTelaTej: number
  addBerzTej: number
}

function readBeveragePricing(item: { price?: number | null; metadata?: Record<string, unknown> | null }): BeveragePricing {
  const meta = item.metadata ?? {}
  const pricing = (meta.beveragePricing ?? {}) as Record<string, unknown>
  const regular = parseNumber(String(pricing['food-only'] ?? item.price ?? 0))
  const addTela = parseNumber(String(pricing.tela ?? regular)) - regular
  const addTej = parseNumber(String(pricing.tej ?? regular)) - regular
  const addTelaTej = parseNumber(String(pricing['tela-tej'] ?? regular)) - regular
  const addBerzTej = parseNumber(String(pricing['berz-tej'] ?? regular)) - regular
  return { regular, addTela, addTej, addTelaTej, addBerzTej }
}

function buildBeveragePricing(pricing: BeveragePricing) {
  return {
    'food-only': pricing.regular,
    tela: pricing.regular + pricing.addTela,
    tej: pricing.regular + pricing.addTej,
    'tela-tej': pricing.regular + pricing.addTelaTej,
    'berz-tej': pricing.regular + pricing.addBerzTej,
  }
}

export function CateringPackageEditor({ item, onDelete, onSaved, embedded = false }: CatalogEditorProps) {
  const [pkg, setPkg] = useState(item)
  const meta = pkg.metadata ?? {}
  const [mealType, setMealType] = useState(String(meta.mealType ?? 'fasting'))
  const [tier, setTier] = useState(String(meta.tier ?? 'fasting'))
  const [nameAm, setNameAm] = useState(String(meta.nameAm ?? ''))
  const [badge, setBadge] = useState(String(meta.badge ?? ''))
  const [dishes, setDishes] = useState<string[]>(Array.isArray(meta.dishes) ? meta.dishes.map(String) : [])
  const [pricing, setPricing] = useState(() => readBeveragePricing(item))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setPkg(item)
    const nextMeta = item.metadata ?? {}
    setMealType(String(nextMeta.mealType ?? 'fasting'))
    setTier(String(nextMeta.tier ?? 'fasting'))
    setNameAm(String(nextMeta.nameAm ?? ''))
    setBadge(String(nextMeta.badge ?? ''))
    setDishes(Array.isArray(nextMeta.dishes) ? nextMeta.dishes.map(String) : [])
    setPricing(readBeveragePricing(item))
  }, [item])

  const save = async () => {
    setSaving(true)
    try {
      await catalogApi.update(pkg.id, {
        name: pkg.name,
        description: pkg.description,
        image: pkg.image,
        available: pkg.available,
        sortOrder: pkg.sortOrder,
        price: pricing.regular,
        metadata: {
          ...meta,
          mealType,
          tier: mealType === 'fasting' ? 'fasting' : tier,
          nameAm,
          badge: badge || undefined,
          dishes: dishes.map((dish) => dish.trim()).filter(Boolean),
          fixedPricePerGuest: pricing.regular,
          beveragePricing: buildBeveragePricing(pricing),
        },
      })
      toast.success(`${pkg.name} saved`)
      await onSaved()
    } finally {
      setSaving(false)
    }
  }

  const form = (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <FormField label="Name (English)" className="md:col-span-2">
          <Input value={pkg.name} onChange={(e) => setPkg({ ...pkg, name: e.target.value })} />
        </FormField>
        <FormField label="Slug">
          <Input value={pkg.slug} disabled />
        </FormField>
        <FormField label="Name (Amharic)">
          <Input value={nameAm} onChange={(e) => setNameAm(e.target.value)} />
        </FormField>
        <FormField label="Meal type">
          <Select value={mealType} onValueChange={setMealType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fasting">Fasting</SelectItem>
              <SelectItem value="non-fasting">Non-fasting</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Tier">
          <Select value={mealType === 'fasting' ? 'fasting' : tier} onValueChange={setTier}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fasting">Fasting</SelectItem>
              <SelectItem value="platinum">Platinum</SelectItem>
              <SelectItem value="gold">Gold</SelectItem>
              <SelectItem value="silver">Silver</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Badge (optional)">
          <Input value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="Optional" />
        </FormField>
        <div className="md:col-span-2">
          <ImageUploader label="Package image" value={pkg.image || ''} onChange={(url) => setPkg({ ...pkg, image: url || '' })} />
        </div>
        <FormField label="Description" className="md:col-span-2">
          <Textarea rows={2} value={pkg.description || ''} onChange={(e) => setPkg({ ...pkg, description: e.target.value })} />
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-3">
        <FormField label="Regular price (food only)">
          <Input
            type="number"
            value={pricing.regular}
            onChange={(e) => setPricing((prev) => ({ ...prev, regular: parseNumber(e.target.value) }))}
          />
        </FormField>
        <FormField label="Additional Tella">
          <Input
            type="number"
            value={pricing.addTela}
            onChange={(e) => setPricing((prev) => ({ ...prev, addTela: parseNumber(e.target.value) }))}
          />
        </FormField>
        <FormField label="Additional Tej">
          <Input
            type="number"
            value={pricing.addTej}
            onChange={(e) => setPricing((prev) => ({ ...prev, addTej: parseNumber(e.target.value) }))}
          />
        </FormField>
        <FormField label="Additional Tella + Tej">
          <Input
            type="number"
            value={pricing.addTelaTej}
            onChange={(e) => setPricing((prev) => ({ ...prev, addTelaTej: parseNumber(e.target.value) }))}
          />
        </FormField>
        <FormField label="Additional Berz + Tej">
          <Input
            type="number"
            value={pricing.addBerzTej}
            onChange={(e) => setPricing((prev) => ({ ...prev, addBerzTej: parseNumber(e.target.value) }))}
          />
        </FormField>
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <Label>Foods in this package</Label>
          <Button size="sm" variant="secondary" onClick={() => setDishes((rows) => [...rows, ''])}>
            Add food
          </Button>
        </div>
        <div className="space-y-2">
          {dishes.map((dish, index) => (
            <div key={`${pkg.id}-dish-${index}`} className="grid grid-cols-12 gap-2">
              <Input
                className="col-span-11"
                value={dish}
                placeholder={`Food item ${index + 1}`}
                onChange={(e) => setDishes((rows) => rows.map((entry, i) => (i === index ? e.target.value : entry)))}
              />
              <Button size="icon" variant="ghost" className="col-span-1" onClick={() => setDishes((rows) => rows.filter((_, i) => i !== index))}>
                X
              </Button>
            </div>
          ))}
          {!dishes.length ? <p className="text-sm text-brown/60">No foods yet. Add foods for this package.</p> : null}
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
          {pkg.name} <span className="text-xs text-brown/55">(Catering Package)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>{form}</CardContent>
    </Card>
  )
}
