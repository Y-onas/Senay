import { useCallback } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { LocalizedField } from '@/components/cms/LocalizedField'
import { SectionEditorShell } from '@/components/cms/SectionEditorShell'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import type { SectionEditorProps } from '@/features/home/editors/types'
import { ensureLocalized, normalizeField, useSectionEditor } from '@/lib/section-content'

type Feature = {
  title: unknown
  description: unknown
}

const FEATURE_TITLE_PLACEHOLDERS = [
  { en: 'In-House Brewing', am: 'በቤት ውስጥ መጠመር' },
  { en: 'Fresh Ingredients', am: 'Fresh Ingredients' },
  { en: 'Generous Hospitality', am: 'Generous Hospitality' },
  { en: 'Vegan Friendly', am: 'Vegan Friendly' },
] as const

const FEATURE_DESC_PLACEHOLDERS = [
  'Tela and tej fermented in clay pots by our own brewers.',
  'Stone-ground spices and produce sourced daily.',
  'You are welcomed as family, every single visit.',
  'Full fasting and vegan options available year-round.',
] as const

function emptyFeature(): Feature {
  return { title: { en: '', am: '' }, description: { en: '', am: '' } }
}

function normalizeFeature(feature: Record<string, unknown>): Feature {
  return {
    ...emptyFeature(),
    ...feature,
    title: normalizeField(feature.title),
    description: normalizeField(feature.description),
  }
}

function normalizeWhyChooseUsContent(raw: Record<string, unknown>) {
  const list = Array.isArray(raw.features) ? raw.features : []
  return {
    ...raw,
    eyebrow: normalizeField(raw.eyebrow),
    title: normalizeField(raw.title),
    description: normalizeField(raw.description),
    features: Array.from({ length: 4 }, (_, index) =>
      normalizeFeature((list[index] ?? {}) as Record<string, unknown>),
    ),
  }
}

export function WhyChooseUsEditor({ section, saving, onSave }: SectionEditorProps) {
  const norm = useCallback(normalizeWhyChooseUsContent, [])
  const { draft, setDraft, content, setContent, finalizeLocalized } = useSectionEditor(section, norm)

  const features = Array.isArray(content.features) ? (content.features as Feature[]) : []

  const setFeatureField = (index: number, key: keyof Feature, value: unknown) => {
    setContent((prev) => {
      const list = [...(Array.isArray(prev.features) ? (prev.features as Feature[]) : [])]
      const current = list[index]
      if (!current) return prev
      list[index] = { ...current, [key]: value }
      return { ...prev, features: list }
    })
  }

  const moveFeature = (from: number, to: number) => {
    setContent((prev) => {
      const list = [...(Array.isArray(prev.features) ? (prev.features as Feature[]) : [])]
      if (to < 0 || to >= list.length) return prev
      const [item] = list.splice(from, 1)
      list.splice(to, 0, item)
      return { ...prev, features: list }
    })
  }

  const save = () => {
    const next = {
      ...content,
      ...finalizeLocalized(['eyebrow', 'title', 'description']),
      features: features.map((feature) => ({
        ...feature,
        title: ensureLocalized(feature.title),
        description: ensureLocalized(feature.description),
      })),
    }
    onSave(draft, next)
  }

  return (
    <SectionEditorShell
      section={draft}
      title="Why Choose Us"
      description="Section heading and four feature cards."
      onEnabledChange={(enabled) => setDraft((prev) => ({ ...prev, enabled }))}
      onSave={save}
      saving={saving}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <LocalizedField
          label="Eyebrow"
          value={content.eyebrow}
          enPlaceholder="Why Choose Us"
          amPlaceholder="ለምን እኛን"
          onChange={(v) => setContent((prev) => ({ ...prev, eyebrow: v }))}
        />
        <LocalizedField
          label="Title"
          value={content.title}
          enPlaceholder="Experience the Difference"
          amPlaceholder="ልዩነቱን ይሞክሩ"
          onChange={(v) => setContent((prev) => ({ ...prev, title: v }))}
        />
        <div className="md:col-span-2">
          <LocalizedField
            label="Description"
            value={content.description}
            multiline
            enPlaceholder="We combine traditional recipes, house-brewed drinks and warm hospitality to deliver an unforgettable Ethiopian dining experience."
            amPlaceholder="ባህላዊ рецепቶችን፣ በቤት የተጠመቁ መጠጦችን እና ሞቅ ያለ አገልግሎትን በማዋሀድ ማይረሱ የሚቀር የኢትዮጵያ መመገቢያ تجربት እናቀርባለን።"
            onChange={(v) => setContent((prev) => ({ ...prev, description: v }))}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-medium">Feature cards</h3>
        {features.map((feature, index) => (
          <Card key={index} className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm">{`Card ${index + 1}`}</CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={index === 0} onClick={() => moveFeature(index, index - 1)}>
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={index === features.length - 1}
                    onClick={() => moveFeature(index, index + 1)}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <LocalizedField
                label="Title"
                value={feature.title}
                enPlaceholder={FEATURE_TITLE_PLACEHOLDERS[index]?.en}
                amPlaceholder={FEATURE_TITLE_PLACEHOLDERS[index]?.am}
                onChange={(v) => setFeatureField(index, 'title', v)}
              />
              <LocalizedField
                label="Description"
                value={feature.description}
                multiline
                enPlaceholder={FEATURE_DESC_PLACEHOLDERS[index]}
                onChange={(v) => setFeatureField(index, 'description', v)}
              />
            </div>
          </Card>
        ))}
      </div>
    </SectionEditorShell>
  )
}
