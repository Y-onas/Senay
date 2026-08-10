import { createContext } from 'react'
import type { CartItem, Product } from '@/types'

export interface CartContextValue {
  items: CartItem[]
  /** Total number of distinct line items. */
  count: number
  /** Sum of all line totals. */
  subtotal: number
  isOpen: boolean
  addItem: (product: Product, quantity?: number) => void
  updateQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clear: () => void
  openCart: () => void
  closeCart: () => void
}

export const CartContext = createContext<CartContextValue | null>(null)

export const CART_STORAGE_KEY = 'senay-tela-cart'
