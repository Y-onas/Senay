/**
 * Domain types for the Senay Tela platform.
 *
 * These interfaces describe the shape of data exchanged with the (future)
 * backend API. The mock services in `src/services` return these exact shapes,
 * so swapping mock data for real HTTP calls requires no changes in the UI.
 */

export type ID = string

/** Measurement unit a product is sold by. */
export type Unit = 'liter' | 'kg' | 'piece' | 'pack'

/** Top-level grouping used across menu and shop. */
export type CategorySlug = 'food' | 'drinks' | 'products'

export interface Category {
  slug: CategorySlug
  /** e.g. "Traditional Dishes", "Tela & Tej" */
  name: string
  description?: string
}

/**
 * A menu item shown on the digital menu. Read-only catalogue content
 * (not necessarily purchasable online).
 */
export interface MenuItem {
  id: ID
  name: string
  description: string
  /** Optional remote URL or local path. When absent the UI renders a branded placeholder. */
  image?: string
  price: number
  /** ISO currency code, defaults handled in formatting util. */
  currency?: string
  category: CategorySlug
  /** Optional finer grouping, e.g. "Vegan", "Fasting (Beyaynetu)". */
  tags?: string[]
  spicy?: boolean
  vegetarian?: boolean
  featured?: boolean
}

/** A purchasable product in the shop. */
export interface Product {
  id: ID
  name: string
  description: string
  image?: string
  price: number
  currency?: string
  unit: Unit
  category: CategorySlug
  /** Minimum order quantity (e.g. 1 liter). */
  minQuantity?: number
  /** Increment step for the quantity selector. */
  step?: number
  inStock?: boolean
  tags?: string[]
  featured?: boolean
}

/** A single line in the cart / order. */
export interface CartItem {
  product: Product
  quantity: number
}

export type FulfillmentMethod = 'delivery' | 'pickup'
export type PaymentMethod = 'chapa' | 'bank_transfer'
export type OrderStatus =
  | 'pending'
  | 'awaiting_payment'
  | 'paid'
  | 'preparing'
  | 'completed'
  | 'cancelled'
export type PaymentStatus = 'unpaid' | 'pending_verification' | 'paid' | 'failed'

export interface CustomerInfo {
  name: string
  phone: string
  /** Required for delivery, optional for pickup. */
  address?: string
  email?: string
  notes?: string
}

export interface OrderLine {
  productId: ID
  name: string
  unit: Unit
  unitPrice: number
  quantity: number
  lineTotal: number
}

/** Payload sent to the Orders API when placing an order. */
export interface OrderDraft {
  customer: CustomerInfo
  fulfillment: FulfillmentMethod
  payment: PaymentMethod
  items: OrderLine[]
  subtotal: number
  deliveryFee: number
  total: number
  currency: string
  /** Data URL / file reference of the bank-transfer receipt, if uploaded. */
  paymentProof?: string
}

/** Full order as returned by the API after creation. */
export interface Order extends OrderDraft {
  id: ID
  reference: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  createdAt: string
}

/* ----------------------------- Catering ----------------------------- */

export type EventType =
  | 'wedding'
  | 'engagement'
  | 'birthday'
  | 'graduation'
  | 'meeting'
  | 'memorial'
  | 'religious'
  | 'family'
  | 'corporate'
  | 'other'

export type MealType = 'fasting' | 'non-fasting'

export type CateringPackageTier = 'platinum' | 'gold' | 'silver' | 'fasting'

export type CateringBeverageOption =
  | 'food-only'
  | 'tela'
  | 'tej'
  | 'tela-tej'
  | 'berz-tej'

export type CateringDeliveryMethod = 'pickup' | 'delivery'

/** @deprecated Legacy dish picker — packages now include fixed menus. */
export interface CateringFoodSelection {
  id: ID
  name: string
  quantity: number
}

/** @deprecated Legacy drink picker — use beverageOption instead. */
export interface CateringDrinkSelection {
  id: ID
  name: string
  liters: number
}

/** Suggested all-in package the customer can start from. */
export interface CateringPackage {
  id: ID
  name: string
  description: string
  guestRange: [number, number]
  pricePerGuest: number
  highlights: string[]
  image?: string
  popular?: boolean
}

/** Payload sent to the Catering API. */
export interface CateringRequestDraft {
  guests: number
  eventType: string
  customOccasion?: string
  mealType: MealType
  packageId: ID
  beverageOption?: CateringBeverageOption
  pricePerGuest: number
  totalPrice: number
  deliveryMethod: CateringDeliveryMethod
  date: string
  time: string
  location: string
  contact: CustomerInfo
  specialInstructions?: string
}

export interface CateringRequest extends CateringRequestDraft {
  id: ID
  reference: string
  status: 'received' | 'contacted' | 'confirmed' | 'declined'
  createdAt: string
}

/* ------------------------------ Blog ------------------------------- */

export interface BlogPost {
  id: ID
  slug: string
  title: string
  excerpt: string
  /** Legacy paragraph content — prefer blocks when available. */
  content: string[]
  blocks?: import('./blogBlocks').BlogBlock[]
  image?: string
  author: string
  date: string
  readTime: string
  tags?: string[]
  seoTitle?: string | null
  seoDescription?: string | null
  published?: boolean
}

/* --------------------------- Restaurant ---------------------------- */

export interface OpeningHour {
  day: string
  hours: string
}

export interface SocialLink {
  label: string
  href: string
}

export interface RestaurantInfo {
  name: string
  tagline: string
  phone: string
  email: string
  address: string
  mapUrl: string
  openingHours: OpeningHour[]
  social: SocialLink[]
  bankAccount: {
    bankName: string
    accountName: string
    accountNumber: string
  }
}

/** Generic API envelope so the shape matches a real backend later. */
export interface ApiResponse<T> {
  data: T
  message?: string
}
