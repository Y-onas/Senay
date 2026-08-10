import type { MenuItem, Product, Category, CategorySlug } from '@/types'
import { menuItems } from '@/data/menu'
import { products } from '@/data/products'
import { categories } from '@/data/restaurant'
import { USE_MOCK, apiRequest, mockResolve } from './apiClient'

/** Menu + Shop catalogue reads. Swap mock branches for `apiRequest` when live. */

export async function getCategories(): Promise<Category[]> {
  if (USE_MOCK) return mockResolve(categories)
  return apiRequest<Category[]>('/categories')
}

export async function getMenuItems(category?: CategorySlug): Promise<MenuItem[]> {
  if (USE_MOCK) {
    const data = category
      ? menuItems.filter((item) => item.category === category)
      : menuItems
    return mockResolve(data)
  }
  const query = category ? `?category=${category}` : ''
  return apiRequest<MenuItem[]>(`/menu${query}`)
}

export async function getProducts(category?: CategorySlug): Promise<Product[]> {
  if (USE_MOCK) {
    const data = category
      ? products.filter((p) => p.category === category)
      : products
    return mockResolve(data)
  }
  const query = category ? `?category=${category}` : ''
  return apiRequest<Product[]>(`/products${query}`)
}

export async function getProductById(id: string): Promise<Product | undefined> {
  if (USE_MOCK) return mockResolve(products.find((p) => p.id === id))
  return apiRequest<Product>(`/products/${id}`)
}
