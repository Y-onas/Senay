import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { FileText, Pencil, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { pagesApi, type PageRecord } from '@/lib/api'
import { slugifyTitle } from '@/lib/json-content-editor'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export function PagesPage() {
  const navigate = useNavigate()
  const [pages, setPages] = useState<PageRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState({ title: '', slug: '' })

  const load = async () => {
    setLoading(true)
    try {
      const rows = await pagesApi.list()
      setPages(rows)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load pages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const createPage = async () => {
    const slug = draft.slug.trim() || slugifyTitle(draft.title)
    const title = draft.title.trim() || slug
    if (!slug || !title) {
      toast.error('Title or slug is required')
      return
    }
    setCreating(true)
    try {
      const created = await pagesApi.create({ slug, title, status: 'DRAFT' })
      setDraft({ title: '', slug: '' })
      navigate(`/pages/${created.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create page')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Pages"
        description="Manage website pages and content blocks."
        actions={
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <Label>Title</Label>
              <Input
                value={draft.title}
                onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="About Us"
              />
            </div>
            <div className="space-y-1">
              <Label>Slug</Label>
              <Input
                value={draft.slug}
                onChange={(e) => setDraft((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="about-us"
              />
            </div>
            <Button onClick={createPage} disabled={creating}>
              <Plus className="mr-2 h-4 w-4" />
              {creating ? 'Creating…' : 'New page'}
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : (
        <div className="space-y-3">
          {pages.map((page) => (
            <Card
              key={page.id}
              className="flex items-center justify-between p-4 transition-colors hover:border-ring"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{page.title}</p>
                  <p className="text-sm text-brown-muted">/{page.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={page.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                  {page.status}
                </Badge>
                {page.isHome ? <Badge variant="outline">Home</Badge> : null}
                <Button size="sm" variant="ghost" onClick={() => navigate(`/pages/${page.id}`)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
          {!pages.length ? (
            <Card className="p-8 text-center text-brown-muted">No pages yet. Create your first page above.</Card>
          ) : null}
        </div>
      )}
    </div>
  )
}
