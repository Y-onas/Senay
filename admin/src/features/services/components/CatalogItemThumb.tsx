import { ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function CatalogItemThumb({ src, className }: { src?: string | null; className?: string }) {
  if (src) {
    return (
      <div className={cn('overflow-hidden rounded-xl border border-border/70 bg-beige', className)}>
        <img src={src} alt="preview" className="h-full w-full object-cover" loading="lazy" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 text-brown-muted/50',
        className,
      )}
    >
      <ImageIcon className="h-6 w-6" strokeWidth={1.5} />
    </div>
  )
}
