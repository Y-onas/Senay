import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router'
import { ShoppingBag, Trash2, X } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { formatPrice, formatQuantity } from '@/lib/format'
import FoodVisual from '@/components/common/FoodVisual'
import QuantityStepper from '@/components/common/QuantityStepper'

/** Global slide-over cart, controlled by CartContext. */
export default function CartDrawer() {
  const {
    items,
    isOpen,
    subtotal,
    closeCart,
    updateQuantity,
    removeItem,
  } = useCart()

  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart()
    }
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen, closeCart])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            aria-hidden="true"
            className="fixed inset-0 z-[60] bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Your Cart"
            className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-md flex-col bg-cream shadow-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className="flex items-center justify-between border-b border-burgundy/10 px-5 py-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-burgundy" />
                <h2 className="font-display text-lg font-bold uppercase text-gray-900">
                  Your Cart
                </h2>
              </div>
              <button
                ref={closeButtonRef}
                onClick={closeCart}
                aria-label="Close cart"
                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-burgundy/10 hover:text-burgundy"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-burgundy/10">
                  <ShoppingBag className="h-7 w-7 text-burgundy" />
                </div>
                <p className="font-display text-xl font-bold uppercase text-gray-900">
                  Your cart is empty
                </p>
                <p className="text-sm text-gray-500">
                  Add some tela, tej or take-home products to get started.
                </p>
                <Link to="/shop" onClick={closeCart} className="btn-primary mt-2">
                  Browse the Shop
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                  {items.map(({ product, quantity }) => (
                    <div
                      key={product.id}
                      className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm"
                    >
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                        <FoodVisual
                          image={product.image}
                          name={product.name}
                          category={product.category}
                        />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-display text-base font-bold uppercase leading-tight text-gray-900">
                            {product.name}
                          </h3>
                          <button
                            onClick={() => removeItem(product.id)}
                            aria-label={`Remove ${product.name}`}
                            className="text-gray-400 transition-colors hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500">
                          {formatPrice(product.price)} · {formatQuantity(quantity, product.unit)}
                        </p>
                        <div className="mt-auto flex items-center justify-between pt-2">
                          <QuantityStepper
                            value={quantity}
                            min={product.minQuantity ?? 1}
                            step={product.step ?? 1}
                            size="sm"
                            onChange={(q) => updateQuantity(product.id, q)}
                          />
                          <span className="font-display text-base font-bold text-burgundy">
                            {formatPrice(product.price * quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <footer className="space-y-4 border-t border-burgundy/10 bg-white px-5 py-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Subtotal</span>
                    <span className="font-display text-xl font-bold text-gray-900">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Delivery fees are calculated at checkout.
                  </p>
                  <Link
                    to="/checkout"
                    onClick={closeCart}
                    className="btn-primary w-full justify-center"
                  >
                    Proceed to Checkout
                  </Link>
                </footer>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
