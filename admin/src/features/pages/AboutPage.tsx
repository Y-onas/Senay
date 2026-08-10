import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { settingsApi } from '@/lib/api'
import {
  ensureLocalized,
  normalizeField,
  readLocale,
  writeLocale,
  type LocalizedText,
} from '@/lib/i18n'
import { LocalizedField } from '@/components/cms/LocalizedField'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

type ValueItem = { title: LocalizedText; text: LocalizedText }
type MilestoneItem = { year: string; text: LocalizedText }

type AboutDraft = {
  eyebrow: LocalizedText
  title: LocalizedText
  description: LocalizedText
  sectionLabel: LocalizedText
  sectionTitle: LocalizedText
  paragraphs: LocalizedText[]
  values: ValueItem[]
  milestones: MilestoneItem[]
}

function normalizeParagraphs(list: unknown): LocalizedText[] {
  if (!Array.isArray(list)) return []
  return list.map((entry) => normalizeField(entry))
}

function normalizeValues(list: unknown): ValueItem[] {
  if (!Array.isArray(list)) return []
  return list.map((entry) => {
    const item = entry as Record<string, unknown>
    return {
      title: normalizeField(item.title),
      text: normalizeField(item.text),
    }
  })
}

function normalizeMilestones(list: unknown): MilestoneItem[] {
  if (!Array.isArray(list)) return []
  return list.map((entry) => {
    const item = entry as Record<string, unknown>
    return {
      year: typeof item.year === 'string' ? item.year : '',
      text: normalizeField(item.text),
    }
  })
}

function normalizeDraft(raw: unknown): AboutDraft {
  const data = (raw ?? {}) as Record<string, unknown>
  return {
    eyebrow: normalizeField(data.eyebrow),
    title: normalizeField(data.title),
    description: normalizeField(data.description),
    sectionLabel: normalizeField(data.sectionLabel),
    sectionTitle: normalizeField(data.sectionTitle),
    paragraphs: normalizeParagraphs(data.paragraphs),
    values: normalizeValues(data.values),
    milestones: normalizeMilestones(data.milestones),
  }
}

function emptyDraft(): AboutDraft {
  return {
    eyebrow: { en: '', am: '' },
    title: { en: '', am: '' },
    description: { en: '', am: '' },
    sectionLabel: { en: '', am: '' },
    sectionTitle: { en: '', am: '' },
    paragraphs: [],
    values: [],
    milestones: [],
  }
}

export function AboutPage() {
  const [draft, setDraft] = useState<AboutDraft>(emptyDraft)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    settingsApi
      .get('page:about')
      .then((data) => setDraft(normalizeDraft(data)))
      .finally(() => setLoading(false))
  }, [])

  const setParagraphsFromText = (lang: 'en' | 'am', text: string) => {
    const parts = text.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean)
    setDraft((prev) => {
      const existing = prev.paragraphs
      const next = parts.map((part, index) => writeLocale(existing[index], lang, part))
      return { ...prev, paragraphs: next }
    })
  }

  const setMilestoneField = (index: number, key: 'year' | 'text', lang: 'en' | 'am', text: string) => {
    if (key === 'year') {
      setDraft((prev) => {
        const list = [...prev.milestones]
        const current = list[index]
        if (!current) return prev
        list[index] = { ...current, year: text }
        return { ...prev, milestones: list }
      })
      return
    }
    setDraft((prev) => {
      const list = [...prev.milestones]
      const current = list[index]
      if (!current) return prev
      list[index] = { ...current, text: writeLocale(current.text, lang, text) }
      return { ...prev, milestones: list }
    })
  }

  const save = async () => {
    setSaving(true)
    try {
      const payload = {
        eyebrow: ensureLocalized(draft.eyebrow),
        title: ensureLocalized(draft.title),
        description: ensureLocalized(draft.description),
        sectionLabel: ensureLocalized(draft.sectionLabel),
        sectionTitle: ensureLocalized(draft.sectionTitle),
        paragraphs: draft.paragraphs
          .map((entry) => ensureLocalized(entry))
          .filter((entry) => entry.en.trim() || entry.am.trim()),
        values: draft.values
          .map((entry) => ({
            title: ensureLocalized(entry.title),
            text: ensureLocalized(entry.text),
          }))
          .filter((entry) => entry.title.en || entry.title.am || entry.text.en || entry.text.am),
        milestones: draft.milestones
          .map((entry) => ({
            year: entry.year.trim(),
            text: ensureLocalized(entry.text),
          }))
          .filter((entry) => entry.year || entry.text.en || entry.text.am),
      }
      await settingsApi.put('page:about', payload)
      setDraft(normalizeDraft(payload))
      toast.success('About page saved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Skeleton className="h-96" />

  const paragraphsEn = draft.paragraphs.map((entry) => readLocale(entry, 'en')).join('\n\n')
  const paragraphsAm = draft.paragraphs.map((entry) => readLocale(entry, 'am')).join('\n\n')

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="About Us"
        description="Edit the full About page — hero, story, values and timeline."
        actions={
          <Button onClick={save} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving…' : 'Save About page'}
          </Button>
        }
      />

      <Card className="border-yellow-brand/30 bg-yellow-brand/5 p-4">
        <p className="text-sm text-brown/65">
          The homepage About preview is edited under{' '}
          <Link to="/home-sections" className="font-semibold text-burgundy underline">
            Home → About Preview
          </Link>
          . Story images and value icons stay fixed in the theme for now. Timeline section labels are also fixed.
        </p>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Page heading</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <LocalizedField
            label="Eyebrow"
            value={draft.eyebrow}
            enPlaceholder="About Us"
            amPlaceholder="ስለ እኛ"
            onChange={(eyebrow) => setDraft((prev) => ({ ...prev, eyebrow }))}
          />
          <LocalizedField
            label="Title"
            value={draft.title}
            enPlaceholder="The story of Senay Tela"
            amPlaceholder="የሰናይ ቴላ ታሪክ"
            onChange={(title) => setDraft((prev) => ({ ...prev, title }))}
          />
          <LocalizedField
            label="Description"
            value={draft.description}
            multiline
            enPlaceholder="A family kitchen keeping Ethiopian tradition alive — one stew, one ceremony, one celebration at a time."
            amPlaceholder="ኢትዮጵያዊ traditionን የሚያስቀመጥ የቤተሰብ ወጥ ቤት — አንድ stew፣ አንድ ceremony፣ አንድ celebration በአንድ ጊዜ።"
            onChange={(description) => setDraft((prev) => ({ ...prev, description }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Our story</CardTitle>
          <p className="text-sm font-normal text-brown/65">Main text block on the About page</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <LocalizedField
            label="Section small label"
            value={draft.sectionLabel}
            enPlaceholder="Who we are"
            amPlaceholder="እኛ ማን ነን"
            onChange={(sectionLabel) => setDraft((prev) => ({ ...prev, sectionLabel }))}
          />
          <LocalizedField
            label="Section title"
            value={draft.sectionTitle}
            enPlaceholder="More than a restaurant — a living tradition"
            amPlaceholder="ከሬስቶራን በላይ — ህያው tradition"
            onChange={(sectionTitle) => setDraft((prev) => ({ ...prev, sectionTitle }))}
          />
          <div className="space-y-2">
            <Label>Story paragraphs</Label>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-brown/50">EN</p>
                <Textarea
                  value={paragraphsEn}
                  rows={6}
                  placeholder={'First paragraph\n\nSecond paragraph'}
                  onChange={(e) => setParagraphsFromText('en', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-brown/50">AM</p>
                <Textarea
                  value={paragraphsAm}
                  rows={6}
                  placeholder={'First paragraph\n\nSecond paragraph'}
                  onChange={(e) => setParagraphsFromText('am', e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-brown/50">Press Enter twice between paragraphs</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Our values</CardTitle>
          <p className="text-sm font-normal text-brown/65">Four boxes with title + description</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {draft.values.map((entry, index) => (
            <Card key={index} className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Value {index + 1}</CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        values: prev.values.filter((_, i) => i !== index),
                      }))
                    }
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <LocalizedField
                  label="Title"
                  value={entry.title}
                  enPlaceholder="Cooked slowly"
                  amPlaceholder="Cooked slowly"
                  onChange={(title) => {
                    setDraft((prev) => {
                      const list = [...prev.values]
                      list[index] = { ...list[index], title }
                      return { ...prev, values: list }
                    })
                  }}
                />
                <LocalizedField
                  label="Description"
                  value={entry.text}
                  multiline
                  onChange={(text) => {
                    setDraft((prev) => {
                      const list = [...prev.values]
                      list[index] = { ...list[index], text }
                      return { ...prev, values: list }
                    })
                  }}
                />
              </div>
            </Card>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setDraft((prev) => ({
                ...prev,
                values: [...prev.values, { title: { en: '', am: '' }, text: { en: '', am: '' } }],
              }))
            }
          >
            + Add value
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
          <p className="text-sm font-normal text-brown/65">Key dates in your history</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {draft.milestones.map((entry, index) => (
            <Card key={index} className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Milestone {index + 1}</CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        milestones: prev.milestones.filter((_, i) => i !== index),
                      }))
                    }
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input
                    value={entry.year}
                    placeholder="2011"
                    onChange={(e) => setMilestoneField(index, 'year', 'en', e.target.value)}
                  />
                </div>
                <LocalizedField
                  label="What happened"
                  value={entry.text}
                  multiline
                  onChange={(text) => {
                    setDraft((prev) => {
                      const list = [...prev.milestones]
                      list[index] = { ...list[index], text }
                      return { ...prev, milestones: list }
                    })
                  }}
                />
              </div>
            </Card>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setDraft((prev) => ({
                ...prev,
                milestones: [...prev.milestones, { year: '', text: { en: '', am: '' } }],
              }))
            }
          >
            + Add milestone
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
