import { useEffect, useState } from 'react'
import { ImageUploader } from '@/components/forms/ImageUploader'
import { LocalizedField } from '@/components/cms/LocalizedField'
import { SectionEditorShell } from '@/components/cms/SectionEditorShell'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import type { SectionEditorProps } from '@/features/home/editors/types'
import { ensureLocalized } from '@/lib/i18n'

type Slide = { src: string; alt: string }

export function HeroEditor({ section, saving, onSave }: SectionEditorProps) {
  const [draft, setDraft] = useState(section)
  const [content, setContent] = useState<Record<string, unknown>>(section.content ?? {})

  useEffect(() => {
    setDraft(section)
    setContent(section.content ?? {})
  }, [section])

  const slides = Array.isArray(content.slides) ? [...(content.slides as Slide[])] : []
  while (slides.length < 4) slides.push({ src: '', alt: '' })
  const four = slides.slice(0, 4)

  const setSlide = (index: number, patch: Partial<Slide>) => {
    const next = [...four]
    next[index] = { ...next[index], ...patch }
    setContent((prev) => ({ ...prev, slides: next }))
  }

  const save = () => {
    const headlineLine1 = ensureLocalized(content.headlineLine1)
    const headlineLine2 = ensureLocalized(content.headlineLine2)
    const eyebrow = ensureLocalized(content.eyebrow)
    const headlineEn = [headlineLine1.en, headlineLine2.en].filter(Boolean).join(' of ')
    onSave(draft, {
      ...content,
      eyebrow,
      headlineLine1,
      headlineLine2,
      headline: headlineEn,
      slides: four,
    })
  }

  return (
    <SectionEditorShell
      section={draft}
      title="Hero"
      description="Top banner text and four rotating product images."
      onEnabledChange={(enabled) => setDraft((prev) => ({ ...prev, enabled }))}
      onSave={save}
      saving={saving}
    >
      <LocalizedField
        label="Tagline"
        value={content.eyebrow}
        enPlaceholder="Authentic • Traditional • Brewed by Chemist"
        amPlaceholder="ባህላዊ • እውነተኛ • በኬሚስት የተጠመቀ"
        onChange={(eyebrow) => setContent((prev) => ({ ...prev, eyebrow }))}
      />
      <p className="text-[11px] text-brown/50">Separate phrases with • (middle dot).</p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <LocalizedField
          label="Headline line 1"
          value={content.headlineLine1}
          enPlaceholder="Taste the Soul"
          amPlaceholder="የኢትዮጵያን ነፍስ"
          onChange={(headlineLine1) => setContent((prev) => ({ ...prev, headlineLine1 }))}
        />
        <LocalizedField
          label="Headline line 2"
          value={content.headlineLine2}
          enPlaceholder="Ethiopia"
          amPlaceholder="ኢትዮጵያ"
          onChange={(headlineLine2) => setContent((prev) => ({ ...prev, headlineLine2 }))}
        />
      </div>

      <div className="space-y-4">
        <Label className="text-base">Hero images (4)</Label>
        <p className="text-sm text-brown/60">These rotate in the carousel at the bottom of the hero.</p>
        {four.map((slide, index) => (
          <Card key={index} className="p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{`Image ${index + 1} alt text`}</Label>
                <Input value={slide.alt || ''} onChange={(e) => setSlide(index, { alt: e.target.value })} />
              </div>
              <ImageUploader
                label={`Image ${index + 1}`}
                value={slide.src || ''}
                onChange={(url) => setSlide(index, { src: url || '' })}
                aspect="square"
              />
            </div>
          </Card>
        ))}
      </div>
    </SectionEditorShell>
  )
}
