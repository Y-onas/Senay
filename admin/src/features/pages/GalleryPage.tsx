import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { toast } from 'sonner'
import { contentApi, type HomeSection } from '@/lib/api'
import { ImageUploader } from '@/components/forms/ImageUploader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const SLOT_LABELS = [
  'Left top · tall',
  'Center top · wide',
  'Right top · tall',
  'Left bottom · wide',
  'Center bottom · tall',
  'Right bottom · wide',
] as const

const COLS = [
  [0, 3],
  [1, 4],
  [2, 5],
] as const

const TALL = [true, false, true, false, true, false] as const

type GallerySlot = {
  url: string
  caption: string
  category: string
}

type GalleryContent = {
  eyebrow: string
  title: string
  description: string
  slots: GallerySlot[]
}

function defaultContent(base?: Record<string, unknown>): GalleryContent {
  const slots = Array.isArray(base?.slots) ? (base.slots as GallerySlot[]) : []
  return {
    eyebrow: String(base?.eyebrow || 'Gallery'),
    title: String(base?.title || 'A Feast for the Eyes'),
    description: String(
      base?.description ||
        'A glimpse of the dishes, drinks and traditions that fill our table every day.',
    ),
    slots: Array.from({ length: 6 }, (_, i) => ({
      url: slots[i]?.url || '',
      caption: slots[i]?.caption || '',
      category: slots[i]?.category || 'food',
    })),
  }
}

export function GalleryPage() {
  const [section, setSection] = useState<HomeSection | null>(null)
  const [content, setContent] = useState<GalleryContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    contentApi
      .homeSections()
      .then((list) => {
        const row = list.find((s) => s.key === 'gallery') || null
        setSection(row)
        setContent(defaultContent(row?.content))
      })
      .finally(() => setLoading(false))
  }, [])

  const updateSlot = (index: number, patch: Partial<GallerySlot>) => {
    setContent((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        slots: prev.slots.map((slot, i) => (i === index ? { ...slot, ...patch } : slot)),
      }
    })
  }

  const save = async () => {
    if (!section || !content) {
      toast.error('Gallery section not found — run seed first')
      return
    }
    setSaving(true)
    try {
      const updated = await contentApi.updateHomeSection(section.id, {
        label: section.label,
        order: section.order,
        enabled: section.enabled,
        content,
      })
      setSection(updated)
      toast.success('Gallery saved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !content) return <Skeleton className="h-96" />

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-burgundy">Gallery</h1>
          <p className="text-brown-muted">
            Same grid as the homepage — click each slot to upload a photo that fits.
          </p>
        </div>
        <Button onClick={save} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving…' : 'Save gallery'}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
        {COLS.map((col, colIndex) => (
          <div key={colIndex} className="flex flex-col gap-4 lg:gap-5">
            {col.map((slotIndex) => {
              const slot = content.slots[slotIndex]
              return (
                <Card key={slotIndex} className="overflow-hidden p-3">
                  <Label className="mb-2 block text-xs font-medium text-brown-muted">
                    {SLOT_LABELS[slotIndex]}
                  </Label>
                  <ImageUploader
                    label=""
                    value={slot.url || ''}
                    onChange={(url) => updateSlot(slotIndex, { url: url || '' })}
                    aspect={TALL[slotIndex] ? 'video' : 'wide'}
                    hint={TALL[slotIndex] ? 'Use a vertical / long photo' : 'Use a wide photo'}
                  />
                  <Input
                    className="mt-2"
                    placeholder="Caption (optional)"
                    value={slot.caption || ''}
                    onChange={(e) => updateSlot(slotIndex, { caption: e.target.value })}
                  />
                </Card>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
