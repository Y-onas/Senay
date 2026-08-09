import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { Product } from '@/types'
import { useCart } from '@/hooks/useCart'
import { formatPrice, unitLabel, unitSuffix } from '@/lib/format'
import FoodVisual from '@/components/common/FoodVisual'
import QuantityStepper from '@/components/common/QuantityStepper'

/** Shop product card with inline quantity selector and add-to-cart. */
export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart()
  const min = product.minQuantity ?? 1
  const [quantity, setQuantity] = useState(min)

  return (
    <div className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg">
      <div className="relative h-52 overflow-hidden">
        <FoodVisual
          image={product.image}
          name={product.name}
          category={product.category}
          imgClassName="transition-transform duration-500 group-hover:scale-105"
        />
        {product.tags?.[0] && (
          <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-burgundy backdrop-blur-sm">
            {product.tags[0]}
          </span>
        )}
        {product.inStock === false && (
          <span className="absolute right-4 top-4 rounded-full bg-gray-900/80 px-3 py-1 text-xs font-semibold text-white">
            Out of stock
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-bold uppercase leading-tight text-gray-900">
            {product.name}
          </h3>
          <div className="text-right">
            <span className="font-display text-lg font-bold text-burgundy">
              {formatPrice(product.price)}
            </span>
            <span className="block text-xs text-gray-400">{unitLabel(product.unit)}</span>
          </div>
        </div>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-500">
          {product.description}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <QuantityStepper
            value={quantity}
            min={min}
            step={product.step ?? 1}
            size="sm"
            suffix={unitSuffix(product.unit)}
            onChange={setQuantity}
          />
          <button
            onClick={() => addItem(product, quantity)}
            disabled={product.inStock === false}
            className="inline-flex items-center gap-1.5 rounded-full bg-burgundy px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-burgundy-light disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
