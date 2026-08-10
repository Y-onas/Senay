import { useEffect, useState } from 'react'
import { Plus, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { contentApi, contentModuleApi, type HomeSection } from '@/lib/api'
import { ADMIN_CONFIRM, confirmAdminAction } from '@/lib/confirm-messages'
import { ImageUploader } from '@/components/forms/ImageUploader'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type TestimonialItem = {
  id: string
  name: string
  quote: string
  role?: string | null
  imageUrl?: string | null
  rating: number
  sortOrder: number
  published: boolean
}

type Headings = {
  eyebrow: string
  title: string
}

function sortTestimonials(list: TestimonialItem[]) {
  return [...list].sort((a, b) => {
    if (a.published !== b.published) return a.published ? 1 : -1
    return a.sortOrder - b.sortOrder
  })
}

function normalizeTestimonial(row: Record<string, unknown>): TestimonialItem {
  return {
    id: String(row.id),
    name: String(row.name || ''),
    quote: String(row.quote || ''),
    role: typeof row.role === 'string' ? row.role : null,
    imageUrl: typeof row.imageUrl === 'string' ? row.imageUrl : null,
    rating: typeof row.rating === 'number' ? row.rating : 5,
    sortOrder: typeof row.sortOrder === 'number' ? row.sortOrder : 0,
    published: row.published !== false,
  }
}

export function TestimonialsPage() {
  const [items, setItems] = useState<TestimonialItem[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', quote: '', rating: 5 })
  const [section, setSection] = useState<HomeSection | null>(null)
  const [headings, setHeadings] = useState<Headings>({ eyebrow: 'Testimonials', title: 'What Our Guests Say' })
  const [savingHeadings, setSavingHeadings] = useState(false)

  const reload = async () => {
    const rows = await contentModuleApi.testimonials()
    setItems(sortTestimonials(rows.map((row) => normalizeTestimonial(row))))
  }

  useEffect(() => {
    Promise.all([
      reload(),
      contentApi.homeSections().then((list) => {
        const testimonialsSection = list.find((entry) => entry.key === 'testimonials') ?? null
        setSection(testimonialsSection)
        const content = testimonialsSection?.content ?? {}
        setHeadings({
          eyebrow: String(content.eyebrow || 'Testimonials'),
          title: String(content.title || 'What Our Guests Say'),
        })
      }),
    ]).finally(() => setLoading(false))
  }, [])

  const saveHeadings = async () => {
    if (!section) {
      toast.error('Home testimonials section not found')
      return
    }
    setSavingHeadings(true)
    try {
      const updated = await contentApi.updateHomeSection(section.id, {
        label: section.label,
        order: section.order,
        enabled: section.enabled,
        content: { ...section.content, ...headings },
      })
      setSection(updated)
      toast.success('Section headings saved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed')
    } finally {
      setSavingHeadings(false)
    }
  }

  const add = async () => {
    if (!newItem.name.trim() || !newItem.quote.trim()) {
      toast.error('Name and review required')
      return
    }
    setAdding(true)
    try {
      const created = await contentModuleApi.createTestimonial({
        name: newItem.name.trim(),
        quote: newItem.quote.trim(),
        rating: newItem.rating,
        sortOrder: items.length + 1,
        published: true,
      })
      setItems((prev) => sortTestimonials([...prev, normalizeTestimonial(created as Record<string, unknown>)]))
      setNewItem({ name: '', quote: '', rating: 5 })
      toast.success('Testimonial added')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Add failed')
    } finally {
      setAdding(false)
    }
  }

  const save = async (item: TestimonialItem) => {
    try {
      const updated = await contentModuleApi.updateTestimonial(item.id, item)
      setItems((prev) =>
        sortTestimonials(prev.map((row) => (row.id === item.id ? normalizeTestimonial(updated as Record<string, unknown>) : row))),
      )
      toast.success('Testimonial saved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed')
    }
  }

  const approve = async (item: TestimonialItem) => {
    const next = { ...item, published: true }
    await contentModuleApi.updateTestimonial(item.id, next)
    setItems((prev) => sortTestimonials(prev.map((row) => (row.id === item.id ? next : row))))
    toast.success('Review approved')
  }

  const rejectOrDelete = async (item: TestimonialItem) => {
    const pending = !item.published
    if (
      !(await confirmAdminAction(
        pending ? ADMIN_CONFIRM.rejectTestimonial : ADMIN_CONFIRM.deleteTestimonial,
      ))
    ) {
      return
    }
    await contentModuleApi.deleteTestimonial(item.id)
    setItems((prev) => prev.filter((row) => row.id !== item.id))
    toast.success(pending ? 'Rejected' : 'Deleted')
  }

  const reorder = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    const reordered = next.map((entry, index) => ({ ...entry, sortOrder: index + 1 }))
    setItems(sortTestimonials(reordered))
    void Promise.all(
      reordered.map((entry, index) =>
        contentModuleApi.updateTestimonial(entry.id, { ...entry, sortOrder: index + 1 }),
      ),
    ).catch(() => {
      toast.error('Reorder failed')
      void reload()
    })
  }

  const pendingCount = items.filter((item) => !item.published).length

  if (loading) return <Skeleton className="h-96" />

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Testimonials"
        description={
          pendingCount
            ? `${pendingCount} guest review${pendingCount === 1 ? '' : 's'} awaiting approval from Share Your Experience.`
            : 'Approve guest reviews from the website, or add them here.'
        }
        actions={
          <div className="flex flex-wrap items-end gap-2">
            <Input
              placeholder="Customer name"
              value={newItem.name}
              onChange={(e) => setNewItem((prev) => ({ ...prev, name: e.target.value }))}
            />
            <Textarea
              placeholder="Review"
              value={newItem.quote}
              onChange={(e) => setNewItem((prev) => ({ ...prev, quote: e.target.value }))}
              rows={2}
              className="min-w-[220px]"
            />
            <Select
              value={String(newItem.rating)}
              onValueChange={(value) => setNewItem((prev) => ({ ...prev, rating: Number(value) }))}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <SelectItem key={rating} value={String(rating)}>
                    {rating} stars
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={add} disabled={adding}>
              <Plus className="mr-2 h-4 w-4" />
              {adding ? 'Adding…' : 'Add'}
            </Button>
          </div>
        }
      />

      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Homepage section headings</CardTitle>
              <p className="text-sm text-brown-muted">
                Eyebrow and title shown above the reviews carousel on the home page.
              </p>
            </div>
            <Button size="sm" onClick={saveHeadings} disabled={savingHeadings}>
              <Save className="mr-2 h-4 w-4" />
              {savingHeadings ? 'Saving…' : 'Save headings'}
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Eyebrow</Label>
              <Input
                value={headings.eyebrow}
                onChange={(e) => setHeadings((prev) => ({ ...prev, eyebrow: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={headings.title}
                onChange={(e) => setHeadings((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {items.map((item, index) => (
          <Card
            key={item.id}
            className={
              item.published ? 'p-4' : 'border border-amber-300/70 bg-amber-50/40 p-4'
            }
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Customer name</Label>
                <Input
                  value={item.name}
                  onChange={(e) =>
                    setItems((rows) =>
                      rows.map((row) => (row.id === item.id ? { ...row, name: e.target.value } : row)),
                    )
                  }
                />
                <Label>Role (optional)</Label>
                <Input
                  value={item.role || ''}
                  onChange={(e) =>
                    setItems((rows) =>
                      rows.map((row) => (row.id === item.id ? { ...row, role: e.target.value } : row)),
                    )
                  }
                />
                <Label>Rating</Label>
                <Select
                  value={String(item.rating)}
                  onValueChange={(value) =>
                    setItems((rows) =>
                      rows.map((row) =>
                        row.id === item.id ? { ...row, rating: Number(value) } : row,
                      ),
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <SelectItem key={rating} value={String(rating)}>
                        {rating} stars
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Review</Label>
                <Textarea
                  value={item.quote}
                  onChange={(e) =>
                    setItems((rows) =>
                      rows.map((row) => (row.id === item.id ? { ...row, quote: e.target.value } : row)),
                    )
                  }
                  rows={4}
                />
                <ImageUploader
                  label="Photo (optional)"
                  value={item.imageUrl || ''}
                  onChange={(url) =>
                    setItems((rows) =>
                      rows.map((row) => (row.id === item.id ? { ...row, imageUrl: url || '' } : row)),
                    )
                  }
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 md:col-span-2">
                {!item.published ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                    Pending approval
                  </span>
                ) : null}
                {!item.published ? (
                  <Button size="sm" onClick={() => void approve(item)}>
                    Approve
                  </Button>
                ) : null}
                {item.published ? (
                  <>
                    <Switch
                      checked={item.published}
                      onCheckedChange={(published) =>
                        setItems((rows) =>
                          rows.map((row) => (row.id === item.id ? { ...row, published } : row)),
                        )
                      }
                    />
                    <Label className="mb-0">Visible</Label>
                  </>
                ) : null}
                <Button size="sm" variant="outline" disabled={index === 0} onClick={() => reorder(index, index - 1)}>
                  Up
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={index === items.length - 1}
                  onClick={() => reorder(index, index + 1)}
                >
                  Down
                </Button>
                <Button size="sm" onClick={() => void save(item)}>
                  <Save className="mr-1 h-4 w-4" /> Save
                </Button>
                <Button
                  size="sm"
                  variant={item.published ? 'ghost' : 'outline'}
                  onClick={() => void rejectOrDelete(item)}
                >
                  {item.published ? <Trash2 className="h-4 w-4 text-destructive" /> : 'Reject'}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
