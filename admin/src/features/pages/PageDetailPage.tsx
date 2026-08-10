import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeft, GripVertical, Plus, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { pagesApi, type PageBlock, type PageRecord, type PageStatus } from '@/lib/api'
import { ADMIN_CONFIRM, confirmAdminAction } from '@/lib/confirm-messages'
import { JsonContentEditor } from '@/components/cms/JsonContentEditor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

function PageBlockEditor({
  block,
  onUpdate,
  onDelete,
}: {
  block: PageBlock
  onUpdate: (id: string, data: Partial<PageBlock>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [meta, setMeta] = useState(block)
  const [content, setContent] = useState<Record<string, unknown>>(block.content ?? {})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setMeta(block)
    setContent(block.content ?? {})
  }, [block])

  const save = async () => {
    setSaving(true)
    try {
      await onUpdate(block.id, { name: meta.name, order: meta.order, content })
      toast.success('Block saved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">{meta.name || meta.type}</CardTitle>
              <Badge variant="outline" className="mt-1">
                {meta.type}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => void onDelete(block.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Label</Label>
            <Input
              value={meta.name || ''}
              onChange={(e) => setMeta((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Order</Label>
            <Input
              type="number"
              value={meta.order}
              onChange={(e) => setMeta((prev) => ({ ...prev, order: Number(e.target.value) }))}
            />
          </div>
        </div>
        <JsonContentEditor label="Content fields" value={content} onChange={setContent} />
        <Button size="sm" variant="secondary" onClick={save} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving…' : 'Save block'}
        </Button>
      </CardContent>
    </Card>
  )
}

export function PageDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [page, setPage] = useState<PageRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newBlock, setNewBlock] = useState({ type: 'text', name: '' })

  const load = async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await pagesApi.get(id)
      setPage(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Page not found')
      setPage(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [id])

  const savePage = async () => {
    if (!page) return
    setSaving(true)
    try {
      const updated = await pagesApi.update(page.id, {
        title: page.title,
        description: page.description,
        status: page.status,
        isHome: page.isHome,
      })
      setPage(updated)
      toast.success('Page saved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const addBlock = async () => {
    if (!page) return
    const type = newBlock.type.trim()
    if (!type) {
      toast.error('Block type is required')
      return
    }
    try {
      const created = await pagesApi.createBlock(page.id, {
        type,
        name: newBlock.name.trim() || type,
        order: (page.blocks?.length ?? 0) + 1,
        content: {},
      })
      setPage((prev) =>
        prev ? { ...prev, blocks: [...(prev.blocks ?? []), created].sort((a, b) => a.order - b.order) } : prev,
      )
      setNewBlock({ type: 'text', name: '' })
      toast.success('Block added')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add block')
    }
  }

  const updateBlock = async (blockId: string, data: Partial<PageBlock>) => {
    const updated = await pagesApi.updateBlock(blockId, data)
    setPage((prev) =>
      prev
        ? {
            ...prev,
            blocks: (prev.blocks ?? [])
              .map((block) => (block.id === blockId ? { ...block, ...updated } : block))
              .sort((a, b) => a.order - b.order),
          }
        : prev,
    )
  }

  const deleteBlock = async (blockId: string) => {
    if (!(await confirmAdminAction(ADMIN_CONFIRM.deleteBlock))) return
    await pagesApi.deleteBlock(blockId)
    setPage((prev) =>
      prev ? { ...prev, blocks: (prev.blocks ?? []).filter((block) => block.id !== blockId) } : prev,
    )
    toast.success('Block deleted')
  }

  if (loading) return <Skeleton className="h-96" />
  if (!page) return <p className="text-brown-muted">Page not found.</p>

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/pages">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="admin-section-title">{page.title}</h1>
            <p className="admin-section-subtitle">/{page.slug}</p>
          </div>
        </div>
        <Button onClick={savePage} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving…' : 'Save page'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Page settings</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={page.title}
              onChange={(e) => setPage((prev) => (prev ? { ...prev, title: e.target.value } : prev))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" value={page.slug} disabled />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={page.description || ''}
              onChange={(e) =>
                setPage((prev) => (prev ? { ...prev, description: e.target.value } : prev))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={page.status}
              onValueChange={(status) =>
                setPage((prev) => (prev ? { ...prev, status: status as PageStatus } : prev))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Switch
              id="isHome"
              checked={page.isHome}
              onCheckedChange={(isHome) =>
                setPage((prev) => (prev ? { ...prev, isHome } : prev))
              }
            />
            <Label htmlFor="isHome">Homepage</Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-display text-xl font-bold">Content blocks</h2>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label>Type</Label>
            <Input
              value={newBlock.type}
              onChange={(e) => setNewBlock((prev) => ({ ...prev, type: e.target.value }))}
              placeholder="hero"
            />
          </div>
          <div className="space-y-1">
            <Label>Name</Label>
            <Input
              value={newBlock.name}
              onChange={(e) => setNewBlock((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Hero Banner"
            />
          </div>
          <Button onClick={addBlock}>
            <Plus className="mr-2 h-4 w-4" />
            Add block
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {(page.blocks ?? []).map((block) => (
          <PageBlockEditor
            key={block.id}
            block={block}
            onUpdate={updateBlock}
            onDelete={deleteBlock}
          />
        ))}
        {!page.blocks?.length ? (
          <Card className="p-8 text-center text-brown-muted">No blocks yet. Add your first content block.</Card>
        ) : null}
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => navigate('/pages')}>
          Back to pages
        </Button>
      </div>
    </div>
  )
}
