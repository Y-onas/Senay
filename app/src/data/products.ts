import type { Product } from '@/types'

/**
 * Shop catalogue (purchasable). Mirrors a Products API response.
 */
export const products: Product[] = [
  {
    id: 'tela-1l',
    name: 'House Tela',
    description:
      'Traditional fermented barley brew, bottled fresh from the clay pot. Smoky, light and refreshing.',
    image: '/images/senay-tela.png',
    price: 120,
    unit: 'liter',
    category: 'drinks',
    minQuantity: 1,
    step: 1,
    inStock: true,
    tags: ['House Brew'],
    featured: true,
  },
  {
    id: 'tej-1l',
    name: 'Classic Tej',
    description:
      'Golden honey wine aged with gesho leaves — smooth, floral and lightly sparkling.',
    image: '/images/senay-tej.png',
    price: 180,
    unit: 'liter',
    category: 'drinks',
    minQuantity: 1,
    step: 1,
    inStock: true,
    tags: ['Honey Wine'],
    featured: true,
  },
  {
    id: 'shiro-kg',
    name: 'Shiro Powder',
    description:
      'Stone-ground chickpea and spice blend. Just add water and simmer for a creamy, comforting stew.',
    image: '/images/senay-shiro.png',
    price: 350,
    unit: 'kg',
    category: 'products',
    minQuantity: 1,
    step: 0.5,
    inStock: true,
    tags: ['Pantry', 'Vegan'],
    featured: true,
  },
  {
    id: 'berbere-kg',
    name: 'Berbere Spice',
    description:
      'Our signature berbere — sun-dried chillies hand-blended with twelve spices. The heart of Ethiopian cooking.',
    image: '/images/senay-berbere.png',
    price: 400,
    unit: 'kg',
    category: 'products',
    minQuantity: 0.5,
    step: 0.5,
    inStock: true,
    tags: ['Pantry', 'Spicy'],
    featured: true,
  },
  {
    id: 'niter-kibbeh',
    name: 'Niter Kibbeh',
    description:
      'Spiced clarified butter infused with garlic, ginger and aromatic herbs. Adds depth to any dish.',
    price: 300,
    unit: 'kg',
    category: 'products',
    minQuantity: 0.5,
    step: 0.5,
    inStock: true,
    tags: ['Pantry'],
  },
  {
    id: 'mitmita-kg',
    name: 'Mitmita',
    description:
      'Fiery birds-eye chilli blend with cardamom and cloves — the classic companion to kitfo.',
    price: 420,
    unit: 'kg',
    category: 'products',
    minQuantity: 0.5,
    step: 0.5,
    inStock: true,
    tags: ['Pantry', 'Spicy'],
  },
]
