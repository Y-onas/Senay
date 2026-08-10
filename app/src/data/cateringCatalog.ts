import type {
  CateringBeverageOption,
  CateringPackageTier,
  EventType,
  MealType,
} from '@/types'

export const CATERING_MIN_GUESTS = 40

export const cateringOccasions: { value: EventType; label: string; emoji: string }[] = [
  { value: 'wedding', label: 'Wedding', emoji: '💍' },
  { value: 'engagement', label: 'Engagement', emoji: '🫶' },
  { value: 'birthday', label: 'Birthday', emoji: '🎂' },
  { value: 'graduation', label: 'Graduation', emoji: '🎓' },
  { value: 'meeting', label: 'Meeting', emoji: '💼' },
  { value: 'memorial', label: 'Memorial', emoji: '🕊️' },
  { value: 'religious', label: 'Religious Event', emoji: '🙏' },
  { value: 'family', label: 'Family Gathering', emoji: '👨‍👩‍👧‍👦' },
  { value: 'corporate', label: 'Corporate Event', emoji: '🏢' },
  { value: 'other', label: 'Other', emoji: '✨' },
]

export const beverageOptions: {
  value: CateringBeverageOption
  label: string
}[] = [
  { value: 'food-only', label: 'Food Only' },
  { value: 'tela', label: 'With Tella' },
  { value: 'tej', label: 'With Tej' },
  { value: 'tela-tej', label: 'With Tella + Tej' },
  { value: 'berz-tej', label: 'With Berz + Tej' },
]

export interface CateringCatalogPackage {
  id: string
  tier: CateringPackageTier
  mealType: MealType
  name: string
  nameAm: string
  badge?: string
  description: string
  image?: string
  dishes: string[]
  /** Fasting packages use a single fixed price. */
  fixedPricePerGuest?: number
  /** Non-fasting packages use beverage-based pricing. */
  beveragePricing?: Record<CateringBeverageOption, number>
}

export const fastingPackage: CateringCatalogPackage = {
  id: 'fasting',
  tier: 'fasting',
  mealType: 'fasting',
  name: 'Maed Fasting',
  nameAm: 'ማእድ ጾም',
  description: 'A complete fasting spread — fully vegan, colourful, and ready to share.',
  fixedPricePerGuest: 1100,
  beveragePricing: {
    'food-only': 1100,
    tela: 1200,
    tej: 1450,
    'tela-tej': 1400,
    'berz-tej': 1500,
  },
  dishes: [
    'Misir Wat (Red Lentils)',
    'Kik Alicha (Split Peas)',
    'Shiro Wat',
    'Gomen (Collard Greens)',
    'Atakilt Wat (Cabbage, Carrot & Potato)',
    'Key Sir (Beet & Potato Salad)',
    'Fosolia (Green Beans)',
    'Azifa (Lentil Salad)',
    'Timatim Salata (Tomato Salad)',
    'Injera',
  ],
}

export const nonFastingPackages: CateringCatalogPackage[] = [
  {
    id: 'platinum',
    tier: 'platinum',
    mealType: 'non-fasting',
    name: "Ma'ed Almaz · Diamond Buffet",
    nameAm: 'ማእደ አልማዝ',
    badge: '💎',
    description: 'Our fullest celebration buffet — kitfo, wots, pasta, rice, injera, and more.',
    image: '/images/foodreference.png',
    beveragePricing: {
      'food-only': 1500,
      tela: 1600,
      tej: 1850,
      'tela-tej': 1800,
      'berz-tej': 1900,
    },
    dishes: [
      'ጥሬ ክትፎ (Tire Kitfo)',
      'ለብለብ ክትፎ (Lebleb Kitfo)',
      'ጎመን ክትፎ (Gomen Kitfo)',
      'አዲስ በነጭ (Ayeb Netch)',
      'አዲስ በቀይ (Ayeb Key)',
      'ቀይ ወጥ (Key Wot)',
      'ምንቸት አብሽ (Minchet Abish)',
      'ጎመን በስጋ (Gomen Besiga)',
      'ትሪፓ (Tripa)',
      'ዶሮ አልጫ (Doro Alicha)',
      'ዶሮ በቀይ (Doro Key)',
      'ሜት በል (Mêt Bel)',
      'የተጠበስ አትክልት (Yatabasa Atkilt)',
      'ሰላጣ (Salata)',
      'ሩዝ በስጋ (Ruz Besiga)',
      'ፓስታ አልፎርኖ (Pasta Al Forno)',
      'የተጠበሰ ድንች (Yatabasa Dintch)',
      'ፍርፍር (Firfir)',
      'ቀይ እንጀራ (Key Injera)',
      'ነጭ እንጀራ (Netch Injera)',
      'ሰላዴስ ዳቦ (Salades Dabo)',
      'ቆጮ (Kocho)',
    ],
  },
  {
    id: 'gold',
    tier: 'gold',
    mealType: 'non-fasting',
    name: "Ma'ed Werk · Gold Buffet",
    nameAm: 'ማእደ ወርቅ',
    badge: '🥇',
    description: 'Traditional kitfo, ayib, firfir, injera, and bread — classic and generous.',
    image: '/images/catering-risotto.jpg',
    beveragePricing: {
      'food-only': 1400,
      tela: 1500,
      tej: 1650,
      'tela-tej': 1750,
      'berz-tej': 1800,
    },
    dishes: [
      'ጥሬ ክትፎ (Tire Kitfo)',
      'ለብለብ ክትፎ (Lebleb Kitfo)',
      'ጎመን ክትፎ (Gomen Kitfo)',
      'አዲስ በነጭ (Ayeb Netch)',
      'አዲስ በቀይ (Ayeb Key)',
      'ፍርፍር (Firfir)',
      'ቀይ እንጀራ (Key Injera)',
      'ነጭ እንጀራ (Netch Injera)',
      'ሰላዴስ ዳቦ (Salades Dabo)',
      'ቆጮ (Kocho)',
    ],
  },
  {
    id: 'silver',
    tier: 'silver',
    mealType: 'non-fasting',
    name: "Ma'ed Birr · Silver Buffet",
    nameAm: 'ማእደ ብር',
    badge: '🥈',
    description: 'Hearty wots, doro, pasta, rice, firfir, and injera — a classic feast.',
    image: '/images/cat-chicken.png',
    beveragePricing: {
      'food-only': 1300,
      tela: 1400,
      tej: 1650,
      'tela-tej': 1600,
      'berz-tej': 1700,
    },
    dishes: [
      'ቀይ ወጥ (Key Wot)',
      'ምንቸት አብሽ (Minchet Abish)',
      'ጎመን በስጋ (Gomen Besiga)',
      'ትሪፓ (Tripa)',
      'ዶሮ አልጫ (Doro Alicha)',
      'ዶሮ በቀይ (Doro Key)',
      'ሜት በል (Mêt Bel)',
      'የተጠበስ አትክልት (Yatabasa Atkilt)',
      'ሰላጣ (Salata)',
      'ሩዝ በስጋ (Ruz Besiga)',
      'ፓስታ አልፎርኖ (Pasta Al Forno)',
      'ፍርፍር (Firfir)',
      'ቀይ እንጀራ (Key Injera)',
      'ነጭ እንጀራ (Netch Injera)',
      'ሰላዴስ ዳቦ (Salades Dabo)',
      'ቆጮ (Kocho)',
    ],
  },
]

export function getPackageById(id: string): CateringCatalogPackage | undefined {
  if (id === fastingPackage.id) return fastingPackage
  return nonFastingPackages.find((p) => p.id === id)
}

export function getPricePerGuest(
  pkg: CateringCatalogPackage,
  beverage: CateringBeverageOption = 'food-only',
): number {
  if (pkg.beveragePricing?.[beverage] != null) return pkg.beveragePricing[beverage]
  if (pkg.fixedPricePerGuest != null) return pkg.fixedPricePerGuest
  return 0
}

export function getOccasionLabel(
  eventType: EventType,
  customOccasion?: string,
): string {
  if (eventType === 'other' && customOccasion?.trim()) return customOccasion.trim()
  return cateringOccasions.find((o) => o.value === eventType)?.label ?? eventType
}

export function getBeverageLabel(option: CateringBeverageOption): string {
  return beverageOptions.find((b) => b.value === option)?.label ?? option
}
