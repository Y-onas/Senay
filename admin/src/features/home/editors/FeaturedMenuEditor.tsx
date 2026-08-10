import { useCallback } from 'react'
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ImageUploader } from '@/components/forms/ImageUploader'
import { LocalizedField } from '@/components/cms/LocalizedField'
import { SectionEditorShell } from '@/components/cms/SectionEditorShell'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { SectionEditorProps } from '@/features/home/editors/types'
import { readLocale } from '@/lib/i18n'
import { ensureLocalized, normalizeField, useSectionEditor } from '@/lib/section-content'

type MenuItem = {
  id?: string
  name: unknown
  description: unknown
  price?: number
  image?: string
  category?: string
}

function normalizeContent(raw: Record<string, unknown>) {
  return {
    ...raw,
    eyebrow: normalizeField(raw.eyebrow),
    title: normalizeField(raw.title),
    description: normalizeField(raw.description),
    buttonText: normalizeField(raw.buttonText),
    buttonLink: typeof raw.buttonLink === 'string' ? raw.buttonLink : '/contact',
    items: (Array.isArray(raw.items) ? raw.items : []).map((item) => ({
      ...(item as Record<string, unknown>),
      name: normalizeField((item as MenuItem).name),
      description: normalizeField((item as MenuItem).description),
    })),
  }
}

export function FeaturedMenuEditor({ section, saving, onSave }: SectionEditorProps) {
  const norm = useCallback(normalizeContent, [])
  const { draft, setDraft, content, setContent, finalizeLocalized } = useSectionEditor(section, norm)

  const items = Array.isArray(content.items) ? (content.items as MenuItem[]) : []

  const setItemField = (index: number, key: 'name' | 'description', value: unknown) => {
    setContent((prev) => {
      const list = [...(Array.isArray(prev.items) ? (prev.items as MenuItem[]) : [])]
      const current = list[index]
      if (!current) return prev
      list[index] = { ...current, [key]: value }
      return { ...prev, items: list }
    })
  }

  const setItemPatch = (index: number, patch: Partial<MenuItem>) => {
    setContent((prev) => {
      const list = [...(Array.isArray(prev.items) ? (prev.items as MenuItem[]) : [])]
      const current = list[index]
      if (!current) return prev
      list[index] = { ...current, ...patch }
      return { ...prev, items: list }
    })
  }

  const moveItem = (from: number, to: number) => {
    setContent((prev) => {
      const list = [...(Array.isArray(prev.items) ? (prev.items as MenuItem[]) : [])]
      if (to < 0 || to >= list.length) return prev
      const [item] = list.splice(from, 1)
      list.splice(to, 0, item)
      return { ...prev, items: list }
    })
  }

  const removeItem = (index: number) => {
    setContent((prev) => ({
      ...prev,
      items: items.filter((_, i) => i !== index),
    }))
  }

  const addItem = () => {
    if (items.length >= 5) {
      toast.error('Maximum 5 menu items')
      return
    }
    setContent((prev) => ({
      ...prev,
      items: [
        ...items,
        {
          id: `item-${Date.now()}`,
          name: { en: 'New dish', am: '' },
          description: { en: '', am: '' },
          price: 0,
          image: '',
          category: 'food',
        },
      ],
    }))
  }

  const save = () => {
    const next = {
      ...content,
      ...finalizeLocalized(['eyebrow', 'title', 'description', 'buttonText']),
      buttonLink: content.buttonLink || '/contact',
      items: items.map((item) => ({
        ...item,
        name: ensureLocalized(item.name),
        description: ensureLocalized(item.description),
      })),
    }
    onSave(draft, next)
  }

  return (
    <SectionEditorShell
      section={draft}
      title="Our Menu"
      description="List up to 5 dishes — name, description, price and image."
      onEnabledChange={(enabled) => setDraft((prev) => ({ ...prev, enabled }))}
      onSave={save}
      saving={saving}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <LocalizedField
          label="Eyebrow"
          value={content.eyebrow}
          enPlaceholder="From the Menu"
          amPlaceholder="ከምናሌው"
          onChange={(v) => setContent((prev) => ({ ...prev, eyebrow: v }))}
        />
        <LocalizedField
          label="Title"
          value={content.title}
          enPlaceholder="Chef's Selection"
          amPlaceholder="የሼፍ ምርጫ"
          onChange={(v) => setContent((prev) => ({ ...prev, title: v }))}
        />
        <div className="md:col-span-2">
          <LocalizedField
            label="Description"
            value={content.description}
            multiline
            enPlaceholder="Small plates and favourites we are proud to serve every day."
            amPlaceholder="በየቀኑ በفخر የምናቀርባቸው ትናንሽ መנהአቀራረብ እና ተወዳጆች።"
            onChange={(v) => setContent((prev) => ({ ...prev, description: v }))}
          />
        </div>
        <LocalizedField
          label="View menu button text"
          value={content.buttonText}
          enPlaceholder="visit us"
          amPlaceholder="ይጎብኙን"
          onChange={(v) => setContent((prev) => ({ ...prev, buttonText: v }))}
        />
        <div className="space-y-2">
          <Label>View menu button link</Label>
          <Input
            value={String(content.buttonLink || '')}
            placeholder="/contact"
            onChange={(e) => setContent((prev) => ({ ...prev, buttonLink: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base">{`Dishes (${items.length}/5)`}</Label>
          <Button size="sm" variant="outline" onClick={addItem} disabled={items.length >= 5}>
            <Plus className="mr-1 h-4 w-4" /> Add dish
          </Button>
        </div>

        {items.map((item, index) => (
          <Card key={item.id || index} className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm font-semibold">
                  #{index + 1}{' '}
                  {readLocale(item.name, 'en') || readLocale(item.name, 'am') || 'Untitled dish'}
                </CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={index === 0} onClick={() => moveItem(index, index - 1)}>
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={index === items.length - 1}
                    onClick={() => moveItem(index, index + 1)}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => removeItem(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <LocalizedField
                    label="Dish name"
                    value={item.name}
                    enPlaceholder="Doro Wat"
                    amPlaceholder="ዶሮ ወጥ"
                    onChange={(name) => setItemField(index, 'name', name)}
                  />
                  <LocalizedField
                    label="Description"
                    value={item.description}
                    multiline
                    enPlaceholder="Ethiopian chicken stew slow-cooked in berbere and spiced butter, served with injera."
                    amPlaceholder="በበርበሬ እና በቅቤ የተቀመጠ የኢትዮጵያ ዶሮ stew፣ ከእንጀራ ጋር።"
                    onChange={(description) => setItemField(index, 'description', description)}
                  />
                  <div className="space-y-2">
                    <Label>Price (ETB)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={item.price ?? 0}
                      onChange={(e) => setItemPatch(index, { price: Number(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <ImageUploader
                  label="Dish image"
                  value={item.image || ''}
                  onChange={(url) => setItemPatch(index, { image: url || '' })}
                  aspect="wide"
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </SectionEditorShell>
  )
}
