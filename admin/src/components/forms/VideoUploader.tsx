import { useRef, useState } from 'react'
import { Loader2, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { mediaApi } from '@/lib/api'

export const VIDEO_UPLOAD_ACCEPT =
  'video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v'

type VideoUploaderProps = {
  value?: string | null
  onChange: (url: string | null) => void
  label?: string
  hint?: string
  disabled?: boolean
}

export function VideoUploader({
  value,
  onChange,
  label = 'Video',
  hint,
  disabled = false,
}: VideoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (file?: File | null) => {
    if (!file) return
    setUploading(true)
    try {
      const uploaded = await mediaApi.uploadFiles([file])
      const item = uploaded[0]
      if (!item?.url) throw new Error('Upload returned no file')
      onChange(item.url)
      toast.success('Video uploaded')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-1.5">
      {label ? <Label className="text-xs font-medium text-brown-muted">{label}</Label> : null}
      <div className="flex flex-wrap items-start gap-3">
        <div
          className={cn(
            'relative h-32 w-56 overflow-hidden rounded-lg border border-border/70 bg-muted/30 sm:h-36 sm:w-64',
            !value && 'border-dashed',
          )}
        >
          {value ? (
            <video src={value} className="h-full w-full object-cover" muted playsInline loop autoPlay />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-brown-muted/50">
              <Upload className="h-5 w-5" strokeWidth={1.5} />
              <span className="text-[10px]">No video</span>
            </div>
          )}
          {uploading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-burgundy/40 backdrop-blur-[2px]">
              <Loader2 className="h-5 w-5 animate-spin text-cream" />
            </div>
          ) : null}
        </div>
        <div className="flex min-w-[140px] flex-1 flex-wrap gap-1.5">
          <input
            ref={inputRef}
            type="file"
            accept={VIDEO_UPLOAD_ACCEPT}
            className="hidden"
            disabled={disabled || uploading}
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              void handleUpload(file)
            }}
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={disabled || uploading}
            className="h-8 gap-1.5 px-2.5 text-xs"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" />
            Upload video
          </Button>
          {value ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={disabled || uploading}
              className="h-8 gap-1.5 px-2.5 text-xs text-crimson hover:bg-crimson/10 hover:text-crimson"
              onClick={() => onChange(null)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </Button>
          ) : null}
        </div>
      </div>
      {hint ? <p className="text-[11px] text-brown-muted/70">{hint}</p> : null}
    </div>
  )
}
