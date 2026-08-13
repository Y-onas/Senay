import { Package, Pencil, Plus, Trash2 } from 'lucide-react'
import { type CatalogItem } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CatalogItemThumb } from '@/features/services/components/CatalogItemThumb'
import { CollapsibleServiceSection } from '@/features/services/components/CollapsibleServiceSection'

export function CatalogPanel({
  title,
  description,
  addLabel,
  items,
  emptyLabel,
  onAdd,
  onEdit,
  onDelete,
  getSubtitle,
  defaultOpen = false,
}: {
  title: string
  description?: string
  addLabel: string
  items: CatalogItem[]
  emptyLabel: string
  onAdd: () => void
  onEdit: (item: CatalogItem) => void
  onDelete: (id: string) => void
  getSubtitle?: (item: CatalogItem) => string
  defaultOpen?: boolean
}) {
  return (
    <CollapsibleServiceSection
      title={title}
      description={description}
      count={items.length}
      defaultOpen={defaultOpen}
      icon={
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-burgundy/10 text-burgundy">
          <Package className="h-4 w-4" />
        </span>
      }
      headerAction={
        <Button onClick={onAdd} className="shrink-0 gap-2">
          <Plus className="h-4 w-4" />
          {addLabel}
        </Button>
      }
    >
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 bg-muted/20 py-12 text-center">
            <Plus className="h-8 w-8 text-brown-muted/40" strokeWidth={1.5} />
            <p className="text-sm text-brown-muted">{emptyLabel}</p>
            <Button variant="secondary" size="sm" onClick={onAdd} className="mt-1 gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              {addLabel}
            </Button>
          </div>
        ) : (
          items.map((item) => {
            const meta = item.metadata ?? {}
            const subtitle =
              getSubtitle?.(item) ??
              [item.kind, meta.tier ? String(meta.tier) : null, meta.mealType ? String(meta.mealType) : null]
                .filter(Boolean)
                .join(' · ')

            return (
              <div
                key={item.id}
                className="group flex items-center gap-3 rounded-xl border border-border/70 bg-white/90 p-3 transition-all hover:border-yellow-brand/40 hover:shadow-sm"
              >
                <CatalogItemThumb src={item.image} className="h-14 w-14 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-display text-base font-bold text-burgundy">{item.name}</p>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        item.available ? 'bg-green-brand/12 text-green-brand' : 'bg-muted text-brown-muted',
                      )}
                    >
                      {item.available ? 'Available' : 'Hidden'}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-brown-muted">
                    {subtitle}
                    {item.price != null ? ` · ${item.price} ETB` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => onEdit(item)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-crimson hover:bg-crimson/10 hover:text-crimson"
                    onClick={() => onDelete(item.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </CollapsibleServiceSection>
  )
}
