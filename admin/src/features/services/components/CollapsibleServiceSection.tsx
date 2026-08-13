import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

export function CollapsibleServiceSection({
  title,
  description,
  count,
  icon,
  defaultOpen = false,
  headerAction,
  children,
}: {
  title: string
  description?: string
  count?: number
  icon?: ReactNode
  defaultOpen?: boolean
  headerAction?: ReactNode
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <div className="flex items-start gap-3 px-6 py-5">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex min-w-0 flex-1 items-start gap-3 rounded-xl text-left outline-none ring-offset-background transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring"
            >
              {icon ? <span className="mt-0.5 shrink-0">{icon}</span> : null}
              <span className="min-w-0 flex-1 py-0.5">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-lg font-semibold text-burgundy">{title}</span>
                  {typeof count === 'number' ? (
                    <span className="rounded-full bg-burgundy/10 px-2 py-0.5 text-[11px] font-semibold text-burgundy">
                      {count}
                    </span>
                  ) : null}
                </span>
                {description ? (
                  <span className="mt-1 block text-sm text-brown-muted">{description}</span>
                ) : null}
              </span>
              <ChevronDown
                className={cn(
                  'mt-1 h-5 w-5 shrink-0 text-brown-muted transition-transform duration-200',
                  open && 'rotate-180',
                )}
              />
            </button>
          </CollapsibleTrigger>
          {headerAction ? <div className="shrink-0 pt-0.5">{headerAction}</div> : null}
        </div>
        <CollapsibleContent>
          <CardContent className="border-t border-border/60 pt-4">{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
