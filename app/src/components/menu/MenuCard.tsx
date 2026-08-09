import { Flame, Leaf } from 'lucide-react'
import type { MenuItem } from '@/types'
import { formatPrice } from '@/lib/format'
import FoodVisual from '@/components/common/FoodVisual'

/** Read-only menu item card used on the menu page and home preview. */
export default function MenuCard({ item }: { item: MenuItem }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg">
      <div className="relative h-48 overflow-hidden sm:h-52">
        <FoodVisual
          image={item.image}
          name={item.name}
          category={item.category}
          imgClassName="transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-4 top-4 flex gap-2">
          {item.vegetarian && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-brand px-2.5 py-1 text-xs font-semibold text-white">
              <Leaf className="h-3 w-3" /> Vegan
            </span>
          )}
          {item.spicy && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-brand px-2.5 py-1 text-xs font-semibold text-white">
              <Flame className="h-3 w-3" /> Spicy
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-bold uppercase leading-tight text-gray-900">
            {item.name}
          </h3>
          <span className="font-display text-lg font-bold text-burgundy">
            {formatPrice(item.price)}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">{item.description}</p>
      </div>
    </article>
  )
}
