import { useEffect, useState } from 'react'
import { Plus, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { contentApi, contentModuleApi, type HomeSection } from '@/lib/api'
import {
  ensureLocalized,
  isLocalized,
  normalizeField,
  readLocale,
  type LocalizedText,
} from '@/lib/i18n'
import { ADMIN_CONFIRM, confirmAdminAction } from '@/lib/confirm-messages'
import { LocalizedField } from '@/components/cms/LocalizedField'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'

type FaqItem = {
  id?: string
  published: boolean
  sortOrder: number
  question: LocalizedText
  answer: LocalizedText
}

type Headings = {
  eyebrow: LocalizedText
  title: LocalizedText
  description: LocalizedText
}

function normalizeHeadings(raw: Record<string, unknown> | undefined): Headings {
  return {
    eyebrow: normalizeField(raw?.eyebrow),
    title: normalizeField(raw?.title),
    description: normalizeField(raw?.description),
  }
}

function normalizeFaq(faq: Record<string, unknown>): FaqItem {
  return {
    id: typeof faq.id === 'string' ? faq.id : undefined,
    published: faq.published !== false,
    sortOrder: typeof faq.sortOrder === 'number' ? faq.sortOrder : 0,
    question: isLocalized(faq.questionI18n)
      ? normalizeField(faq.questionI18n)
      : normalizeField(faq.question),
    answer: isLocalized(faq.answerI18n)
      ? normalizeField(faq.answerI18n)
      : normalizeField(faq.answer),
  }
}

function faqPayload(faq: FaqItem) {
  return {
    id: faq.id,
    published: faq.published,
    sortOrder: faq.sortOrder,
    question: readLocale(faq.question, 'en'),
    answer: readLocale(faq.answer, 'en'),
    questionI18n: ensureLocalized(faq.question),
    answerI18n: ensureLocalized(faq.answer),
  }
}

function emptyNewFaq(): Pick<FaqItem, 'question' | 'answer'> {
  return {
    question: { en: '', am: '' },
    answer: { en: '', am: '' },
  }
}

export function FaqsPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newFaq, setNewFaq] = useState(emptyNewFaq)
  const [section, setSection] = useState<HomeSection | null>(null)
  const [headings, setHeadings] = useState<Headings>(() => normalizeHeadings({}))
  const [savingHeadings, setSavingHeadings] = useState(false)

  const reloadFaqs = async () => {
    const rows = await contentModuleApi.faqs()
    setFaqs(rows.map((row) => normalizeFaq(row)))
  }

  useEffect(() => {
    Promise.all([
      reloadFaqs(),
      contentApi.homeSections().then((list) => {
        const faqSection = list.find((entry) => entry.key === 'faq') ?? null
        setSection(faqSection)
        setHeadings(normalizeHeadings(faqSection?.content))
      }),
    ]).finally(() => setLoading(false))
  }, [])

  const saveHeadings = async () => {
    if (!section) {
      toast.error('Home FAQ section not found')
      return
    }
    setSavingHeadings(true)
    try {
      const content = {
        ...section.content,
        eyebrow: ensureLocalized(headings.eyebrow),
        title: ensureLocalized(headings.title),
        description: ensureLocalized(headings.description),
      }
      const updated = await contentApi.updateHomeSection(section.id, {
        label: section.label,
        order: section.order,
        enabled: section.enabled,
        content,
      })
      setSection(updated)
      setHeadings(normalizeHeadings(updated.content))
      toast.success('Section headings saved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed')
    } finally {
      setSavingHeadings(false)
    }
  }

  const addFaq = async () => {
    if (!readLocale(newFaq.question, 'en').trim() && !readLocale(newFaq.question, 'am').trim()) {
      toast.error('Question required')
      return
    }
    setAdding(true)
    try {
      const payload = faqPayload({
        question: newFaq.question,
        answer: newFaq.answer,
        published: true,
        sortOrder: faqs.length + 1,
      })
      const created = await contentModuleApi.createFaq(payload)
      setFaqs((prev) => [...prev, normalizeFaq(created as Record<string, unknown>)])
      setNewFaq(emptyNewFaq())
      toast.success('FAQ added')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Add failed')
    } finally {
      setAdding(false)
    }
  }

  const saveFaq = async (faq: FaqItem) => {
    if (!faq.id) return
    try {
      const payload = faqPayload(faq)
      const updated = await contentModuleApi.updateFaq(faq.id, payload)
      setFaqs((prev) =>
        prev.map((entry) => (entry.id === faq.id ? normalizeFaq(updated as Record<string, unknown>) : entry)),
      )
      toast.success('FAQ saved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed')
    }
  }

  const deleteFaq = async (id: string) => {
    if (!(await confirmAdminAction(ADMIN_CONFIRM.deleteFaq))) return
    try {
      await contentModuleApi.deleteFaq(id)
      setFaqs((prev) => prev.filter((entry) => entry.id !== id))
      toast.success('Deleted')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed')
    }
  }

  const reorder = (from: number, to: number) => {
    if (to < 0 || to >= faqs.length) return
    const next = [...faqs]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    const reordered = next.map((entry, index) => ({ ...entry, sortOrder: index + 1 }))
    setFaqs(reordered)
    void Promise.all(
      reordered.map((entry, index) =>
        entry.id
          ? contentModuleApi.updateFaq(entry.id, { ...faqPayload(entry), sortOrder: index + 1 })
          : Promise.resolve(),
      ),
    )
  }

  if (loading) return <Skeleton className="h-96" />

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="FAQ" description="Add, edit, reorder and show or hide FAQs." />

      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Homepage section headings</h2>
              <p className="text-sm text-brown/65">
                Eyebrow, title and description shown beside the FAQ list on the home page.
              </p>
            </div>
            <Button size="sm" onClick={saveHeadings} disabled={savingHeadings}>
              <Save className="mr-2 h-4 w-4" />
              {savingHeadings ? 'Saving…' : 'Save headings'}
            </Button>
          </div>
          <LocalizedField
            label="Eyebrow"
            value={headings.eyebrow}
            enPlaceholder="FAQ"
            amPlaceholder="ጥያቄዎች"
            onChange={(eyebrow) => setHeadings((prev) => ({ ...prev, eyebrow }))}
          />
          <LocalizedField
            label="Title"
            value={headings.title}
            enPlaceholder="Questions? Answered."
            amPlaceholder="ጥያቄዎች? መልስ አለ!"
            onChange={(title) => setHeadings((prev) => ({ ...prev, title }))}
          />
          <LocalizedField
            label="Description"
            value={headings.description}
            multiline
            enPlaceholder="Got questions about ordering, catering or our brewing? Here are the answers our guests ask most."
            amPlaceholder="ስለ ትዕዛዝ፣ ካትሪንግ ወይም መጠመቃችን ጥያቄዎች አሉዎት? እንግዶቻችን ብዙ ጊዜ የሚጠይቁ መልሶች እነህን ነው።"
            onChange={(description) => setHeadings((prev) => ({ ...prev, description }))}
          />
        </div>
      </Card>

      <Card className="p-4">
        <div className="space-y-4">
          <h2 className="text-base font-semibold">Add FAQ</h2>
          <LocalizedField
            label="Question"
            value={newFaq.question}
            enPlaceholder="New question"
            amPlaceholder="አዲስ ጥያቄ"
            onChange={(question) => setNewFaq((prev) => ({ ...prev, question }))}
          />
          <LocalizedField
            label="Answer"
            value={newFaq.answer}
            multiline
            enPlaceholder="Answer"
            amPlaceholder="መልስ"
            onChange={(answer) => setNewFaq((prev) => ({ ...prev, answer }))}
          />
          <Button onClick={addFaq} disabled={adding}>
            <Plus className="mr-2 h-4 w-4" />
            {adding ? 'Adding…' : 'Add FAQ'}
          </Button>
        </div>
      </Card>

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <Card key={faq.id ?? index} className="p-4">
            <div className="space-y-3">
              <LocalizedField
                label="Question"
                value={faq.question}
                enPlaceholder="Question"
                amPlaceholder="ጥያቄ"
                onChange={(question) => {
                  setFaqs((prev) => {
                    const list = [...prev]
                    list[index] = { ...list[index], question }
                    return list
                  })
                }}
              />
              <LocalizedField
                label="Answer"
                value={faq.answer}
                multiline
                enPlaceholder="Answer"
                amPlaceholder="መልስ"
                onChange={(answer) => {
                  setFaqs((prev) => {
                    const list = [...prev]
                    list[index] = { ...list[index], answer }
                    return list
                  })
                }}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Switch
                  checked={faq.published}
                  onCheckedChange={(published) =>
                    setFaqs((prev) =>
                      prev.map((entry, idx) => (idx === index ? { ...entry, published } : entry)),
                    )
                  }
                />
                <Label className="mb-0">Visible</Label>
                <Button size="sm" variant="outline" disabled={index === 0} onClick={() => reorder(index, index - 1)}>
                  Up
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={index === faqs.length - 1}
                  onClick={() => reorder(index, index + 1)}
                >
                  Down
                </Button>
                <Button size="sm" onClick={() => saveFaq(faq)}>
                  <Save className="mr-1 h-4 w-4" /> Save
                </Button>
                {faq.id ? (
                  <Button size="sm" variant="ghost" onClick={() => deleteFaq(faq.id!)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                ) : null}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
