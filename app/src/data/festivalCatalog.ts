export type FestivalPackageId =
  | 'grand'
  | 'premium'
  | 'classic'
  | 'essential'
  | 'basic'

export type FestivalItemIcon =
  | 'chicken'
  | 'eggs'
  | 'injera'
  | 'bread'
  | 'cheese'
  | 'oil'
  | 'drink'

export interface FestivalItem {
  id: string
  label: string
  icon: FestivalItemIcon
  /** When true, customer must pick Tej or Berz. */
  choice?: ('tej' | 'berz')[]
}

export interface FestivalPackage {
  id: FestivalPackageId
  name: string
  tagline: string
  badge?: 'Best Value' | 'Most Popular'
  items: FestivalItem[]
}

/** Celebration packages — ordered most premium → most basic. */
export const festivalPackages: FestivalPackage[] = [
  {
    id: 'grand',
    name: 'Festival Grand Package',
    tagline: 'The full celebration — chicken, bread, cheese, oil, and a house drink.',
    badge: 'Best Value',
    items: [
      { id: 'chicken', label: '1 Habesha Chicken', icon: 'chicken' },
      { id: 'eggs', label: '12 Eggs', icon: 'eggs' },
      { id: 'injera', label: '10 Injera', icon: 'injera' },
      { id: 'bread', label: '5 kg Defo Bread', icon: 'bread' },
      { id: 'ayib', label: '0.5 kg Ayib (Cheese)', icon: 'cheese' },
      { id: 'oil', label: '2 L Traditional Oil', icon: 'oil' },
      {
        id: 'drink',
        label: '2 L Tej or Berz (choose one)',
        icon: 'drink',
        choice: ['tej', 'berz'],
      },
    ],
  },
  {
    id: 'premium',
    name: 'Festival Premium Package',
    tagline: 'Chicken feast with injera, defo bread, and ayib.',
    items: [
      { id: 'chicken', label: '1 Habesha Chicken', icon: 'chicken' },
      { id: 'eggs', label: '12 Eggs', icon: 'eggs' },
      { id: 'injera', label: '10 Injera', icon: 'injera' },
      { id: 'bread', label: '5 kg Defo Bread', icon: 'bread' },
      { id: 'ayib', label: '0.5 kg Ayib (Cheese)', icon: 'cheese' },
    ],
  },
  {
    id: 'classic',
    name: 'Festival Classic Package',
    tagline: 'The classic holiday trio — chicken, eggs, injera, and cheese.',
    items: [
      { id: 'chicken', label: '1 Habesha Chicken', icon: 'chicken' },
      { id: 'eggs', label: '12 Eggs', icon: 'eggs' },
      { id: 'injera', label: '10 Injera', icon: 'injera' },
      { id: 'ayib', label: '0.5 kg Ayib (Cheese)', icon: 'cheese' },
    ],
  },
  {
    id: 'essential',
    name: 'Festival Essential Package',
    tagline: 'Everything you need for a proper festival table.',
    items: [
      { id: 'chicken', label: '1 Habesha Chicken', icon: 'chicken' },
      { id: 'eggs', label: '12 Eggs', icon: 'eggs' },
      { id: 'injera', label: '10 Injera', icon: 'injera' },
    ],
  },
  {
    id: 'basic',
    name: 'Festival Basic Package',
    tagline: 'A simple starting point — Habesha chicken and eggs.',
    items: [
      { id: 'chicken', label: '1 Habesha Chicken', icon: 'chicken' },
      { id: 'eggs', label: '12 Eggs', icon: 'eggs' },
    ],
  },
]

export type FestivalPriceTable = Record<FestivalPackageId, number>

/** Placeholder prices — replace via admin / localStorage override. */
export const DEFAULT_FESTIVAL_PRICES: FestivalPriceTable = {
  grand: 8500,
  premium: 6500,
  classic: 5200,
  essential: 4500,
  basic: 3500,
}

const PRICE_STORAGE_KEY = 'senay-festival-prices'

/** Load prices: admin override from localStorage, else defaults. */
export function getFestivalPrices(): FestivalPriceTable {
  if (typeof window === 'undefined') return DEFAULT_FESTIVAL_PRICES
  try {
    const raw = localStorage.getItem(PRICE_STORAGE_KEY)
    if (!raw) return DEFAULT_FESTIVAL_PRICES
    const parsed = JSON.parse(raw) as Partial<FestivalPriceTable>
    return { ...DEFAULT_FESTIVAL_PRICES, ...parsed }
  } catch {
    return DEFAULT_FESTIVAL_PRICES
  }
}

/** Admin helper — persist price table without code changes. */
export function setFestivalPrices(prices: FestivalPriceTable) {
  localStorage.setItem(PRICE_STORAGE_KEY, JSON.stringify(prices))
}

export function getFestivalPackage(
  id: FestivalPackageId,
): FestivalPackage | undefined {
  return festivalPackages.find((p) => p.id === id)
}

export function packageNeedsDrinkChoice(id: FestivalPackageId): boolean {
  const pkg = getFestivalPackage(id)
  return !!pkg?.items.some((i) => i.choice?.length)
}
