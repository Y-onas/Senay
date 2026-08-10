import { useEffect, useState } from 'react'
import { Navigate } from 'react-router'
import ShopOrderPage, {
  type ShopCategory,
  type ShopProduct,
} from '@/components/shop/ShopOrderPage'
import { baltinaCategories } from '@/data/baltinaCatalog'
import { getShopProducts } from '@/services/catalogApi'
import CardSkeleton from '@/components/common/CardSkeleton'
import { usePageContent } from '@/hooks/usePageContent'
import { useServiceEnabled } from '@/hooks/useServiceEnabled'

export default function BaltinaPage() {
  const [products, setProducts] = useState<ShopProduct[] | null>(null)
  const page = usePageContent('baltina')
  const { allowed, loading: serviceLoading } = useServiceEnabled('baltina')

  useEffect(() => {
    getShopProducts('baltina').then(setProducts)
  }, [])

  if (serviceLoading) return null
  if (!allowed) return <Navigate to="/" replace />

  if (!products) {
    return (
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-24 sm:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  return (
    <ShopOrderPage
      kind="baltina"
      hero={{
        eyebrow: page.eyebrow || 'Baltina',
        title: page.title || 'House-made pantry essentials',
        description:
          page.description ||
          'Browse our stone-ground flours, spice blends, and traditional mixes.',
        crumbLabel: 'Baltina',
      }}
      products={products}
      categories={baltinaCategories as ShopCategory[]}
      searchPlaceholder="Search Baltina products…"
      detailsHint="Tell us who you are and how to deliver your Baltina order."
    />
  )
}
