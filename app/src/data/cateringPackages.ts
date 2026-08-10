import type { CateringPackage } from '@/types'
import {
  CATERING_MIN_GUESTS,
  fastingPackage,
  nonFastingPackages,
} from './cateringCatalog'

/** Legacy list shape for getCateringPackages(). */
export const cateringPackages: CateringPackage[] = [
  ...nonFastingPackages.map((p) => ({
    id: p.id,
    name: `${p.nameAm} (${p.name})`,
    description: p.description,
    guestRange: [CATERING_MIN_GUESTS, 500] as [number, number],
    pricePerGuest: p.beveragePricing!['food-only'],
    highlights: p.dishes.slice(0, 4),
    popular: p.tier === 'platinum',
  })),
  {
    id: fastingPackage.id,
    name: `${fastingPackage.nameAm} (${fastingPackage.name})`,
    description: fastingPackage.description,
    guestRange: [CATERING_MIN_GUESTS, 500],
    pricePerGuest: fastingPackage.fixedPricePerGuest!,
    highlights: fastingPackage.dishes.slice(0, 4),
  },
]
