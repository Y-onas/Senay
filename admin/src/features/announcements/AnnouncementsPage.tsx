import { useEffect, useState } from 'react'
import { Plus, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { contentApi } from '@/lib/api'
import { ADMIN_CONFIRM, confirmAdminAction } from '@/lib/confirm-messages'
import { ensureLocalized, normalizeField, readLocale, type LocalizedText } from '@/lib/i18n'
import { LocalizedField } from '@/components/cms/LocalizedField'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'

type Announcement = {
  id: string
  message: LocalizedText
  link: string
  active: boolean
  startDate: string
  endDate: string
  background: string
}

function normalizeAnnouncement(row: Record<string, unknown>): Announcement {
  return {
    id: String(row.id),
    message: normalizeField(row.messageI18n ?? row.message),
    link: String(row.link || ''),
    active: row.active !== false,
    startDate: row.startDate ? new Date(String(row.startDate)).toISOString().slice(0, 16) : '',
    endDate: row.endDate ? new Date(String(row.endDate)).toISOString().slice(0, 16) : '',
    background: String(row.background || ''),
  }
}

function announcementPayload(item: Announcement) {
  const messageI18n = ensureLocalized(item.message)
  return {
    message: readLocale(item.message, 'en'),
    messageI18n,
    link: item.link || null,
    active: item.active,
    startDate: item.startDate ? new Date(item.startDate).toISOString() : null,
    endDate: item.endDate ? new Date(item.endDate).toISOString() : null,
    background: item.background || null,
  }
}

export function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  const reload = async () => {
    const rows = await contentApi.announcements()
    setItems(rows.map((row) => normalizeAnnouncement(row)))
  }

  useEffect(() => {
    reload().finally(() => setLoading(false))
  }, [])

  const add = async () => {
    setAdding(true)
    try {
      const created = await contentApi.createAnnouncement({
        message: 'New announcement',
        messageI18n: { en: 'New announcement', am: '' },
        active: false,
      })
      setItems((prev) => [...prev, normalizeAnnouncement(created as Record<string, unknown>)])
      toast.success('Announcement created')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Create failed')
    } finally {
      setAdding(false)
    }
  }

  const save = async (item: Announcement) => {
    if (!readLocale(item.message, 'en').trim()) {
      toast.error('Message is required')
      return
    }
    try {
      const updated = await contentApi.updateAnnouncement(item.id, announcementPayload(item))
      setItems((prev) =>
        prev.map((row) =>
          row.id === item.id ? normalizeAnnouncement(updated as Record<string, unknown>) : row,
        ),
      )
      toast.success('Saved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed')
    }
  }

  const remove = async (id: string) => {
    if (!(await confirmAdminAction(ADMIN_CONFIRM.deleteAnnouncement))) return
    try {
      await contentApi.deleteAnnouncement(id)
      setItems((prev) => prev.filter((row) => row.id !== id))
      toast.success('Deleted')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed')
    }
  }

  if (loading) return <Skeleton className="h-96" />

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Announcements"
        description="Site-wide banners with bilingual messages and scheduling."
        actions={
          <Button onClick={add} disabled={adding}>
            <Plus className="mr-2 h-4 w-4" />
            {adding ? 'Adding…' : 'Add announcement'}
          </Button>
        }
      />

      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.id} className="space-y-4 p-4">
            <LocalizedField
              label="Message"
              value={item.message}
              multiline
              enPlaceholder="Announcement text"
              amPlaceholder="መልእክት"
              onChange={(message) =>
                setItems((rows) => rows.map((r) => (r.id === item.id ? { ...r, message } : r)))
              }
            />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Link (optional)</Label>
                <Input
                  value={item.link}
                  placeholder="/menu or https://…"
                  onChange={(e) =>
                    setItems((rows) => rows.map((r) => (r.id === item.id ? { ...r, link: e.target.value } : r)))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Background color (optional)</Label>
                <Input
                  value={item.background}
                  placeholder="#5c1a1a"
                  onChange={(e) =>
                    setItems((rows) =>
                      rows.map((r) => (r.id === item.id ? { ...r, background: e.target.value } : r)),
                    )
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Start date</Label>
                <Input
                  type="datetime-local"
                  value={item.startDate}
                  onChange={(e) =>
                    setItems((rows) => rows.map((r) => (r.id === item.id ? { ...r, startDate: e.target.value } : r)))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>End date</Label>
                <Input
                  type="datetime-local"
                  value={item.endDate}
                  onChange={(e) =>
                    setItems((rows) => rows.map((r) => (r.id === item.id ? { ...r, endDate: e.target.value } : r)))
                  }
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Switch
                checked={item.active}
                onCheckedChange={(active) =>
                  setItems((rows) => rows.map((r) => (r.id === item.id ? { ...r, active } : r)))
                }
              />
              <Label className="mb-0">Active</Label>
              <Button size="sm" onClick={() => save(item)}>
                <Save className="mr-1 h-4 w-4" /> Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove(item.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </Card>
        ))}
        {!items.length ? <p className="text-sm text-brown/60">No announcements yet.</p> : null}
      </div>
    </div>
  )
}
