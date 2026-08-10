import { useState } from 'react'
import { Pencil, Plus, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { catalogApi, type CatalogItem } from '@/lib/api'
import { FormField } from './shared'

type Role = 'occasion' | 'beverage'

type Props = {
  role: Role
  title: string
  description: string
  addLabel: string
  emptyLabel: string
  items: CatalogItem[]
  serviceId: string
  onRefresh: () => void | Promise<void>
  onDelete: (id: string) => void | Promise<void>
}

function readI18n(item: CatalogItem, lang: 'en' | 'am'): string {
  const map = item.nameI18n
  if (map && typeof map === 'object' && typeof map[lang] === 'string' && map[lang]) return map[lang]
  return lang === 'en' ? item.name || '' : ''
}

export function CateringLabelsEditor({
  role,
  title,
  description,
  addLabel,
  emptyLabel,
  items,
  serviceId,
  onRefresh,
  onDelete,
}: Props) {
  const isOcc = role === 'occasion'
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<CatalogItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [slug, setSlug] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [nameAm, setNameAm] = useState('')
  const [emoji, setEmoji] = useState('✨')
  const [bevValue, setBevValue] = useState('')
  const [available, setAvailable] = useState(true)

  const reset = () => {
    setSlug('')
    setNameEn('')
    setNameAm('')
    setEmoji('✨')
    setBevValue('')
    setAvailable(true)
    setEditing(null)
  }

  const openAdd = () => {
    reset()
    setOpen(true)
  }

  const openEdit = (item: CatalogItem) => {
    setEditing(item)
    setSlug(item.slug || '')
    setNameEn(readI18n(item, 'en'))
    setNameAm(readI18n(item, 'am'))
    setEmoji(String(item.metadata?.emoji || '✨'))
    setBevValue(String(item.metadata?.value || item.slug || ''))
    setAvailable(item.available !== false)
    setOpen(true)
  }

  const save = async () => {
    const cleanSlug = slug.trim().toLowerCase().replace(/\s+/g, '-')
    if (!cleanSlug || !nameEn.trim()) {
      toast.error('Slug and English label are required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        kind: 'CONFIG' as const,
        slug: cleanSlug,
        name: nameEn.trim(),
        nameI18n: { en: nameEn.trim(), am: nameAm.trim() },
        description: '',
        available,
        metadata: {
          catalogRole: role,
          ...(isOcc
            ? { emoji: emoji.trim() || '✨' }
            : { value: (bevValue.trim() || cleanSlug).toLowerCase().replace(/\s+/g, '-') }),
        },
      }
      if (editing) await catalogApi.update(editing.id, payload)
      else
        await catalogApi.create({
          serviceId,
          ...payload,
          sortOrder: items.length + 1,
        })
      toast.success(isOcc ? 'Occasion saved' : 'Beverage option saved')
      setOpen(false)
      reset()
      await onRefresh()
    } finally {
      setSaving(false)
    }
  }

  const sheetTitle = editing
    ? `Edit ${nameEn || editing.name}`
    : isOcc
      ? 'Add occasion'
      : 'Add beverage option'

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <p className="mt-1 text-sm text-brown/60">{description}</p>
            </div>
            <Button size="sm" onClick={openAdd} className="gap-1.5">
              <Plus className="h-4 w-4" />
              {addLabel}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {items.length === 0 ? (
            <p className="text-sm text-brown/60">{emptyLabel}</p>
          ) : (
            items.map((item) => {
              const am = readI18n(item, 'am')
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-brown">{readI18n(item, 'en') || item.name}</p>
                    <p className="text-sm text-brown/60">
                      {am || '—'} · {item.slug}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(item)} className="gap-1.5">
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => onDelete(item.id)} className="gap-1.5">
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <Sheet
        open={open}
        onOpenChange={(next) => {
          if (!next) {
            setOpen(false)
            reset()
          }
        }}
      >
        <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
          <SheetHeader className="border-b border-border/70 bg-cream/50 px-5 py-4 text-left">
            <SheetTitle className="font-display text-xl text-burgundy">{sheetTitle}</SheetTitle>
            <SheetDescription>
              {editing
                ? 'Update English and Amharic labels, then save.'
                : 'Add a label shown on the catering order form.'}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            <FormField label="Label (English)">
              <Input
                value={nameEn}
                placeholder={isOcc ? 'Wedding' : 'Food Only'}
                onChange={(e) => setNameEn(e.target.value)}
              />
            </FormField>
            <FormField label="Label (Amharic)">
              <Input
                value={nameAm}
                placeholder={isOcc ? 'ሠርግ' : 'ምግብ ብቻ'}
                onChange={(e) => setNameAm(e.target.value)}
              />
            </FormField>
            <FormField label="Slug">
              <Input
                value={slug}
                disabled={!!editing}
                placeholder={isOcc ? 'wedding' : 'food-only'}
                onChange={(e) => {
                  const next = e.target.value
                  setSlug(next)
                  if (!isOcc && !editing) {
                    setBevValue(next.trim().toLowerCase().replace(/\s+/g, '-'))
                  }
                }}
              />
            </FormField>
            {isOcc ? (
              <FormField label="Emoji">
                <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} />
              </FormField>
            ) : (
              <FormField label="Pricing key">
                <Input
                  value={bevValue}
                  placeholder="food-only"
                  onChange={(e) => setBevValue(e.target.value.trim().toLowerCase().replace(/\s+/g, '-'))}
                />
              </FormField>
            )}
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={available} onCheckedChange={setAvailable} />
              Visible on website
            </label>
          </div>

          <div className="flex justify-end gap-2 border-t border-border/70 px-5 py-4">
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false)
                reset()
              }}
            >
              Cancel
            </Button>
            <Button disabled={saving} onClick={save} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
