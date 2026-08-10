import { type ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  icon,
  actions,
}: {
  title: string
  description?: string
  icon?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3.5">
        {icon ? (
          <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-yellow-brand/25 bg-gradient-to-br from-yellow-brand/15 to-gold/5 text-burgundy shadow-sm">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-bold text-burgundy">{title}</h1>
          {description ? <p className="admin-section-subtitle max-w-2xl">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
