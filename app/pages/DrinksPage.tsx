import { useEffect, useState } from 'react'
import { Navigate } from 'react-router'
import ShopOrderPage, {
  type ShopCategory,
  type ShopProduct,
} from '@/components/shop/ShopOrderPage'
import { drinksCategories } from '@/data/drinksCatalog'
import { getShopProducts } from '@/services/catalogApi'
import CardSkeleton from '@/components/common/CardSkeleton'
import { usePageContent } from '@/hooks/usePageContent'
import { useServiceEnabled } from '@/hooks/useServiceEnabled'

export default function DrinksPage() {
  const [products, setProducts] = useState<ShopProduct[] | null>(null)
  const page = usePageContent('drinks')
  const { allowed, loading: serviceLoading } = useServiceEnabled('drinks')

  useEffect(() => {
    getShopProducts('drinks').then(setProducts)
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
      kind="drinks"
      hero={{
        eyebrow: page.eyebrow || 'Traditional Drinks',
        title: page.title || 'House-brewed tela & tej',
        description:
          page.description ||
          'Order our traditional drinks brewed in-house the authentic way.',
        crumbLabel: 'Traditional Drinks',
      }}
      products={products}
      categories={drinksCategories as ShopCategory[]}
      searchPlaceholder="Search drinks…"
      detailsHint="Tell us who you are and how to deliver your drinks order."
    />
  )
}
