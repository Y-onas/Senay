import { apiRequest, USE_MOCK, mockResolve, unwrapData } from './apiClient'
import type { ShopProduct } from '@/components/shop/ShopOrderPage'
import { baltinaProducts } from '@/data/baltinaCatalog'
import { drinksProducts } from '@/data/drinksCatalog'
import {
  festivalPackages,
  DEFAULT_FESTIVAL_PRICES,
  type FestivalPackage,
  type FestivalPackageId,
} from '@/data/festivalCatalog'
import {
  DEFAULT_AGELGIL_PRICES,
  agelgilMenus,
  type AgelgilPackageKind,
  type AgelgilPriceTable,
} from '@/data/agelgilCatalog'
import type { MealType } from '@/types'
import {
  fastingPackage,
  nonFastingPackages,
  cateringOccasions,
  beverageOptions,
  type CateringCatalogPackage,
} from '@/data/cateringCatalog'

export interface ApiService {
  id: string
  slug: string
  name: string
  description: string
  image: string | null
  sortOrder: number
  enabled?: boolean
}

export interface ApiCatalogItem {
  id: string
  slug: string
  kind: string
  name: string
  description: string
  price: string | number | null
  image: string | null
  images: string[]
  available: boolean
  sortOrder: number
  metadata: Record<string, unknown>
}

function num(v: string | number | null | undefined): number {
  if (v == null) return 0
  return typeof v === 'number' ? v : Number(v)
}

export async function getPublicServices(): Promise<ApiService[]> {
  if (USE_MOCK) {
    return mockResolve([
      { id: '1', slug: 'catering', name: 'Catering', description: '', image: null, sortOrder: 1 },
      { id: '2', slug: 'baltina', name: 'Baltina', description: '', image: null, sortOrder: 2 },
      { id: '3', slug: 'agelgil', name: 'Agelgil', description: '', image: null, sortOrder: 3 },
      { id: '4', slug: 'drinks', name: 'Drinks', description: '', image: null, sortOrder: 4 },
      { id: '5', slug: 'festival', name: 'Festival', description: '', image: null, sortOrder: 5 },
    ])
  }
  const res = await apiRequest<{ data: ApiService[] }>('/services')
  return unwrapData(res)
}

export async function getServiceCatalog(
  slug: string,
): Promise<{ service: ApiService; items: ApiCatalogItem[] }> {
  if (USE_MOCK) {
    return mockResolve({
      service: {
        id: 'mock',
        slug,
        name: slug,
        description: '',
        image: null,
        sortOrder: 0,
      },
      items: [],
    })
  }
  const res = await apiRequest<{
    data: { service: ApiService; items: ApiCatalogItem[] }
  }>(`/services/${slug}/catalog`)
  return unwrapData(res)
}

export async function getShopProducts(
  slug: 'baltina' | 'drinks',
): Promise<ShopProduct[]> {
  try {
    if (USE_MOCK) {
      return slug === 'baltina' ? baltinaProducts : drinksProducts
    }
    const { items } = await getServiceCatalog(slug)
    const products = items
      .filter((i) => i.kind === 'PRODUCT' && i.available)
      .map((i) => {
        const meta = i.metadata ?? {}
        return {
          id: i.slug,
          name: i.name,
          description: i.description,
          price: num(i.price),
          unit: String(meta.unit ?? 'kg'),
          category: String(meta.category ?? 'all'),
          image: i.image ?? '/images/foodreference.png',
          minQty: Number(meta.minQty ?? 1),
          step: Number(meta.step ?? 1),
        } satisfies ShopProduct
      })
    if (products.length) return products
  } catch (e) {
    console.warn(`Catalog ${slug} fallback to local data`, e)
  }
  return slug === 'baltina' ? baltinaProducts : drinksProducts
}

export async function getFestivalPackagesFromApi(): Promise<{
  packages: FestivalPackage[]
  prices: Record<FestivalPackageId, number>
}> {
  try {
    if (!USE_MOCK) {
      const { items } = await getServiceCatalog('festival')
      const packages: FestivalPackage[] = []
      const prices = { ...DEFAULT_FESTIVAL_PRICES }

      for (const i of items.filter((x) => x.kind === 'PACKAGE' && x.available)) {
        const meta = i.metadata ?? {}
        const id = i.slug as FestivalPackageId
        packages.push({
          id,
          name: i.name,
          tagline: String(meta.tagline ?? i.description),
          badge: meta.badge as FestivalPackage['badge'],
          items: (meta.items as FestivalPackage['items']) ?? [],
        })
        prices[id] = num(i.price)
      }
      if (packages.length) return { packages, prices }
    }
  } catch (e) {
    console.warn('Festival catalog fallback', e)
  }
  return { packages: festivalPackages, prices: DEFAULT_FESTIVAL_PRICES }
}

export async function getAgelgilPricingFromApi(): Promise<AgelgilPriceTable> {
  const config = await getAgelgilConfigFromApi()
  return config.priceTable
}

export async function getAgelgilConfigFromApi(): Promise<{
  priceTable: AgelgilPriceTable
  menus: Record<MealType, Record<AgelgilPackageKind, { label: string; dishes: string[] }>>
}> {
  const defaultMenus = agelgilMenus
  try {
    if (!USE_MOCK) {
      const { items } = await getServiceCatalog('agelgil')
      const config = items.find((i) => i.slug === 'pricing')
      const table = config?.metadata?.priceTable as AgelgilPriceTable | undefined
      const rawMenus = config?.metadata?.menus as
        | Record<string, { label?: string; dishes?: string[] }>
        | {
            fasting?: Record<string, { label?: string; dishes?: string[] }>
            'non-fasting'?: Record<string, { label?: string; dishes?: string[] }>
          }
        | undefined

      const pickMenu = (key: string, meal: MealType, kind: AgelgilPackageKind) => {
        const flat = rawMenus as Record<string, { label?: string; dishes?: string[] }> | undefined
        if (flat?.[key]) {
          return {
            label: flat[key].label ?? defaultMenus[meal][kind].label,
            dishes: flat[key].dishes ?? defaultMenus[meal][kind].dishes,
          }
        }
        const nested = rawMenus as
          | {
              fasting?: Record<string, { label?: string; dishes?: string[] }>
              'non-fasting'?: Record<string, { label?: string; dishes?: string[] }>
            }
          | undefined
        const entry = nested?.[meal]?.[kind]
        if (entry) {
          return {
            label: entry.label ?? defaultMenus[meal][kind].label,
            dishes: entry.dishes ?? defaultMenus[meal][kind].dishes,
          }
        }
        return defaultMenus[meal][kind]
      }

      const menus: Record<MealType, Record<AgelgilPackageKind, { label: string; dishes: string[] }>> = {
        fasting: {
          regular: pickMenu('fasting-regular', 'fasting', 'regular'),
          special: pickMenu('fasting-special', 'fasting', 'special'),
        },
        'non-fasting': {
          regular: pickMenu('non-fasting-regular', 'non-fasting', 'regular'),
          special: pickMenu('non-fasting-special', 'non-fasting', 'special'),
        },
      }

      if (table) {
        return {
          priceTable: { ...DEFAULT_AGELGIL_PRICES, ...table },
          menus,
        }
      }
    }
  } catch (e) {
    console.warn('Agelgil pricing fallback', e)
  }
  return {
    priceTable: DEFAULT_AGELGIL_PRICES,
    menus: defaultMenus,
  }
}

export async function getCateringPackagesFromApi(): Promise<
  CateringCatalogPackage[]
> {
  try {
    if (!USE_MOCK) {
      const { items } = await getServiceCatalog('catering')
      const pkgs = items
        .filter((i) => i.kind === 'PACKAGE' && i.available)
        .map((i) => {
          const meta = i.metadata ?? {}
          return {
            id: i.slug,
            tier: (meta.tier as CateringCatalogPackage['tier']) ?? 'silver',
            mealType:
              (meta.mealType as CateringCatalogPackage['mealType']) ??
              'non-fasting',
            name: i.name,
            nameAm: String(meta.nameAm ?? ''),
            badge: meta.badge as string | undefined,
            description: i.description,
            image: i.image ?? undefined,
            dishes: (meta.dishes as string[]) ?? [],
            fixedPricePerGuest: meta.fixedPricePerGuest as number | undefined,
            beveragePricing: meta.beveragePricing as
              | CateringCatalogPackage['beveragePricing']
              | undefined,
          } satisfies CateringCatalogPackage
        })
      if (pkgs.length) return pkgs
    }
  } catch (e) {
    console.warn('Catering catalog fallback', e)
  }
  return [fastingPackage, ...nonFastingPackages]
}

export interface CateringOccasionOption {
  value: string
  label: string
  emoji: string
}

export interface CateringBeverageOptionItem {
  value: string
  label: string
}

function mapCateringOccasionItem(item: ApiCatalogItem): CateringOccasionOption {
  const meta = item.metadata ?? {}
  return {
    value: item.slug,
    label: item.name,
    emoji: String(meta.emoji ?? '✨'),
  }
}

function mapCateringBeverageItem(item: ApiCatalogItem): CateringBeverageOptionItem {
  const meta = item.metadata ?? {}
  return {
    value: String(meta.value ?? item.slug),
    label: item.name,
  }
}

export async function getCateringOccasionsFromApi(): Promise<CateringOccasionOption[]> {
  try {
    if (!USE_MOCK) {
      const { items } = await getServiceCatalog('catering')
      const list = items
        .filter(
          (i) =>
            i.kind === 'CONFIG' &&
            i.metadata?.catalogRole === 'occasion' &&
            i.available,
        )
        .map(mapCateringOccasionItem)
      if (list.length) return list
    }
  } catch (e) {
    console.warn('Catering occasions fallback', e)
  }
  return cateringOccasions.map((o) => ({
    value: o.value,
    label: o.label,
    emoji: o.emoji,
  }))
}

export async function getCateringBeveragesFromApi(): Promise<CateringBeverageOptionItem[]> {
  try {
    if (!USE_MOCK) {
      const { items } = await getServiceCatalog('catering')
      const list = items
        .filter(
          (i) =>
            i.kind === 'CONFIG' &&
            i.metadata?.catalogRole === 'beverage' &&
            i.available,
        )
        .map(mapCateringBeverageItem)
      if (list.length) return list
    }
  } catch (e) {
    console.warn('Catering beverages fallback', e)
  }
  return beverageOptions.map((o) => ({
    value: o.value,
    label: o.label,
  }))
}
