import { useCallback } from 'react'
import { ImageUploader } from '@/components/forms/ImageUploader'
import { LocalizedField } from '@/components/cms/LocalizedField'
import { SectionEditorShell } from '@/components/cms/SectionEditorShell'
import { VideoUploader } from '@/components/forms/VideoUploader'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSectionEditor, normalizeField, ensureLocalized } from '@/lib/section-content'
import type { SectionEditorProps } from '@/features/home/editors/types'

function normStory(raw: Record<string, unknown>) {
  return {
    ...raw,
    eyebrow: normalizeField(raw.eyebrow),
    title: normalizeField(raw.title),
    description: normalizeField(raw.description),
    buttonText: normalizeField(raw.buttonText),
    buttonLink: typeof raw.buttonLink === 'string' ? raw.buttonLink : '/about',
    image: typeof raw.image === 'string' ? raw.image : '',
  }
}

export function StoryEditor({ section, saving, onSave }: SectionEditorProps) {
  const norm = useCallback(normStory, [])
  const { draft, setDraft, content, setContent, finalizeLocalized } = useSectionEditor(section, norm)

  const save = () => {
    const next = {
      ...content,
      ...finalizeLocalized(['eyebrow', 'title', 'description', 'buttonText']),
      buttonLink: content.buttonLink || '/about',
      image: content.image || '',
    }
    onSave(draft, next)
  }

  return (
    <SectionEditorShell section={draft} title="About Preview" description="Homepage about block — image, title and description." onEnabledChange={(e) => setDraft((p) => ({ ...p, enabled: e }))} onSave={save} saving={saving}>
      <LocalizedField label="Eyebrow" value={content.eyebrow} enPlaceholder="Our Story" amPlaceholder="ታሪካችን" onChange={(v) => setContent((p) => ({ ...p, eyebrow: v }))} />
      <LocalizedField label="Title" value={content.title} enPlaceholder="A kitchen built on tradition" amPlaceholder="በባህል የተገነባ ወጥ ቤት" onChange={(v) => setContent((p) => ({ ...p, title: v }))} />
      <LocalizedField label="Description" value={content.description} multiline onChange={(v) => setContent((p) => ({ ...p, description: v }))} />
      <LocalizedField label="Button text" value={content.buttonText} enPlaceholder="More About Us" amPlaceholder="ተጨማሪ ስለ እኛ" onChange={(v) => setContent((p) => ({ ...p, buttonText: v }))} />
      <div className="space-y-2">
        <Label>Button link</Label>
        <Input value={String(content.buttonLink || '')} onChange={(e) => setContent((p) => ({ ...p, buttonLink: e.target.value }))} placeholder="/about" />
      </div>
      <ImageUploader label="Preview image" value={String(content.image || '')} onChange={(url) => setContent((p) => ({ ...p, image: url || '' }))} aspect="video" hint="Shown in the arch frame on the homepage." />
    </SectionEditorShell>
  )
}

function normVideo(raw: Record<string, unknown>) {
  return {
    ...raw,
    url: typeof raw.url === 'string' ? raw.url : '/images/chef-video.mp4',
    title: normalizeField(raw.title),
    subtitle: normalizeField(raw.subtitle),
  }
}

export function VideoEditor({ section, saving, onSave }: SectionEditorProps) {
  const norm = useCallback(normVideo, [])
  const { draft, setDraft, content, setContent, finalizeLocalized } = useSectionEditor(section, norm)

  const save = () => {
    onSave(draft, {
      ...content,
      url: content.url || '/images/chef-video.mp4',
      ...finalizeLocalized(['title', 'subtitle']),
    })
  }

  return (
    <SectionEditorShell section={draft} title="Video Banner" description="Upload a video file and edit the overlay text." onEnabledChange={(e) => setDraft((p) => ({ ...p, enabled: e }))} onSave={save} saving={saving}>
      <VideoUploader
        label="Video file"
        value={String(content.url || '')}
        onChange={(url) => setContent((p) => ({ ...p, url: url || '/images/chef-video.mp4' }))}
        hint="Upload MP4, WEBM or MOV (max 100MB). The current chef video stays until you upload a new one."
      />
      <LocalizedField label="Overlay title" value={content.title} onChange={(v) => setContent((p) => ({ ...p, title: v }))} />
      <LocalizedField label="Overlay subtitle" value={content.subtitle} multiline onChange={(v) => setContent((p) => ({ ...p, subtitle: v }))} />
    </SectionEditorShell>
  )
}

function normCta(raw: Record<string, unknown>) {
  const left =
    raw.left && typeof raw.left === 'object' && !Array.isArray(raw.left)
      ? (raw.left as Record<string, unknown>)
      : {}
  const right =
    raw.right && typeof raw.right === 'object' && !Array.isArray(raw.right)
      ? (raw.right as Record<string, unknown>)
      : {}

  return {
    ...raw,
    title: normalizeField(raw.title),
    description: normalizeField(raw.description),
    primaryText: normalizeField(raw.primaryText),
    primaryLink: typeof raw.primaryLink === 'string' ? raw.primaryLink : '/shop',
    secondaryText: normalizeField(raw.secondaryText),
    secondaryLink: typeof raw.secondaryLink === 'string' ? raw.secondaryLink : '/catering',
    left: {
      name: normalizeField(left.name ?? { en: 'Tibs', am: '' }),
      category: typeof left.category === 'string' ? left.category : 'food',
      image: typeof left.image === 'string' ? left.image : '',
    },
    right: {
      name: normalizeField(right.name ?? { en: 'House Tela', am: '' }),
      category: typeof right.category === 'string' ? right.category : 'drinks',
      image: typeof right.image === 'string' ? right.image : '',
    },
  }
}

export function CtaEditor({ section, saving, onSave }: SectionEditorProps) {
  const norm = useCallback(normCta, [])
  const { draft, setDraft, content, setContent, finalizeLocalized } = useSectionEditor(section, norm)

  const left = (content.left ?? {}) as Record<string, unknown>
  const right = (content.right ?? {}) as Record<string, unknown>

  const save = () => {
    const localized = finalizeLocalized(['title', 'description', 'primaryText', 'secondaryText'])
    const leftContent = (content.left ?? {}) as Record<string, unknown>
    const rightContent = (content.right ?? {}) as Record<string, unknown>

    onSave(draft, {
      ...content,
      ...localized,
      primaryLink: content.primaryLink || '/shop',
      secondaryLink: content.secondaryLink || '/catering',
      left: {
        name: ensureLocalized(leftContent.name),
        category: leftContent.category || 'food',
        image: leftContent.image || '',
      },
      right: {
        name: ensureLocalized(rightContent.name),
        category: rightContent.category || 'drinks',
        image: rightContent.image || '',
      },
    })
  }

  const setVisual = (
    side: 'left' | 'right',
    patch: Record<string, unknown>,
  ) => {
    setContent((prev) => ({
      ...prev,
      [side]: { ...(prev[side] as Record<string, unknown>), ...patch },
    }))
  }

  return (
    <SectionEditorShell
      section={draft}
      title="Call to Action"
      description="Bottom homepage CTA — headline, buttons, and side visuals (Tibs & House Tela)."
      onEnabledChange={(e) => setDraft((p) => ({ ...p, enabled: e }))}
      onSave={save}
      saving={saving}
    >
      <LocalizedField
        label="Title"
        value={content.title}
        enPlaceholder="Ready to taste healthy, fresh and tasty foods and traditional drinks"
        onChange={(v) => setContent((p) => ({ ...p, title: v }))}
      />
      <LocalizedField
        label="Description"
        value={content.description}
        multiline
        enPlaceholder="Visit us, book catering, or order drinks to go."
        onChange={(v) => setContent((p) => ({ ...p, description: v }))}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <LocalizedField
          label="Primary button text"
          value={content.primaryText}
          enPlaceholder="Order Now"
          onChange={(v) => setContent((p) => ({ ...p, primaryText: v }))}
        />
        <div className="space-y-2">
          <Label>Primary button link</Label>
          <Input
            value={String(content.primaryLink || '')}
            onChange={(e) => setContent((p) => ({ ...p, primaryLink: e.target.value }))}
            placeholder="/shop"
          />
        </div>
        <LocalizedField
          label="Secondary button text"
          value={content.secondaryText}
          enPlaceholder="Book Catering"
          onChange={(v) => setContent((p) => ({ ...p, secondaryText: v }))}
        />
        <div className="space-y-2">
          <Label>Secondary button link</Label>
          <Input
            value={String(content.secondaryLink || '')}
            onChange={(e) => setContent((p) => ({ ...p, secondaryLink: e.target.value }))}
            placeholder="/catering"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-lg border p-4">
          <Label className="text-sm font-semibold">Left visual</Label>
          <LocalizedField
            label="Name"
            value={left.name}
            enPlaceholder="Tibs"
            onChange={(v) => setVisual('left', { name: v })}
          />
          <div className="space-y-2">
            <Label>Category</Label>
            <Input
              value={String(left.category || 'food')}
              onChange={(e) => setVisual('left', { category: e.target.value })}
              placeholder="food"
            />
          </div>
          <ImageUploader
            label="Image (optional)"
            value={String(left.image || '')}
            onChange={(url) => setVisual('left', { image: url || '' })}
            aspect="square"
          />
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <Label className="text-sm font-semibold">Right visual</Label>
          <LocalizedField
            label="Name"
            value={right.name}
            enPlaceholder="House Tela"
            onChange={(v) => setVisual('right', { name: v })}
          />
          <div className="space-y-2">
            <Label>Category</Label>
            <Input
              value={String(right.category || 'drinks')}
              onChange={(e) => setVisual('right', { category: e.target.value })}
              placeholder="drinks"
            />
          </div>
          <ImageUploader
            label="Image (optional)"
            value={String(right.image || '')}
            onChange={(url) => setVisual('right', { image: url || '' })}
            aspect="square"
          />
        </div>
      </div>
    </SectionEditorShell>
  )
}
