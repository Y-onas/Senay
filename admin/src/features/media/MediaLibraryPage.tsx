import { useEffect, useRef, useState } from 'react'
import { Image, Search, Trash2, Upload, FolderInput } from 'lucide-react'
import { toast } from 'sonner'
import { mediaApi, type Media } from '@/lib/api'
import { IMAGE_UPLOAD_ACCEPT } from '@/components/forms/ImageUploader'
import { ADMIN_CONFIRM, confirmAdminAction } from '@/lib/confirm-messages'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

function mediaName(item: Media) {
  return item.originalName || item.filename || 'Untitled'
}

function mediaSize(item: Media) {
  const bytes = item.sizeBytes ?? item.size ?? 0
  return (bytes / 1024).toFixed(1)
}

export function MediaLibraryPage() {
  const [items, setItems] = useState<Media[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [editing, setEditing] = useState<Media | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const load = (q = query) => {
    setLoading(true)
    mediaApi
      .list(q)
      .then(setItems)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    try {
      const uploaded = await mediaApi.uploadFiles(Array.from(files))
      setItems((rows) => [...uploaded, ...rows])
      toast.success(`${uploaded.length} file(s) uploaded`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const saveMeta = async () => {
    if (!editing) return
    await mediaApi.update(editing.id, { alt: editing.alt, caption: editing.caption })
    setItems((rows) => rows.map((row) => (row.id === editing.id ? editing : row)))
    setEditing(null)
    toast.success('Updated')
  }

  const importPublic = async () => {
    if (!(await confirmAdminAction(ADMIN_CONFIRM.importPublicImages))) return
    setImporting(true)
    try {
      const result = await mediaApi.importPublic()
      toast.success(
        `Imported ${result.imported} files · updated ${result.updated} content links`,
      )
      load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const remove = async (item: Media) => {
    setEditing(null)
    if (!(await confirmAdminAction(ADMIN_CONFIRM.deleteMedia))) return
    try {
      await mediaApi.delete(item.id)
      setItems((rows) => rows.filter((row) => row.id !== item.id))
      toast.success('File deleted')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed')
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-burgundy">Media Library</h1>
          <p className="text-brown-muted">
            Upload images to Cloudinary, or reuse them across the site.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={`${IMAGE_UPLOAD_ACCEPT},video/mp4,video/webm,video/quicktime,.pdf,.doc,.docx`}
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
          <Button variant="outline" onClick={importPublic} disabled={importing || uploading}>
            <FolderInput className="mr-2 h-4 w-4" />
            {importing ? 'Importing…' : 'Import site images'}
          </Button>
          <Button onClick={() => inputRef.current?.click()} disabled={uploading || importing}>
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? 'Uploading…' : 'Upload files'}
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search media..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(query)}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <Skeleton key={index} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center">
          <Image className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-brown-muted">No media yet. Upload your first file.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg border bg-white hover:ring-2 hover:ring-ring"
              onClick={() => setEditing(item)}
            >
              {item.type === 'IMAGE' || !item.type ? (
                <img
                  src={item.url}
                  alt={item.alt || mediaName(item)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted text-sm text-brown-muted">
                  {item.type}
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <p className="truncate text-xs text-white">{mediaName(item)}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit media</DialogTitle>
          </DialogHeader>
          {editing ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {editing.type === 'IMAGE' || !editing.type ? (
                <img
                  src={editing.url}
                  alt={editing.alt || ''}
                  className="aspect-square rounded-lg bg-muted object-cover"
                />
              ) : (
                <div className="flex aspect-square items-center justify-center rounded-lg bg-muted">
                  {editing.type}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <p className="text-sm text-brown-muted">{mediaName(editing)}</p>
                </div>
                <div>
                  <Label htmlFor="alt">Alt text</Label>
                  <Input
                    id="alt"
                    value={editing.alt || ''}
                    onChange={(e) => setEditing({ ...editing, alt: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="caption">Caption</Label>
                  <Input
                    id="caption"
                    value={editing.caption || ''}
                    onChange={(e) => setEditing({ ...editing, caption: e.target.value })}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>URL: {editing.url}</p>
                  <p>Type: {editing.mimeType}</p>
                  <p>Size: {mediaSize(editing)} KB</p>
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter className="gap-2">
            <Button variant="destructive" onClick={() => editing && remove(editing)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Button onClick={saveMeta}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
