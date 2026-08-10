export type BaltinaCategory = 'all' | 'spices' | 'flours' | 'mixes'

export interface BaltinaProduct {
  id: string
  name: string
  description: string
  price: number
  unit: string
  category: Exclude<BaltinaCategory, 'all'>
  image: string
  /** Minimum order quantity */
  minQty: number
  step: number
}

/** Baltina pantry catalogue — prices are placeholders for admin override later. */
export const baltinaProducts: BaltinaProduct[] = [
  {
    id: 'shiro',
    name: 'Shiro',
    description:
      'Stone-ground chickpea flour blend — ready for a creamy, comforting shiro wat.',
    price: 350,
    unit: 'kg',
    category: 'flours',
    image: '/images/shiro-clean.png',
    minQty: 0.5,
    step: 0.5,
  },
  {
    id: 'berbere',
    name: 'Berbere',
    description:
      'Sun-dried chillies hand-blended with twelve spices — the soul of Ethiopian cooking.',
    price: 400,
    unit: 'kg',
    category: 'spices',
    image: '/images/berbere-clean.png',
    minQty: 0.5,
    step: 0.5,
  },
  {
    id: 'besso',
    name: 'Besso',
    description:
      'Roasted barley flour for traditional besso drink — nourishing and lightly sweet.',
    price: 280,
    unit: 'kg',
    category: 'flours',
    image: '/images/besso%20powder.png',
    minQty: 0.5,
    step: 0.5,
  },
  {
    id: 'oat-flour',
    name: 'Oat Flour',
    description:
      'Finely milled oat flour for porridge, baking, and everyday house cooking.',
    price: 250,
    unit: 'kg',
    category: 'flours',
    image: '/images/senay%20oats.png',
    minQty: 0.5,
    step: 0.5,
  },
  {
    id: 'porridge-flour',
    name: 'Porridge Flour',
    description:
      'House porridge blend — smooth, wholesome, and perfect for family breakfasts.',
    price: 260,
    unit: 'kg',
    category: 'flours',
    image: '/images/senay%20porridge.png',
    minQty: 0.5,
    step: 0.5,
  },
  {
    id: 'tela-ahl',
    name: 'Tela Ahl',
    description:
      'Traditional tela grain mix — barley and gesho prepared for authentic house brewing.',
    price: 320,
    unit: 'kg',
    category: 'mixes',
    image: '/images/tela%20ehl.png',
    minQty: 1,
    step: 0.5,
  },
]

export const baltinaCategories: { value: BaltinaCategory; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'spices', label: 'Spices' },
  { value: 'flours', label: 'Flours' },
  { value: 'mixes', label: 'Traditional Mixes' },
]

export function getBaltinaProduct(id: string): BaltinaProduct | undefined {
  return baltinaProducts.find((p) => p.id === id)
}
