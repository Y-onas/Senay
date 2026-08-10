import { useCallback } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { ImageUploader } from '@/components/forms/ImageUploader'
import { LocalizedField } from '@/components/cms/LocalizedField'
import { SectionEditorShell } from '@/components/cms/SectionEditorShell'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { SectionEditorProps } from '@/features/home/editors/types'
import { ensureLocalized, normalizeField, useSectionEditor } from '@/lib/section-content'

type Dish = {
  label: unknown
  name: unknown
  description: unknown
  image: string
  category: string
}

const DISH_LABEL_PLACEHOLDERS = [
  { en: 'Wedding Catering', am: 'የጋብቻ ካተሪንግ' },
  { en: 'Holiday Box', am: 'Holiday Box' },
  { en: 'Vegan Tray', am: 'Vegan Tray' },
] as const

const DISH_NAME_PLACEHOLDERS = [
  { en: 'Full Mesob Spread', am: 'Full Mesob Spread' },
  { en: 'Festival Package', am: 'Festival Package' },
  { en: 'Fasting', am: 'Fasting' },
] as const

const DISH_DESC_PLACEHOLDERS = ['Enough for any celebration', '', 'Colourful fasting selection'] as const

function emptyDish(): Dish {
  return {
    label: { en: '', am: '' },
    name: { en: '', am: '' },
    description: { en: '', am: '' },
    image: '',
    category: 'food',
  }
}

function normalizeDish(dish: Record<string, unknown>): Dish {
  return {
    ...emptyDish(),
    ...dish,
    label: normalizeField(dish.label),
    name: normalizeField(dish.name),
    description: normalizeField(dish.description),
    image: typeof dish.image === 'string' ? dish.image : '',
    category: typeof dish.category === 'string' ? dish.category : 'food',
  }
}

function normalizeCateringContent(raw: Record<string, unknown>) {
  const list = Array.isArray(raw.dishes) ? raw.dishes : []
  return {
    ...raw,
    eyebrow: normalizeField(raw.eyebrow),
    title: normalizeField(raw.title),
    description: normalizeField(raw.description),
    buttonText: normalizeField(raw.buttonText),
    buttonLink: typeof raw.buttonLink === 'string' ? raw.buttonLink : '/catering',
    dishes: Array.from({ length: 3 }, (_, index) =>
      normalizeDish((list[index] ?? {}) as Record<string, unknown>),
    ),
  }
}

export function HomeCateringEditor({ section, saving, onSave }: SectionEditorProps) {
  const norm = useCallback(normalizeCateringContent, [])
  const { draft, setDraft, content, setContent, finalizeLocalized } = useSectionEditor(section, norm)

  const dishes = Array.isArray(content.dishes) ? (content.dishes as Dish[]) : []

  const setDishField = (index: number, key: keyof Dish, value: unknown) => {
    setContent((prev) => {
      const list = [...(Array.isArray(prev.dishes) ? (prev.dishes as Dish[]) : [])]
      const current = list[index]
      if (!current) return prev
      list[index] = { ...current, [key]: value }
      return { ...prev, dishes: list }
    })
  }

  const moveDish = (from: number, to: number) => {
    setContent((prev) => {
      const list = [...(Array.isArray(prev.dishes) ? (prev.dishes as Dish[]) : [])]
      if (to < 0 || to >= list.length) return prev
      const [item] = list.splice(from, 1)
      list.splice(to, 0, item)
      return { ...prev, dishes: list }
    })
  }

  const save = () => {
    const next = {
      ...content,
      ...finalizeLocalized(['eyebrow', 'title', 'description', 'buttonText']),
      buttonLink: content.buttonLink || '/catering',
      dishes: dishes.map((dish) => ({
        ...dish,
        label: ensureLocalized(dish.label),
        name: ensureLocalized(dish.name),
        description: ensureLocalized(dish.description),
      })),
    }
    onSave(draft, next)
  }

  return (
    <SectionEditorShell
      section={draft}
      title="Catering"
      description="Three catering cards with image, labels and book button."
      onEnabledChange={(enabled) => setDraft((prev) => ({ ...prev, enabled }))}
      onSave={save}
      saving={saving}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <LocalizedField
          label="Eyebrow"
          value={content.eyebrow}
          enPlaceholder="Catering"
          amPlaceholder="ካተሪንግ"
          onChange={(v) => setContent((prev) => ({ ...prev, eyebrow: v }))}
        />
        <LocalizedField
          label="Title"
          value={content.title}
          enPlaceholder="Bring the Feast to Your Event"
          amPlaceholder="የግብ ግብዣውን ወደ ዝግጅትዎ ያምጡ"
          onChange={(v) => setContent((prev) => ({ ...prev, title: v }))}
        />
        <div className="md:col-span-2">
          <LocalizedField
            label="Description"
            value={content.description}
            multiline
            enPlaceholder="From intimate dinners to weddings and holidays, we cater with tradition."
            amPlaceholder="ከትንሽ ድራር እስከ ጋብቻዎች እና በዓላት ድረስ፣ በባህል እናቀርባለን።"
            onChange={(v) => setContent((prev) => ({ ...prev, description: v }))}
          />
        </div>
        <LocalizedField
          label="Button text"
          value={content.buttonText}
          enPlaceholder="Book Catering"
          amPlaceholder="ካተሪንግ ይዘዙ"
          onChange={(v) => setContent((prev) => ({ ...prev, buttonText: v }))}
        />
        <div className="space-y-2">
          <Label>Button link</Label>
          <Input
            value={String(content.buttonLink || '')}
            placeholder="/catering"
            onChange={(e) => setContent((prev) => ({ ...prev, buttonLink: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-medium">Catering cards</h3>
        {dishes.map((dish, index) => (
          <Card key={index} className="p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm">{`Card ${index + 1}`}</CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={index === 0} onClick={() => moveDish(index, index - 1)}>
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={index === dishes.length - 1}
                      onClick={() => moveDish(index, index + 1)}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <LocalizedField
                  label="Category label"
                  value={dish.label}
                  enPlaceholder={DISH_LABEL_PLACEHOLDERS[index]?.en}
                  amPlaceholder={DISH_LABEL_PLACEHOLDERS[index]?.am}
                  onChange={(v) => setDishField(index, 'label', v)}
                />
                <LocalizedField
                  label="Title"
                  value={dish.name}
                  enPlaceholder={DISH_NAME_PLACEHOLDERS[index]?.en}
                  amPlaceholder={DISH_NAME_PLACEHOLDERS[index]?.am}
                  onChange={(v) => setDishField(index, 'name', v)}
                />
                <LocalizedField
                  label="Description"
                  value={dish.description}
                  multiline
                  enPlaceholder={DISH_DESC_PLACEHOLDERS[index]}
                  onChange={(v) => setDishField(index, 'description', v)}
                />
              </div>
              <ImageUploader
                label="Card image"
                value={dish.image || ''}
                onChange={(url) => setDishField(index, 'image', url || '')}
                aspect="wide"
              />
            </div>
          </Card>
        ))}
      </div>
    </SectionEditorShell>
  )
}
