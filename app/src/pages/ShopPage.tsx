import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ShoppingBag } from 'lucide-react'
import type { CategorySlug } from '@/types'
import { getProducts } from '@/services'
import { categories } from '@/data/restaurant'
import { useAsync } from '@/hooks/useAsync'
import { useCart } from '@/hooks/useCart'
import { useEnabledServices } from '@/hooks/useEnabledServices'
import { formatPrice } from '@/lib/format'
import PageHero from '@/components/common/PageHero'
import ProductCard from '@/components/shop/ProductCard'
import CardSkeleton from '@/components/common/CardSkeleton'
import ScrollReveal from '@/components/common/ScrollReveal'
import { cn } from '@/lib/utils'

type Filter = 'all' | CategorySlug

const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All Products' },
  { value: 'drinks', label: 'Tela & Tej' },
  { value: 'products', label: 'Spices & Staples' },
]

export default function ShopPage() {
  const [active, setActive] = useState<Filter>('all')
  const { data: products, loading } = useAsync(() => getProducts(), [])
  const { count, subtotal, openCart } = useCart()
  const { isHrefEnabled } = useEnabledServices()
  const showCateringLink = isHrefEnabled('/catering')

  const visible = useMemo(() => {
    if (!products) return []
    return active === 'all'
      ? products
      : products.filter((p) => p.category === active)
  }, [products, active])

  return (
    <>
      <PageHero
        eyebrow="Shop"
        title="Order traditional products"
        description="Fresh tela and tej by the liter, stone-ground spices by the kilo. Delivered across Addis Ababa or ready for self pickup."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Shop' }]}
      />

      <section className="bg-cream py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
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

            {count > 0 && (
              <button
                onClick={openCart}
                className="inline-flex items-center gap-2 self-start rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-burgundy shadow-sm transition-colors hover:bg-burgundy/10 sm:self-auto"
              >
                <ShoppingBag className="h-4 w-4" />
                {count} item{count > 1 ? 's' : ''} · {formatPrice(subtotal)}
              </button>
            )}
          </div>

          {loading ? (
            <CardSkeleton count={6} />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visible.map((product, i) => (
                <ScrollReveal key={product.id} delay={(i % 4) * 0.06}>
                  <ProductCard product={product} />
                </ScrollReveal>
              ))}
            </div>
          )}

          {/* Empty-cart helper */}
          <div className="mt-12 rounded-3xl bg-white p-6 text-center shadow-sm sm:p-8">
            <p className="text-gray-500">
              Looking to feed a crowd?{' '}
              {showCateringLink ? (
                <>
                  <Link to="/catering" className="font-semibold text-burgundy hover:underline">
                    Explore our catering service
                  </Link>{' '}
                  for events of any size.
                </>
              ) : (
                <>Contact us for large orders and event planning.</>
              )}
            </p>
          </div>
          {/* Category description footnote */}
          <p className="mt-6 text-center text-xs text-gray-400">
            {categories.find((c) => c.slug === 'products')?.description}
          </p>
        </div>
      </section>
    </>
  )
}
