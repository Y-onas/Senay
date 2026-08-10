import type { MealType } from '@/types'

/** Configurable serving sizes for Agelgil packages. */
export const AGELGIL_SIZES = [10, 15, 20, 30] as const
export type AgelgilSize = (typeof AGELGIL_SIZES)[number]

export type AgelgilPackageKind = 'regular' | 'special'

export type AgelgilPriceKey =
  | 'fasting-regular'
  | 'fasting-special'
  | 'non-fasting-regular'
  | 'non-fasting-special'

export type AgelgilPriceTable = Record<AgelgilPriceKey, Record<AgelgilSize, number>>

/** Placeholder prices — replace via admin / localStorage override. */
export const DEFAULT_AGELGIL_PRICES: AgelgilPriceTable = {
  'fasting-regular': { 10: 3500, 15: 5000, 20: 6500, 30: 9000 },
  'fasting-special': { 10: 4500, 15: 6500, 20: 8500, 30: 12000 },
  'non-fasting-regular': { 10: 3500, 15: 5000, 20: 6500, 30: 9000 },
  'non-fasting-special': { 10: 4500, 15: 6500, 20: 8500, 30: 12000 },
}

const PRICE_STORAGE_KEY = 'senay-agelgil-prices'

/** Load prices: admin override from localStorage, else defaults. */
export function getAgelgilPrices(): AgelgilPriceTable {
  if (typeof window === 'undefined') return DEFAULT_AGELGIL_PRICES
  try {
    const raw = localStorage.getItem(PRICE_STORAGE_KEY)
    if (!raw) return DEFAULT_AGELGIL_PRICES
    const parsed = JSON.parse(raw) as AgelgilPriceTable
    return { ...DEFAULT_AGELGIL_PRICES, ...parsed }
  } catch {
    return DEFAULT_AGELGIL_PRICES
  }
}

/** Admin helper — persist price table without code changes. */
export function setAgelgilPrices(prices: AgelgilPriceTable) {
  localStorage.setItem(PRICE_STORAGE_KEY, JSON.stringify(prices))
}

export function priceKey(
  mealType: MealType,
  kind: AgelgilPackageKind,
): AgelgilPriceKey {
  return `${mealType}-${kind}` as AgelgilPriceKey
}

export function getPackagePrice(
  mealType: MealType,
  kind: AgelgilPackageKind,
  size: AgelgilSize,
  prices: AgelgilPriceTable = getAgelgilPrices(),
): number {
  return prices[priceKey(mealType, kind)][size]
}

const FASTING_REGULAR_DISHES = [
  'Misir Wat (Red Lentils)',
  'Kik Alicha (Split Peas)',
  'Shiro Wat',
  'Gomen (Collard Greens)',
  'Atakilt Wat',
  'Fosolia (Green Beans)',
  'Timatim Salata',
  'Injera',
]

const NON_FASTING_REGULAR_DISHES = [
  'Doro Wat',
  'Key Wat',
  'Tibs',
  'Shiro Wat',
  'Gomen',
  'Atakilt Wat',
  'Salata',
  'Injera',
]

export const agelgilMenus: Record<
  MealType,
  Record<AgelgilPackageKind, { label: string; dishes: string[] }>
> = {
  fasting: {
    regular: {
      label: 'Regular Fasting',
      dishes: FASTING_REGULAR_DISHES,
    },
    special: {
      label: 'Special Fasting',
      dishes: [...FASTING_REGULAR_DISHES, 'Sambusa', 'አነባብሮ (Anebabro)'],
    },
  },
  'non-fasting': {
    regular: {
      label: 'Regular Non-Fasting',
      dishes: NON_FASTING_REGULAR_DISHES,
    },
    special: {
      label: 'Special Non-Fasting',
      dishes: [
        ...NON_FASTING_REGULAR_DISHES,
        'Kitfo',
        'አይብ (Cheese)',
        'Kocho',
      ],
    },
  },
}

export interface AgelgilPackageLine {
  size: AgelgilSize
  quantity: number
  unitPrice: number
  lineTotal: number
}

/**
 * Combine fixed-size packages to cover `guests` with the fewest packages.
 * Prefer less overage when package counts tie.
 */
export function combineAgelgilPackages(
  guests: number,
  mealType: MealType,
  kind: AgelgilPackageKind,
  prices: AgelgilPriceTable = getAgelgilPrices(),
): AgelgilPackageLine[] {
  if (guests <= 0) return []

  const sizes = [...AGELGIL_SIZES].sort((a, b) => b - a)
  const max = guests + Math.max(...sizes)
  const INF = 1e9
  const dp = Array(max + 1).fill(INF)
  const prevSize = Array<AgelgilSize | 0>(max + 1).fill(0)
  const prevCap = Array(max + 1).fill(-1)
  dp[0] = 0

  for (let cap = 0; cap <= max; cap++) {
    if (dp[cap] >= INF) continue
    for (const size of sizes) {
      const next = cap + size
      if (next > max) continue
      if (dp[cap] + 1 < dp[next]) {
        dp[next] = dp[cap] + 1
        prevSize[next] = size
        prevCap[next] = cap
      }
    }
  }

  let bestCap = -1
  let bestPacks = INF
  let bestOverage = INF
  for (let cap = guests; cap <= max; cap++) {
    if (dp[cap] >= INF) continue
    const overage = cap - guests
    if (
      dp[cap] < bestPacks ||
      (dp[cap] === bestPacks && overage < bestOverage)
    ) {
      bestPacks = dp[cap]
      bestOverage = overage
      bestCap = cap
    }
  }

  if (bestCap < 0) return []

  const counts = new Map<AgelgilSize, number>()
  let cur = bestCap
  while (cur > 0) {
    const size = prevSize[cur] as AgelgilSize
    counts.set(size, (counts.get(size) ?? 0) + 1)
    cur = prevCap[cur]
  }

  return [...counts.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([size, quantity]) => {
      const unitPrice = getPackagePrice(mealType, kind, size, prices)
      return {
        size,
        quantity,
        unitPrice,
        lineTotal: unitPrice * quantity,
      }
    })
}

export function sumAgelgilTotal(lines: AgelgilPackageLine[]): number {
  return lines.reduce((sum, line) => sum + line.lineTotal, 0)
}

export function coveredGuests(lines: AgelgilPackageLine[]): number {
  return lines.reduce((sum, line) => sum + line.size * line.quantity, 0)
}

export function formatComboLabel(lines: AgelgilPackageLine[]): string {
  if (!lines.length) return '—'
  return lines
    .map((l) => `${l.quantity} × ${l.size}-person`)
    .join(' + ')
}
