import { useEffect, useState } from 'react'
import { Plus, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { contentApi } from '@/lib/api'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

type FooterLink = { label: string; href: string }

type FooterBlock = {
  id: string
  column: string
  title?: string | null
  order: number
  content: Record<string, unknown>
}

function asLinks(value: unknown): FooterLink[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((row) => row && typeof row === 'object')
    .map((row) => ({
      label: String((row as FooterLink).label || ''),
      href: String((row as FooterLink).href || ''),
    }))
}

function FooterLinksEditor({
  links,
  onChange,
}: {
  links: FooterLink[]
  onChange: (links: FooterLink[]) => void
}) {
  return (
    <div className="space-y-2">
      {links.map((link, index) => (
        <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <Input
            placeholder="Label"
            value={link.label}
            onChange={(e) => {
              const next = [...links]
              next[index] = { ...next[index], label: e.target.value }
              onChange(next)
            }}
          />
          <Input
            placeholder="/path or https://…"
            value={link.href}
            onChange={(e) => {
              const next = [...links]
              next[index] = { ...next[index], href: e.target.value }
              onChange(next)
            }}
          />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onChange(links.filter((_, i) => i !== index))}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}
      <Button type="button" size="sm" variant="outline" onClick={() => onChange([...links, { label: '', href: '' }])}>
        <Plus className="mr-1 h-4 w-4" /> Add link
      </Button>
    </div>
  )
}

function FooterBlockEditor({
  item,
  onChange,
}: {
  item: FooterBlock
  onChange: (next: FooterBlock) => void
}) {
  const content = item.content

  if (item.column === 'brand') {
    const social = asLinks(content.social)
    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Tagline</Label>
          <Textarea
            value={String(content.tagline || '')}
            onChange={(e) => onChange({ ...item, content: { ...content, tagline: e.target.value } })}
          />
        </div>
        <div className="space-y-2">
          <Label>Social links</Label>
          <FooterLinksEditor
            links={social}
            onChange={(next) => onChange({ ...item, content: { ...content, social: next } })}
          />
        </div>
      </div>
    )
  }

  if (item.column === 'bottom') {
    return (
      <div className="space-y-1.5">
        <Label>Credit text</Label>
        <Input
          value={String(content.creditText || '')}
          onChange={(e) => onChange({ ...item, content: { ...content, creditText: e.target.value } })}
        />
      </div>
    )
  }

  const links = asLinks(content.links)
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Column title</Label>
        <Input
          value={item.title || ''}
          onChange={(e) => onChange({ ...item, title: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Links</Label>
        <FooterLinksEditor
          links={links}
          onChange={(next) => onChange({ ...item, content: { ...content, links: next } })}
        />
      </div>
    </div>
  )
}

export function FooterPage() {
  const [items, setItems] = useState<FooterBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    contentApi
      .footer()
      .then((rows) =>
        setItems(
          rows.map((row) => ({
            id: String(row.id),
            column: String(row.column || ''),
            title: typeof row.title === 'string' ? row.title : null,
            order: typeof row.order === 'number' ? row.order : 0,
            content: (row.content as Record<string, unknown>) || {},
          })),
        ),
      )
      .finally(() => setLoading(false))
  }, [])

  const save = async (item: FooterBlock) => {
    setSavingId(item.id)
    try {
      await contentApi.updateFooter(item.id, {
        column: item.column,
        title: item.title,
        order: item.order,
        content: item.content,
      })
      toast.success(`${item.column} column saved`)
      const rows = await contentApi.footer()
      setItems(
        rows.map((row) => ({
          id: String(row.id),
          column: String(row.column || ''),
          title: typeof row.title === 'string' ? row.title : null,
          order: typeof row.order === 'number' ? row.order : 0,
          content: (row.content as Record<string, unknown>) || {},
        })),
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed')
    } finally {
      setSavingId(null)
    }
  }

  if (loading) return <Skeleton className="h-96" />

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Footer" description="Edit footer columns, links, and social profiles." />
      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle className="capitalize">{item.title || item.column}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FooterBlockEditor
                item={item}
                onChange={(next) => setItems((rows) => rows.map((r) => (r.id === item.id ? next : r)))}
              />
              <Button size="sm" disabled={savingId === item.id} onClick={() => save(item)}>
                <Save className="mr-1 h-4 w-4" />
                {savingId === item.id ? 'Saving…' : 'Save column'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
