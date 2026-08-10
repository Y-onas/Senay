import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<string, string> = {
  NEW: 'bg-yellow-brand/15 text-yellow-dark ring-yellow-brand/30',
  CONFIRMED: 'bg-green-brand/12 text-green-brand ring-green-brand/30',
  IN_PROGRESS: 'bg-burgundy/10 text-burgundy ring-burgundy/25',
  READY: 'bg-gold/15 text-yellow-dark ring-gold/30',
  COMPLETED: 'bg-green-brand/90 text-cream ring-green-brand',
  CANCELLED: 'bg-crimson/10 text-crimson ring-crimson/25',
}

const DOT_STYLES: Record<string, string> = {
  NEW: 'bg-yellow-brand',
  CONFIRMED: 'bg-green-brand',
  IN_PROGRESS: 'bg-burgundy',
  READY: 'bg-gold',
  COMPLETED: 'bg-cream',
  CANCELLED: 'bg-crimson',
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function RequestStatusBadge({
  status,
  className,
}: {
  status: string
  className?: string
}) {
  const key = status?.toUpperCase?.() ?? ''
  const style = STATUS_STYLES[key] ?? 'bg-muted text-brown-muted ring-border'
  const dot = DOT_STYLES[key] ?? 'bg-brown-muted'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset',
        style,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />
      {formatStatus(key || status)}
    </span>
  )
}

export const REQUEST_STATUS_OPTIONS = [
  'ALL',
  'NEW',
  'CONFIRMED',
  'IN_PROGRESS',
  'READY',
  'COMPLETED',
  'CANCELLED',
] as const
