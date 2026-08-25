import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Plus, Send, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { contentModuleApi } from '@/lib/api'
import { ADMIN_CONFIRM, confirmAdminAction } from '@/lib/confirm-messages'
import { ensureLocalized, normalizeField, readLocale, type LocalizedText } from '@/lib/i18n'
import {
  addisDateInputToIso,
  formatAddisTime,
  toAddisDateInputValue,
} from '@/lib/addisTime'
import {
  detectVideoPlatform,
  getVideoEmbedUrl,
  getVideoFrameClass,
  isSupportedVideoUrl,
} from '@/lib/video-url'
import { LocalizedField } from '@/components/cms/LocalizedField'
import { ImageUploader } from '@/components/forms/ImageUploader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type BlogBlock = Record<string, unknown> & { id: string; type: string }

type BlogDraft = {
  id: string
  slug: string
  title: string
  titleI18n: LocalizedText
  excerpt: string
  excerptI18n: LocalizedText
  blocks: BlogBlock[]
  image?: string | null
  author?: string | null
  publishedAt?: string
  readTime?: string | null
  tags: string[] | string
  seoTitle?: string | null
  seoTitleI18n: LocalizedText
  seoDescription?: string | null
  seoDescriptionI18n: LocalizedText
  published: boolean
}

const BLOCK_TYPES = [
  { key: 'paragraph', label: 'Paragraph' },
  { key: 'heading', label: 'Heading' },
  { key: 'quote', label: 'Quote' },
  { key: 'list', label: 'List' },
  { key: 'image', label: 'Image' },
  { key: 'video', label: 'Video' },
  { key: 'gallery', label: 'Gallery' },
  { key: 'columns', label: 'Side-by-side images' },
  { key: 'cta', label: 'Call to action' },
  { key: 'divider', label: 'Divider' },
] as const

function mkId() {
  return `blk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function asLocalized(value: unknown): LocalizedText {
  return normalizeField(value)
}

function normalizeBlock(block: BlogBlock): BlogBlock {
  if (block.type === 'paragraph' || block.type === 'heading') return { ...block, text: asLocalized(block.text) }
  if (block.type === 'quote')
    return { ...block, text: asLocalized(block.text), attribution: asLocalized(block.attribution) }
  if (block.type === 'list')
    return { ...block, items: Array.isArray(block.items) ? block.items.map(asLocalized) : [{ en: '', am: '' }] }
  if (block.type === 'image') return { ...block, caption: asLocalized(block.caption) }
  if (block.type === 'video') {
    const url = String(block.url || '')
    return {
      ...block,
      url,
      caption: asLocalized(block.caption),
      platform: detectVideoPlatform(url) || undefined,
    }
  }
  if (block.type === 'gallery' || block.type === 'columns') {
    const images = Array.isArray(block.images) ? block.images : []
    return {
      ...block,
      images: images.map((img) => ({
        ...(img as Record<string, unknown>),
        caption: asLocalized((img as Record<string, unknown>).caption),
      })),
    }
  }
  if (block.type === 'cta')
    return { ...block, text: asLocalized(block.text), buttonText: asLocalized(block.buttonText) }
  return block
}

function blockDefaults(type: string): BlogBlock {
  switch (type) {
    case 'heading':
      return { id: mkId(), type: 'heading', level: 2, text: { en: '', am: '' } }
    case 'quote':
      return { id: mkId(), type: 'quote', text: { en: '', am: '' }, attribution: { en: '', am: '' } }
    case 'list':
      return { id: mkId(), type: 'list', style: 'bullet', items: [{ en: '', am: '' }] }
    case 'image':
      return { id: mkId(), type: 'image', url: '', caption: { en: '', am: '' }, layout: 'default' }
    case 'video':
      return { id: mkId(), type: 'video', url: '', caption: { en: '', am: '' } }
    case 'gallery':
      return { id: mkId(), type: 'gallery', images: [{ url: '', caption: { en: '', am: '' } }] }
    case 'columns':
      return {
        id: mkId(),
        type: 'columns',
        images: [
          { url: '', caption: { en: '', am: '' } },
          { url: '', caption: { en: '', am: '' } },
        ],
      }
    case 'cta':
      return {
        id: mkId(),
        type: 'cta',
        text: { en: '', am: '' },
        buttonText: { en: 'Learn more', am: '' },
        buttonLink: '/',
      }
    case 'divider':
      return { id: mkId(), type: 'divider' }
    default:
      return { id: mkId(), type: 'paragraph', text: { en: '', am: '' } }
  }
}

export function normalizeBlogPost(post: Record<string, unknown>): BlogDraft {
  const titleI18n = asLocalized(post.titleI18n ?? post.title)
  const excerptI18n = asLocalized(post.excerptI18n ?? post.excerpt)
  const seoTitleI18n = asLocalized(post.seoTitleI18n ?? post.seoTitle)
  const seoDescriptionI18n = asLocalized(post.seoDescriptionI18n ?? post.seoDescription)
  const blocks =
    Array.isArray(post.blocks) && post.blocks.length
      ? (post.blocks as BlogBlock[]).map(normalizeBlock)
      : [blockDefaults('paragraph')]

  return {
    id: String(post.id),
    slug: String(post.slug || ''),
    title: titleI18n.en || String(post.title || ''),
    titleI18n,
    excerpt: excerptI18n.en || String(post.excerpt || ''),
    excerptI18n,
    blocks,
    image: typeof post.image === 'string' ? post.image : null,
    author: typeof post.author === 'string' ? post.author : 'Senay Tela',
    publishedAt: toAddisDateInputValue(typeof post.publishedAt === 'string' ? post.publishedAt : null),
    readTime: typeof post.readTime === 'string' ? post.readTime : '5 min',
    tags: Array.isArray(post.tags) ? (post.tags as string[]) : [],
    seoTitle: seoTitleI18n.en || (typeof post.seoTitle === 'string' ? post.seoTitle : null),
    seoTitleI18n,
    seoDescription:
      seoDescriptionI18n.en || (typeof post.seoDescription === 'string' ? post.seoDescription : null),
    seoDescriptionI18n,
    published: Boolean(post.published),
  }
}

const AUTO_SAVE_DELAY_MS = 1500

function slugFromTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

function serializeDraftPayload(draft: BlogDraft, published?: boolean) {
  const payload = blogPayload(draft)
  const slug = payload.slug.trim() || slugFromTitle(payload.title || 'untitled')
  return {
    ...payload,
    slug,
    published: published !== undefined ? published : draft.published,
  }
}

function validateDraftForPublish(draft: BlogDraft): string | null {
  if (!readLocale(draft.titleI18n, 'en').trim() && !draft.title.trim()) {
    return 'Add a title before publishing'
  }

  for (const block of draft.blocks) {
    if (block.type !== 'video') continue
    const url = String(block.url || '').trim()
    if (!url || !isSupportedVideoUrl(url)) {
      return 'Each video block needs a valid YouTube or TikTok link before publishing'
    }
  }

  return null
}

function blogPayload(draft: BlogDraft) {
  const titleI18n = ensureLocalized(draft.titleI18n)
  const excerptI18n = ensureLocalized(draft.excerptI18n)
  const seoTitleI18n = ensureLocalized(draft.seoTitleI18n)
  const seoDescriptionI18n = ensureLocalized(draft.seoDescriptionI18n)
  const tags =
    typeof draft.tags === 'string'
      ? draft.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : draft.tags

  return {
    slug: draft.slug,
    title: titleI18n.en || draft.title,
    titleI18n,
    excerpt: excerptI18n.en || draft.excerpt,
    excerptI18n,
    blocks: draft.blocks.map((block) => {
      if (block.type !== 'video') return block
      const url = String(block.url || '').trim()
      return {
        ...block,
        url,
        platform: detectVideoPlatform(url) || undefined,
      }
    }),
    image: draft.image,
    author: draft.author,
    publishedAt: addisDateInputToIso(draft.publishedAt),
    readTime: draft.readTime,
    tags,
    seoTitle: seoTitleI18n.en || draft.seoTitle || null,
    seoTitleI18n,
    seoDescription: seoDescriptionI18n.en || draft.seoDescription || null,
    seoDescriptionI18n,
    published: draft.published,
  }
}

export async function createBlogArticle(
  newPost: { title: string; author: string },
  posts: Record<string, unknown>[],
  onPostsChange: (posts: Record<string, unknown>[]) => void,
) {
  const title = newPost.title.trim()
  if (!title) {
    toast.error('Post title is required')
    return null
  }
  const slug = slugFromTitle(title)
  const post = await contentModuleApi.createBlog({
    slug,
    title,
    titleI18n: { en: title, am: '' },
    excerpt: '',
    excerptI18n: { en: '', am: '' },
    content: [''],
    blocks: [blockDefaults('paragraph')],
    author: newPost.author.trim() || 'Senay Tela',
    publishedAt: addisDateInputToIso(toAddisDateInputValue(new Date())),
    readTime: '5 min',
    tags: [],
    published: false,
  })
  onPostsChange([post as Record<string, unknown>, ...posts])
  toast.success('Article created')
  return post as Record<string, unknown>
}

export function BlogEditor({
  posts,
  onPostsChange,
  hideCreate = false,
}: {
  posts: Record<string, unknown>[]
  onPostsChange: (posts: Record<string, unknown>[]) => void
  hideCreate?: boolean
}) {
  const [editId, setEditId] = useState<string | null>(null)
  const [tab, setTab] = useState<'details' | 'content' | 'seo'>('details')
  const [draft, setDraft] = useState<BlogDraft | null>(null)
  const [creating, setCreating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [autoSavedAt, setAutoSavedAt] = useState<Date | null>(null)
  const [newPost, setNewPost] = useState({ title: '', author: 'Senay Tela' })
  const lastSavedSnapshotRef = useRef<string>('')
  const autoSavePausedRef = useRef(false)

  const syncSavedPost = useCallback(
    (saved: Record<string, unknown>, sentSnapshot?: string) => {
      const normalized = normalizeBlogPost(saved)
      lastSavedSnapshotRef.current = sentSnapshot ?? JSON.stringify(serializeDraftPayload(normalized))
      onPostsChange(posts.map((item) => (String(item.id) === normalized.id ? saved : item)))
      if (sentSnapshot === undefined) {
        setDraft(normalized)
      }
    },
    [onPostsChange, posts],
  )

  const openEdit = (post: Record<string, unknown>) => {
    const normalized = normalizeBlogPost(post)
    setEditId(normalized.id)
    setDraft(normalized)
    setTab('details')
    setAutoSaveStatus('idle')
    setAutoSavedAt(null)
    lastSavedSnapshotRef.current = JSON.stringify(serializeDraftPayload(normalized))
  }

  const createPost = async () => {
    setCreating(true)
    try {
      const post = await createBlogArticle(newPost, posts, onPostsChange)
      if (post) {
        setNewPost({ title: '', author: 'Senay Tela' })
        openEdit(post)
      }
    } finally {
      setCreating(false)
    }
  }

  const saveDraft = useCallback(
    async (currentDraft: BlogDraft, options?: { silent?: boolean }) => {
      const payload = serializeDraftPayload(currentDraft)
      const sentSnapshot = JSON.stringify(payload)
      setAutoSaveStatus('saving')
      try {
        const saved = await contentModuleApi.updateBlog(currentDraft.id, payload)
        syncSavedPost(saved as Record<string, unknown>, sentSnapshot)
        setAutoSaveStatus('saved')
        setAutoSavedAt(new Date())
        return saved
      } catch (error) {
        setAutoSaveStatus('error')
        if (!options?.silent) {
          toast.error(error instanceof Error ? error.message : 'Draft save failed')
        }
        return null
      }
    },
    [syncSavedPost],
  )

  useEffect(() => {
    if (!draft || !editId || autoSavePausedRef.current) return

    const snapshot = JSON.stringify(serializeDraftPayload(draft))
    if (snapshot === lastSavedSnapshotRef.current) return

    setAutoSaveStatus('idle')
    const timer = window.setTimeout(() => {
      void saveDraft(draft, { silent: true })
    }, AUTO_SAVE_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [draft, editId, saveDraft])

  const publishPost = async () => {
    if (!draft) return

    const validationError = validateDraftForPublish(draft)
    if (validationError) {
      toast.error(validationError)
      if (validationError.includes('video')) setTab('content')
      else setTab('details')
      return
    }

    autoSavePausedRef.current = true
    setPublishing(true)
    try {
      const payload = serializeDraftPayload(draft, true)
      if (!payload.publishedAt) {
        payload.publishedAt = new Date().toISOString()
      }
      const saved = await contentModuleApi.updateBlog(draft.id, payload)
      syncSavedPost(saved as Record<string, unknown>)
      setAutoSaveStatus('saved')
      setAutoSavedAt(new Date())
      toast.success('Article published')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Publish failed')
    } finally {
      autoSavePausedRef.current = false
      setPublishing(false)
    }
  }

  const deletePost = async (id: string) => {
    if (!(await confirmAdminAction(ADMIN_CONFIRM.deleteArticle))) return
    await contentModuleApi.deleteBlog(id)
    onPostsChange(posts.filter((item) => String(item.id) !== id))
    if (editId === id) {
      setEditId(null)
      setDraft(null)
    }
    toast.success('Deleted')
  }

  const moveBlock = (idx: number, dir: number) =>
    setDraft((d) => {
      if (!d) return d
      const blocks = [...d.blocks]
      const next = idx + dir
      if (next < 0 || next >= blocks.length) return d
      const [item] = blocks.splice(idx, 1)
      blocks.splice(next, 0, item)
      return { ...d, blocks }
    })

  const updateBlock = (idx: number, patch: Record<string, unknown>) =>
    setDraft((d) =>
      d ? { ...d, blocks: d.blocks.map((b, n) => (n === idx ? { ...b, ...patch } : b)) } : d,
    )

  const removeBlock = (idx: number) =>
    setDraft((d) => (d ? { ...d, blocks: d.blocks.filter((_, n) => n !== idx) } : d))

  const addBlock = (type: string) =>
    setDraft((d) => (d ? { ...d, blocks: [...d.blocks, blockDefaults(type)] } : d))

  const blockControls = (idx: number) => (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="outline" disabled={idx === 0} onClick={() => moveBlock(idx, -1)}>
        Up
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={!draft || idx === draft.blocks.length - 1}
        onClick={() => moveBlock(idx, 1)}
      >
        Down
      </Button>
      <Button size="sm" variant="ghost" onClick={() => removeBlock(idx)}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  )

  const renderBlock = (block: BlogBlock, idx: number) => {
    if (block.type === 'paragraph') {
      return (
        <Card key={block.id} className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <Label>Paragraph</Label>
            {blockControls(idx)}
          </div>
          <LocalizedField
            label="Text"
            value={block.text}
            multiline
            onChange={(text) => updateBlock(idx, { text })}
          />
        </Card>
      )
    }
    if (block.type === 'heading') {
      return (
        <Card key={block.id} className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <Label>Heading</Label>
            {blockControls(idx)}
          </div>
          <Select
            value={String(block.level || 2)}
            onValueChange={(v) => updateBlock(idx, { level: Number(v) })}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">H2</SelectItem>
              <SelectItem value="3">H3</SelectItem>
            </SelectContent>
          </Select>
          <LocalizedField label="Text" value={block.text} onChange={(text) => updateBlock(idx, { text })} />
        </Card>
      )
    }
    if (block.type === 'quote') {
      return (
        <Card key={block.id} className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <Label>Quote</Label>
            {blockControls(idx)}
          </div>
          <LocalizedField
            label="Quote"
            value={block.text}
            multiline
            onChange={(text) => updateBlock(idx, { text })}
          />
          <LocalizedField
            label="Attribution"
            value={block.attribution}
            onChange={(attribution) => updateBlock(idx, { attribution })}
          />
        </Card>
      )
    }
    if (block.type === 'list') {
      const items = Array.isArray(block.items) ? (block.items as LocalizedText[]) : []
      return (
        <Card key={block.id} className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <Label>List</Label>
            {blockControls(idx)}
          </div>
          <Select value={String(block.style || 'bullet')} onValueChange={(v) => updateBlock(idx, { style: v })}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bullet">Bullets</SelectItem>
              <SelectItem value="numbered">Numbered</SelectItem>
            </SelectContent>
          </Select>
          {items.map((item, itemIdx) => (
            <div key={`${block.id}-${itemIdx}`} className="space-y-2 rounded-lg border p-3">
              <LocalizedField
                label={`Item ${itemIdx + 1}`}
                value={item}
                onChange={(next) =>
                  updateBlock(idx, { items: items.map((v, n) => (n === itemIdx ? next : v)) })
                }
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => updateBlock(idx, { items: items.filter((_, n) => n !== itemIdx) })}
              >
                Remove item
              </Button>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => updateBlock(idx, { items: [...items, { en: '', am: '' }] })}>
            + Add item
          </Button>
        </Card>
      )
    }
    if (block.type === 'image') {
      return (
        <Card key={block.id} className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <Label>Image</Label>
            {blockControls(idx)}
          </div>
          <ImageUploader
            value={String(block.url || '')}
            onChange={(url) => updateBlock(idx, { url: url || '' })}
            aspect="wide"
          />
          <LocalizedField
            label="Caption"
            value={block.caption}
            onChange={(caption) => updateBlock(idx, { caption })}
          />
          <Select
            value={String(block.layout || 'default')}
            onValueChange={(v) => updateBlock(idx, { layout: v })}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="wide">Wide</SelectItem>
              <SelectItem value="full">Full width</SelectItem>
            </SelectContent>
          </Select>
        </Card>
      )
    }
    if (block.type === 'video') {
      const url = String(block.url || '')
      const platform = detectVideoPlatform(url)
      const embedUrl = getVideoEmbedUrl(url, platform || undefined)
      const valid = url.trim() ? isSupportedVideoUrl(url) : false

      return (
        <Card key={block.id} className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <Label>Video</Label>
            {blockControls(idx)}
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-brown-muted">YouTube or TikTok link</Label>
            <Input
              value={url}
              placeholder="https://www.youtube.com/watch?v=... or https://www.tiktok.com/@user/video/..."
              onChange={(e) => {
                const nextUrl = e.target.value
                updateBlock(idx, {
                  url: nextUrl,
                  platform: detectVideoPlatform(nextUrl) || undefined,
                })
              }}
            />
            {url.trim() && !valid ? (
              <p className="text-sm text-destructive">
                Paste a valid YouTube or TikTok video link.
              </p>
            ) : null}
            {platform ? (
              <p className="text-xs text-brown-muted">
                Detected: {platform === 'tiktok' ? 'TikTok' : 'YouTube'}
              </p>
            ) : null}
          </div>
          <LocalizedField
            label="Caption (optional)"
            value={block.caption}
            onChange={(caption) => updateBlock(idx, { caption })}
          />
          {embedUrl ? (
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <p className="mb-2 text-xs font-medium text-brown-muted">Preview</p>
              <div className={getVideoFrameClass(platform || 'youtube')}>
                <iframe
                  src={embedUrl}
                  title="Video preview"
                  className="absolute inset-0 h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </div>
          ) : null}
        </Card>
      )
    }
    if (block.type === 'gallery' || block.type === 'columns') {
      const images = Array.isArray(block.images) ? (block.images as Record<string, unknown>[]) : []
      return (
        <Card key={block.id} className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <Label>{block.type === 'gallery' ? 'Gallery' : 'Side-by-side images'}</Label>
            {blockControls(idx)}
          </div>
          {images.map((img, imgIdx) => (
            <div key={`${block.id}-img-${imgIdx}`} className="grid gap-3 rounded-lg border p-3">
              <ImageUploader
                label={`Image ${imgIdx + 1}`}
                value={String(img.url || '')}
                onChange={(url) =>
                  updateBlock(idx, {
                    images: images.map((v, n) => (n === imgIdx ? { ...v, url: url || '' } : v)),
                  })
                }
                aspect="wide"
              />
              <LocalizedField
                label="Caption"
                value={img.caption}
                onChange={(caption) =>
                  updateBlock(idx, {
                    images: images.map((v, n) => (n === imgIdx ? { ...v, caption } : v)),
                  })
                }
              />
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              updateBlock(idx, { images: [...images, { url: '', caption: { en: '', am: '' } }] })
            }
          >
            + Add image
          </Button>
        </Card>
      )
    }
    if (block.type === 'cta') {
      return (
        <Card key={block.id} className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <Label>Call to action</Label>
            {blockControls(idx)}
          </div>
          <LocalizedField label="Text" value={block.text} multiline onChange={(text) => updateBlock(idx, { text })} />
          <LocalizedField
            label="Button text"
            value={block.buttonText}
            onChange={(buttonText) => updateBlock(idx, { buttonText })}
          />
          <Input
            placeholder="Button link (shared)"
            value={String(block.buttonLink || '')}
            onChange={(e) => updateBlock(idx, { buttonLink: e.target.value })}
          />
        </Card>
      )
    }
    return (
      <Card key={block.id} className="p-4">
        <div className="flex items-center justify-between">
          <Label>Divider</Label>
          {blockControls(idx)}
        </div>
        <div className="mt-3 h-px bg-border" />
      </Card>
    )
  }

  if (editId && draft) {
    const autoSaveLabel =
      autoSaveStatus === 'saving'
        ? 'Saving draft…'
        : autoSaveStatus === 'error'
          ? 'Draft save failed — check your connection'
          : autoSaveStatus === 'saved' && autoSavedAt
            ? `Draft saved at ${formatAddisTime(autoSavedAt)}`
            : 'Changes save automatically as a draft'

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Button variant="outline" size="sm" onClick={() => { setEditId(null); setDraft(null) }}>
              ← All articles
            </Button>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h2 className="font-display text-2xl font-bold text-burgundy">Edit article</h2>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                  draft.published
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                {draft.published ? 'Published' : 'Draft'}
              </span>
            </div>
            <p className="text-sm text-brown/65">{readLocale(draft.titleI18n, 'en') || draft.title || 'Untitled draft'}</p>
            <p className="mt-1 flex items-center gap-2 text-xs text-brown-muted">
              {autoSaveStatus === 'saving' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : null}
              {autoSaveLabel}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="destructive" onClick={() => deletePost(draft.id)}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
            <Button onClick={publishPost} disabled={publishing || autoSaveStatus === 'saving'}>
              {publishing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {publishing ? 'Publishing…' : 'Publish'}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['details', 'content', 'seo'] as const).map((key) => (
            <Button key={key} size="sm" variant={tab === key ? 'default' : 'outline'} onClick={() => setTab(key)}>
              {key === 'details' ? 'Details' : key === 'content' ? 'Content' : 'SEO'}
            </Button>
          ))}
        </div>

        {tab === 'details' ? (
          <Card className="space-y-4 p-4">
            <LocalizedField
              label="Title"
              value={draft.titleI18n}
              onChange={(titleI18n) => setDraft((d) => (d ? { ...d, titleI18n, title: readLocale(titleI18n, 'en') } : d))}
            />
            <div className="space-y-2">
              <Label>Slug (shared URL)</Label>
              <Input value={draft.slug} onChange={(e) => setDraft((d) => (d ? { ...d, slug: e.target.value } : d))} />
            </div>
            <LocalizedField
              label="Short description"
              value={draft.excerptI18n}
              multiline
              onChange={(excerptI18n) =>
                setDraft((d) => (d ? { ...d, excerptI18n, excerpt: readLocale(excerptI18n, 'en') } : d))
              }
            />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Author (shared)</Label>
                <Input
                  value={draft.author || ''}
                  onChange={(e) => setDraft((d) => (d ? { ...d, author: e.target.value } : d))}
                />
              </div>
              <div className="space-y-2">
                <Label>Read time (shared)</Label>
                <Input
                  value={draft.readTime || ''}
                  placeholder="5 min"
                  onChange={(e) => setDraft((d) => (d ? { ...d, readTime: e.target.value } : d))}
                />
              </div>
              <div className="space-y-2">
                <Label>Publish date (shared)</Label>
                <Input
                  type="date"
                  value={draft.publishedAt || ''}
                  onChange={(e) => setDraft((d) => (d ? { ...d, publishedAt: e.target.value } : d))}
                />
              </div>
              <div className="space-y-2">
                <Label>Tags (comma separated)</Label>
                <Input
                  value={Array.isArray(draft.tags) ? draft.tags.join(', ') : String(draft.tags || '')}
                  onChange={(e) => setDraft((d) => (d ? { ...d, tags: e.target.value } : d))}
                />
              </div>
            </div>
            <ImageUploader
              label="Featured / hero image"
              value={draft.image || ''}
              onChange={(url) => setDraft((d) => (d ? { ...d, image: url } : d))}
              aspect="wide"
            />
          </Card>
        ) : null}

        {tab === 'content' ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {BLOCK_TYPES.map((t) => (
                <Button key={t.key} size="sm" variant="outline" onClick={() => addBlock(t.key)}>
                  + {t.label}
                </Button>
              ))}
            </div>
            {draft.blocks.map((block, idx) => renderBlock(block, idx))}
          </div>
        ) : null}

        {tab === 'seo' ? (
          <Card className="space-y-4 p-4">
            <LocalizedField
              label="SEO title"
              value={draft.seoTitleI18n}
              onChange={(seoTitleI18n) =>
                setDraft((d) =>
                  d ? { ...d, seoTitleI18n, seoTitle: readLocale(seoTitleI18n, 'en') } : d,
                )
              }
            />
            <LocalizedField
              label="SEO description"
              value={draft.seoDescriptionI18n}
              multiline
              onChange={(seoDescriptionI18n) =>
                setDraft((d) =>
                  d ? { ...d, seoDescriptionI18n, seoDescription: readLocale(seoDescriptionI18n, 'en') } : d,
                )
              }
            />
          </Card>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {!hideCreate ? (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap items-end gap-2">
            <Input
              placeholder="New article title"
              value={newPost.title}
              onChange={(e) => setNewPost((p) => ({ ...p, title: e.target.value }))}
              className="min-w-[220px]"
            />
            <Input
              placeholder="Author"
              value={newPost.author}
              onChange={(e) => setNewPost((p) => ({ ...p, author: e.target.value }))}
              className="w-40"
            />
            <Button onClick={createPost} disabled={creating}>
              <Plus className="mr-2 h-4 w-4" />
              {creating ? 'Creating…' : 'New article'}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {posts.map((post) => (
          <Card key={String(post.id)} className="cursor-pointer p-4" onClick={() => openEdit(post)}>
            <div className="space-y-3">
              {post.image ? (
                <img
                  src={String(post.image)}
                  alt=""
                  className="h-36 w-full rounded-xl object-cover"
                />
              ) : null}
              <div>
                <p className="font-display text-lg font-bold text-burgundy">
                  {String(post.title || 'Untitled')}
                </p>
                <p className="line-clamp-2 text-sm text-brown-muted">
                  {String(post.excerpt || 'No description yet.')}
                </p>
              </div>
              <div className="flex items-center justify-between text-xs text-brown-muted">
                <span>{post.published ? 'Published' : 'Draft'}</span>
                <span>{String(post.readTime || '')}</span>
              </div>
            </div>
          </Card>
        ))}
        {!posts.length ? <p className="text-sm text-brown/60">No blog posts yet.</p> : null}
      </div>
    </div>
  )
}
