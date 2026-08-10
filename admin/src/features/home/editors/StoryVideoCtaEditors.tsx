import { useCallback } from 'react'
import { ImageUploader } from '@/components/forms/ImageUploader'
import { LocalizedField } from '@/components/cms/LocalizedField'
import { SectionEditorShell } from '@/components/cms/SectionEditorShell'
import { VideoUploader } from '@/components/forms/VideoUploader'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSectionEditor, normalizeField } from '@/lib/section-content'
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
  return {
    ...raw,
    eyebrow: normalizeField(raw.eyebrow),
    title: normalizeField(raw.title),
    description: normalizeField(raw.description),
    buttonText: normalizeField(raw.buttonText),
    buttonLink: typeof raw.buttonLink === 'string' ? raw.buttonLink : '/contact',
    image: typeof raw.image === 'string' ? raw.image : '',
  }
}

export function CtaEditor({ section, saving, onSave }: SectionEditorProps) {
  const norm = useCallback(normCta, [])
  const { draft, setDraft, content, setContent, finalizeLocalized } = useSectionEditor(section, norm)

  const save = () => {
    onSave(draft, {
      ...content,
      ...finalizeLocalized(['eyebrow', 'title', 'description', 'buttonText']),
      buttonLink: content.buttonLink || '/contact',
      image: content.image || '',
    })
  }

  return (
    <SectionEditorShell section={draft} title="Call to Action" description="Bottom homepage CTA block." onEnabledChange={(e) => setDraft((p) => ({ ...p, enabled: e }))} onSave={save} saving={saving}>
      <LocalizedField label="Eyebrow" value={content.eyebrow} onChange={(v) => setContent((p) => ({ ...p, eyebrow: v }))} />
      <LocalizedField label="Title" value={content.title} onChange={(v) => setContent((p) => ({ ...p, title: v }))} />
      <LocalizedField label="Description" value={content.description} multiline onChange={(v) => setContent((p) => ({ ...p, description: v }))} />
      <LocalizedField label="Button text" value={content.buttonText} onChange={(v) => setContent((p) => ({ ...p, buttonText: v }))} />
      <div className="space-y-2">
        <Label>Button link</Label>
        <Input value={String(content.buttonLink || '')} onChange={(e) => setContent((p) => ({ ...p, buttonLink: e.target.value }))} />
      </div>
      <ImageUploader label="Background image" value={String(content.image || '')} onChange={(url) => setContent((p) => ({ ...p, image: url || '' }))} aspect="wide" />
    </SectionEditorShell>
  )
}
