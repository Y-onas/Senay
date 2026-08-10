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
import {
  BALTINA_CATEGORIES,
  FormField,
  LocalePair,
  parseNumber,
  readI18n,
  type CatalogEditorProps,
} from './shared'

export function BaltinaProductEditor({ item, onDelete, onSaved, embedded = false }: CatalogEditorProps) {
  const [product, setProduct] = useState(item)
  const meta = product.metadata ?? {}
  const [category, setCategory] = useState(String(meta.category || 'flours'))
  const [unit, setUnit] = useState(String(meta.unit ?? 'kg'))
  const [minQty, setMinQty] = useState(String(meta.minQty ?? 0.5))
  const [step, setStep] = useState(String(meta.step ?? 0.5))
  const [saving, setSaving] = useState(false)
  const [nameEn, setNameEn] = useState(() => readI18n(item, 'name', 'en'))
  const [nameAm, setNameAm] = useState(() => readI18n(item, 'name', 'am'))
  const [descEn, setDescEn] = useState(() => readI18n(item, 'description', 'en'))
  const [descAm, setDescAm] = useState(() => readI18n(item, 'description', 'am'))

  useEffect(() => {
    setProduct(item)
    const nextMeta = item.metadata ?? {}
    setCategory(String(nextMeta.category || 'flours'))
    setUnit(String(nextMeta.unit ?? 'kg'))
    setMinQty(String(nextMeta.minQty ?? 0.5))
    setStep(String(nextMeta.step ?? 0.5))
    setNameEn(readI18n(item, 'name', 'en'))
    setNameAm(readI18n(item, 'name', 'am'))
    setDescEn(readI18n(item, 'description', 'en'))
    setDescAm(readI18n(item, 'description', 'am'))
  }, [item])

  const save = async () => {
    setSaving(true)
    try {
      await catalogApi.update(product.id, {
        name: nameEn.trim() || product.name,
        nameI18n: { en: nameEn.trim(), am: nameAm.trim() },
        description: descEn.trim(),
        descriptionI18n: { en: descEn.trim(), am: descAm.trim() },
        image: product.image,
        available: product.available,
        sortOrder: product.sortOrder,
        price: product.price,
        metadata: {
          ...meta,
          category,
          unit: unit.trim() || 'kg',
          minQty: parseNumber(minQty),
          step: parseNumber(step),
        },
      })
      toast.success(`${nameEn.trim() || product.name} saved`)
      await onSaved()
    } finally {
      setSaving(false)
    }
  }

  const form = (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <LocalePair
        label="Name"
        enValue={nameEn}
        amValue={nameAm}
        onEn={setNameEn}
        onAm={setNameAm}
        enPlaceholder="Shiro"
        amPlaceholder="ሽሮ"
      />
      <div className="space-y-2 md:col-span-2">
        <Label>Description</Label>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brown/50">EN</p>
            <Textarea
              rows={2}
              value={descEn}
              placeholder="Stone-ground chickpea flour blend…"
              onChange={(e) => setDescEn(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brown/50">AM</p>
            <Textarea
              rows={2}
              value={descAm}
              placeholder="የሽንኩርት አዳቦ ዱቄት…"
              onChange={(e) => setDescAm(e.target.value)}
            />
          </div>
        </div>
      </div>
      <FormField label="Slug">
        <Input value={product.slug || ''} disabled />
      </FormField>
      <FormField label="Price">
        <Input
          type="number"
          value={product.price ?? ''}
          onChange={(e) => setProduct({ ...product, price: e.target.value ? Number(e.target.value) : 0 })}
        />
      </FormField>
      <FormField label="Category">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BALTINA_CATEGORIES.map((row) => (
              <SelectItem key={row.value} value={row.value}>
                {row.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField label="Unit">
        <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
      </FormField>
      <FormField label="Minimum quantity">
        <Input type="number" step="0.1" value={minQty} onChange={(e) => setMinQty(e.target.value)} />
      </FormField>
      <FormField label="Step quantity">
        <Input type="number" step="0.1" value={step} onChange={(e) => setStep(e.target.value)} />
      </FormField>
      <div className="md:col-span-2">
        <ImageUploader
          label="Product image"
          value={product.image}
          onChange={(next) => setProduct({ ...product, image: next })}
        />
      </div>
      <div className="flex items-center justify-between border-t border-border/60 pt-4 md:col-span-2">
        <div className="flex items-center gap-2">
          <Switch
            checked={product.available}
            onCheckedChange={(next) => setProduct({ ...product, available: next })}
          />
          <span className="text-sm">Available</span>
        </div>
        <div className="flex gap-2">
          <Button onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save product'}
          </Button>
          <Button variant="destructive" onClick={() => onDelete(product.id)} className="gap-2">
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
          {nameEn || product.name}{' '}
          <span className="text-xs text-muted-foreground">(Baltina Product)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>{form}</CardContent>
    </Card>
  )
}
