import { useCallback } from 'react'
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { ImageUploader } from '@/components/forms/ImageUploader'
import { LocalizedField } from '@/components/cms/LocalizedField'
import { SectionEditorShell } from '@/components/cms/SectionEditorShell'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { SectionEditorProps } from '@/features/home/editors/types'
import { ensureLocalized, normalizeField, useSectionEditor } from '@/lib/section-content'

type OfferCard = {
  id?: string
  label: unknown
  title: unknown
  subtitle: unknown
  image: string
  link: string
  linkText: unknown
  variant: string
  tall: boolean
}

function normalizeCard(card: Record<string, unknown>): OfferCard {
  return {
    ...(card as OfferCard),
    label: normalizeField(card.label),
    title: normalizeField(card.title),
    subtitle: normalizeField(card.subtitle),
    linkText: normalizeField(card.linkText),
    image: typeof card.image === 'string' ? card.image : '',
    link: typeof card.link === 'string' ? card.link : '/',
    variant: typeof card.variant === 'string' ? card.variant : 'yellow',
    tall: Boolean(card.tall),
  }
}

function normalizeOffersContent(raw: Record<string, unknown>) {
  return {
    ...raw,
    eyebrow: normalizeField(raw.eyebrow),
    title: normalizeField(raw.title),
    description: normalizeField(raw.description),
    cards: (Array.isArray(raw.cards) ? raw.cards : []).map((card) =>
      normalizeCard(card as Record<string, unknown>),
    ),
  }
}

export function OffersEditor({ section, saving, onSave }: SectionEditorProps) {
  const norm = useCallback(normalizeOffersContent, [])
  const { draft, setDraft, content, setContent, finalizeLocalized } = useSectionEditor(section, norm)

  const cards = Array.isArray(content.cards) ? (content.cards as OfferCard[]) : []

  const setCardField = (index: number, key: keyof OfferCard, value: unknown) => {
    setContent((prev) => {
      const list = [...(Array.isArray(prev.cards) ? (prev.cards as OfferCard[]) : [])]
      const current = list[index]
      if (!current) return prev
      list[index] = { ...current, [key]: value }
      return { ...prev, cards: list }
    })
  }

  const addCard = () => {
    setContent((prev) => ({
      ...prev,
      cards: [
        ...(Array.isArray(prev.cards) ? (prev.cards as OfferCard[]) : []),
        {
          id: `offer-${Date.now()}`,
          label: { en: '', am: '' },
          title: { en: 'New offer', am: '' },
          subtitle: { en: '', am: '' },
          image: '',
          link: '/',
          linkText: { en: 'Order Now', am: '' },
          variant: 'yellow',
          tall: false,
        },
      ],
    }))
  }

  const removeCard = (index: number) => {
    setContent((prev) => ({
      ...prev,
      cards: cards.filter((_, i) => i !== index),
    }))
  }

  const moveCard = (from: number, to: number) => {
    setContent((prev) => {
      const list = [...(Array.isArray(prev.cards) ? (prev.cards as OfferCard[]) : [])]
      if (to < 0 || to >= list.length) return prev
      const [item] = list.splice(from, 1)
      list.splice(to, 0, item)
      return { ...prev, cards: list }
    })
  }

  const save = () => {
    const next = {
      ...content,
      ...finalizeLocalized(['eyebrow', 'title', 'description']),
      cards: cards.map((card) => ({
        ...card,
        label: ensureLocalized(card.label),
        title: ensureLocalized(card.title),
        subtitle: ensureLocalized(card.subtitle),
        linkText: ensureLocalized(card.linkText),
      })),
    }
    onSave(draft, next)
  }

  return (
    <SectionEditorShell
      section={draft}
      title="Special Offers"
      description="Three promo cards with images, button text and links."
      onEnabledChange={(enabled) => setDraft((prev) => ({ ...prev, enabled }))}
      onSave={save}
      saving={saving}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <LocalizedField
          label="Eyebrow"
          value={content.eyebrow}
          enPlaceholder="Special Offers"
          amPlaceholder="ልዩ ቅናሾች"
          onChange={(v) => setContent((prev) => ({ ...prev, eyebrow: v }))}
        />
        <LocalizedField
          label="Title"
          value={content.title}
          enPlaceholder="Traditional Deals You Can't Miss"
          amPlaceholder="አያመልጡም የሚገኙ ባህላዊ ቅናሾች"
          onChange={(v) => setContent((prev) => ({ ...prev, title: v }))}
        />
        <div className="md:col-span-2">
          <LocalizedField
            label="Description"
            value={content.description}
            multiline
            enPlaceholder="Enjoy your favourite Ethiopian dishes and house-brewed drinks at unbeatable prices."
            amPlaceholder="የሚወዷቸውን የኢትዮጵያ ምግቦች እና ቤት ውስጥ የተጠመቁ መጠጦች በማይተካ ዋጋ ይደሰቱ።"
            onChange={(v) => setContent((prev) => ({ ...prev, description: v }))}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium">Offer cards</h3>
          <Button size="sm" variant="outline" onClick={addCard}>
            <Plus className="mr-1 h-4 w-4" /> Add card
          </Button>
        </div>
        {cards.map((card, index) => (
          <Card key={card.id ?? index} className="p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <LocalizedField
                  label="Label (optional)"
                  value={card.label}
                  enPlaceholder="House Brew"
                  amPlaceholder="ቤት መጠጥ"
                  onChange={(v) => setCardField(index, 'label', v)}
                />
                <LocalizedField
                  label="Title"
                  value={card.title}
                  enPlaceholder="Brewed Tela & Tej"
                  amPlaceholder="የተጠመቁ ቴላ እና ጠጅ"
                  onChange={(v) => setCardField(index, 'title', v)}
                />
                <LocalizedField
                  label="Subtitle (optional)"
                  value={card.subtitle}
                  enPlaceholder="Shared. Generous. Joyful."
                  amPlaceholder="የሚጋራ። ለጋስ። ደስተኛ።"
                  onChange={(v) => setCardField(index, 'subtitle', v)}
                />
                <LocalizedField
                  label="Button text"
                  value={card.linkText}
                  enPlaceholder="Order Now"
                  amPlaceholder="አሁን ይዘዙ"
                  onChange={(v) => setCardField(index, 'linkText', v)}
                />
                <div className="space-y-2">
                  <Label>Button link</Label>
                  <Input
                    value={card.link || ''}
                    placeholder="/traditional-drinks"
                    onChange={(e) => setCardField(index, 'link', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Style (yellow, green, burgundy)</Label>
                  <Input
                    value={card.variant || 'yellow'}
                    onChange={(e) => setCardField(index, 'variant', e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={!!card.tall}
                    onCheckedChange={(value) => setCardField(index, 'tall', value)}
                  />
                  <Label>Tall card (right column)</Label>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={index === 0} onClick={() => moveCard(index, index - 1)}>
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={index === cards.length - 1}
                    onClick={() => moveCard(index, index + 1)}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => removeCard(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <ImageUploader
                label="Background image"
                value={card.image || ''}
                onChange={(url) => setCardField(index, 'image', url || '')}
                aspect={card.tall ? 'video' : 'wide'}
              />
            </div>
          </Card>
        ))}
      </div>
    </SectionEditorShell>
  )
}
