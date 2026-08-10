import { type ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function FieldGroup({
  label,
  children,
  className,
  hint,
}: {
  label: string
  children: ReactNode
  className?: string
  hint?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label className="text-xs font-medium text-brown-muted">{label}</Label>
      {children}
      {hint ? <p className="text-[11px] text-brown-muted/70">{hint}</p> : null}
    </div>
  )
}
