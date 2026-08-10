export function parseNumber(value: unknown) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export function slugifyCatalog(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '-')
}

export function beveragePricingFromRegular(regular: number) {
  return {
    'food-only': regular,
    tela: regular,
    tej: regular,
    'tela-tej': regular,
    'berz-tej': regular,
  }
}

export function isDrinksSlug(slug: string) {
  return slug === 'drinks' || slug === 'traditional-drinks'
}

export function isFestivalSlug(slug: string) {
  return slug === 'festival' || slug === 'festival-package'
}

export const BALTINA_CATEGORIES = [
  { value: 'spices', label: 'Spices' },
  { value: 'flours', label: 'Flours' },
  { value: 'mixes', label: 'Traditional Mixes' },
] as const
