import { useMemo, useState } from 'react'
import type { CategorySlug } from '@/types'
import { getMenuItems } from '@/services'
import { categories } from '@/data/restaurant'
import { useAsync } from '@/hooks/useAsync'
import PageHero from '@/components/common/PageHero'
import MenuCard from '@/components/menu/MenuCard'
import CardSkeleton from '@/components/common/CardSkeleton'
import ScrollReveal from '@/components/common/ScrollReveal'
import { cn } from '@/lib/utils'

type Filter = 'all' | CategorySlug

const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  ...categories.map((c) => ({ value: c.slug, label: c.name })),
]

export default function MenuPage() {
  const [active, setActive] = useState<Filter>('all')
  const { data: items, loading } = useAsync(() => getMenuItems(), [])

  const visible = useMemo(() => {
    if (!items) return []
    return active === 'all' ? items : items.filter((i) => i.category === active)
  }, [items, active])

  return (
    <>
      <PageHero
        eyebrow="Our Menu"
        title="The Senay Tela menu"
        description="Slow-cooked classics, house-brewed drinks and take-home products — all made the traditional way."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Menu' }]}
      />

      <section className="bg-cream py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Category filter */}
          <div className="mb-10 flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setActive(f.value)}
                className={cn(
                  'rounded-full px-5 py-2.5 text-sm font-semibold transition-colors',
                  active === f.value
                    ? 'bg-burgundy text-white'
                    : 'bg-white text-gray-600 hover:bg-burgundy/10 hover:text-burgundy',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <CardSkeleton count={6} />
          ) : visible.length === 0 ? (
            <p className="py-16 text-center text-gray-500">
              No items in this category yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((item, i) => (
                <ScrollReveal key={item.id} delay={(i % 3) * 0.08}>
                  <MenuCard item={item} />
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
