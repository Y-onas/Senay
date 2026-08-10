import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { ImageUploader } from '@/components/forms/ImageUploader'
import { LocalizedField } from '@/components/cms/LocalizedField'
import { SectionEditorShell } from '@/components/cms/SectionEditorShell'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { SectionEditorProps } from '@/features/home/editors/types'
import { ensureLocalized, normalizeField } from '@/lib/i18n'

type CardItem = { label: unknown; image?: string }

function normalizeContent(content: Record<string, unknown> | undefined) {
  const raw = content ?? {}
  return {
    ...raw,
    eyebrow: normalizeField(raw.eyebrow),
    title: normalizeField(raw.title),
    description: normalizeField(raw.description),
    cards: (Array.isArray(raw.cards) ? raw.cards : []).map((card) => ({
      ...(card as Record<string, unknown>),
      label: normalizeField((card as CardItem).label),
    })),
  }
}

export function CategoriesEditor({ section, saving, onSave }: SectionEditorProps) {
  const [draft, setDraft] = useState(section)
  const [content, setContent] = useState<Record<string, unknown>>(() => normalizeContent(section.content) as Record<string, unknown>)

  useEffect(() => {
    setDraft(section)
    setContent(normalizeContent(section.content) as Record<string, unknown>)
  }, [section])

  const cards = Array.isArray(content.cards) ? (content.cards as CardItem[]) : []

  const setField = (key: 'eyebrow' | 'title' | 'description', value: unknown) => {
    setContent((prev) => ({ ...prev, [key]: value }))
  }

  const addCard = () => {
    setContent((prev) => ({
      ...prev,
      cards: [...cards, { label: { en: '', am: '' }, image: '' }],
    }))
  }

  const moveCard = (from: number, to: number) => {
    setContent((prev) => {
      const list = [...(Array.isArray(prev.cards) ? (prev.cards as CardItem[]) : [])]
      if (to < 0 || to >= list.length) return prev
      const [item] = list.splice(from, 1)
      list.splice(to, 0, item)
      return { ...prev, cards: list }
    })
  }

  const removeCard = (index: number) => {
    setContent((prev) => ({
      ...prev,
      cards: cards.filter((_, i) => i !== index),
    }))
  }

  const save = () => {
    const next = {
      ...content,
      eyebrow: ensureLocalized(content.eyebrow),
      title: ensureLocalized(content.title),
      description: ensureLocalized(content.description),
      cards: cards.map((card) => ({ ...card, label: ensureLocalized(card.label) })),
    }
    onSave(draft, next)
  }

  return (
    <SectionEditorShell
      section={draft}
      title="Categories"
      description="Image and name only — scrolling food showcase."
      onEnabledChange={(enabled) => setDraft((prev) => ({ ...prev, enabled }))}
      onSave={save}
      saving={saving}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <LocalizedField label="Eyebrow" value={content.eyebrow} enPlaceholder="Explore" amPlaceholder="ያስሱ" onChange={(v) => setField('eyebrow', v)} />
        <LocalizedField label="Title" value={content.title} enPlaceholder="Categories" amPlaceholder="ምድቦች" onChange={(v) => setField('title', v)} />
        <div className="md:col-span-2">
          <LocalizedField label="Section description (optional)" value={content.description} multiline onChange={(v) => setField('description', v)} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium">Category cards</h3>
          <Button size="sm" variant="outline" onClick={addCard}>
            <Plus className="mr-1 h-4 w-4" /> Add category
          </Button>
        </div>
        {cards.map((card, index) => (
          <Card key={index} className="p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <LocalizedField
                  label="Name"
                  value={card.label}
                  enPlaceholder="Doro Wat"
                  amPlaceholder="ዶሮ ወጥ"
                  onChange={(label) => {
                    setContent((prev) => {
                      const list = [...cards]
                      list[index] = { ...list[index], label }
                      return { ...prev, cards: list }
                    })
                  }}
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={index === 0} onClick={() => moveCard(index, index - 1)}>
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" disabled={index === cards.length - 1} onClick={() => moveCard(index, index + 1)}>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => removeCard(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <ImageUploader
                label="Image"
                value={card.image || ''}
                onChange={(url) => {
                  setContent((prev) => {
                    const list = [...cards]
                    list[index] = { ...list[index], image: url || '' }
                    return { ...prev, cards: list }
                  })
                }}
                aspect="square"
              />
            </div>
          </Card>
        ))}
      </div>
    </SectionEditorShell>
  )
}
