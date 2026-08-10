import { useEffect, useState } from 'react'
import { Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { contentApi, type NavigationItem } from '@/lib/api'
import { ADMIN_CONFIRM, confirmAdminAction } from '@/lib/confirm-messages'
import { ensureLocalized, readLocale } from '@/lib/i18n'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const LOCATIONS = ['PRIMARY', 'FOOTER', 'MOBILE'] as const

export function NavigationPage() {
  const [items, setItems] = useState<NavigationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    contentApi.navigation().then(setItems).finally(() => setLoading(false))
  }, [])

  const saveItem = async (item: NavigationItem) => {
    setBusy(true)
    try {
      const enLabel = readLocale(item.labelI18n ?? item.label, 'en')
      const updated = await contentApi.updateNavigation(item.id, {
        location: item.location,
        label: enLabel,
        labelI18n: item.labelI18n,
        href: item.href,
        order: Number(item.order),
        enabled: item.enabled,
      })
      setItems((rows) => rows.map((row) => (row.id === updated.id ? updated : row)))
      toast.success('Navigation updated')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  const addItem = async () => {
    try {
      const created = await contentApi.createNavigation({
        location: 'PRIMARY',
        label: 'New link',
        labelI18n: { en: 'New link', am: '' },
        href: '/',
        order: items.length + 1,
        enabled: true,
      })
      setItems((rows) => [...rows, created])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Create failed')
    }
  }

  const deleteItem = async (id: string) => {
    if (!(await confirmAdminAction(ADMIN_CONFIRM.deleteNavigation))) return
    await contentApi.deleteNavigation(id)
    setItems((rows) => rows.filter((row) => row.id !== id))
    toast.success('Deleted')
  }

  if (loading) return <Skeleton className="h-96" />

  return (
    <div className="animate-fade-in space-y-6 pb-24">
      <PageHeader
        title="Navigation"
        description="Primary nav labels in English and Amharic — shown on the website header."
        actions={<Button onClick={addItem}>Add link</Button>}
      />
      <div className="space-y-3">
        {items.map((item) => {
          const labels = ensureLocalized(item.labelI18n ?? item.label)
          return (
            <Card key={item.id}>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>English label</Label>
                    <Input
                      value={labels.en}
                      onChange={(e) =>
                        setItems((rows) =>
                          rows.map((r) =>
                            r.id === item.id
                              ? { ...r, label: e.target.value, labelI18n: { ...labels, en: e.target.value } }
                              : r,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Amharic label</Label>
                    <Input
                      value={labels.am}
                      onChange={(e) =>
                        setItems((rows) =>
                          rows.map((r) =>
                            r.id === item.id ? { ...r, labelI18n: { ...labels, am: e.target.value } } : r,
                          ),
                        )
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label>URL</Label>
                    <Input
                      value={item.href}
                      onChange={(e) =>
                        setItems((rows) => rows.map((r) => (r.id === item.id ? { ...r, href: e.target.value } : r)))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Select
                      value={item.location}
                      onValueChange={(location) =>
                        setItems((rows) => rows.map((r) => (r.id === item.id ? { ...r, location } : r)))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LOCATIONS.map((loc) => (
                          <SelectItem key={loc} value={loc}>
                            {loc.charAt(0) + loc.slice(1).toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Order</Label>
                    <Input
                      type="number"
                      value={item.order}
                      onChange={(e) =>
                        setItems((rows) =>
                          rows.map((r) => (r.id === item.id ? { ...r, order: Number(e.target.value) } : r)),
                        )
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2 pb-2">
                    <Switch
                      checked={item.enabled}
                      onCheckedChange={async (enabled) => {
                        const next = { ...item, enabled }
                        setItems((rows) => rows.map((row) => (row.id === item.id ? next : row)))
                        await saveItem(next)
                      }}
                    />
                    <Label className="mb-0">Visible on site</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" disabled={busy} onClick={() => saveItem(item)}>
                      <Save className="mr-1 h-4 w-4" /> Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteItem(item.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
