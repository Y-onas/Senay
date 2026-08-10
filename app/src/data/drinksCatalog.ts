import type { ShopCategory, ShopProduct } from '@/components/shop/ShopOrderPage'

/** Traditional drinks catalogue — prices are placeholders for admin override later. */
export const drinksProducts: ShopProduct[] = [
  {
    id: 'tela',
    name: 'Tela',
    description:
      'Our signature house-brewed tela — smooth, malty, and made the traditional way with roasted barley and gesho.',
    price: 250,
    unit: 'L',
    category: 'drinks',
    image: '/images/tela-clean.png',
    minQty: 1,
    step: 0.5,
  },
  {
    id: 'tej',
    name: 'Tej',
    description:
      'Golden honey wine fermented in-house — lightly sweet with the classic gesho finish.',
    price: 450,
    unit: 'L',
    category: 'drinks',
    image: '/images/tej-clean.png',
    minQty: 1,
    step: 0.5,
  },
]

export const drinksCategories: ShopCategory[] = [{ value: 'all', label: 'All' }]
