import { ChevronRight } from 'lucide-react'
import ScrollReveal from '@/components/common/ScrollReveal'
import FoodVisual from '@/components/common/FoodVisual'
import type { Branch } from '@/data/branches'

const visualCategories = ['food', 'drinks', 'products'] as const

type BranchLocationsProps = {
  title?: string
  description?: string
  buttonText?: string
  branches?: Branch[]
}

function BranchCard({ branch, index }: { branch: Branch; index: number }) {
  const category = visualCategories[index % visualCategories.length]

  return (
    <ScrollReveal delay={index * 0.06}>
      <a
        href={branch.mapUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative block aspect-[4/3] overflow-hidden rounded-3xl shadow-md transition-transform duration-300 hover:scale-[1.01] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy"
      >
        <FoodVisual
          image={branch.image}
          name={branch.name}
          category={category}
          className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg font-bold uppercase leading-tight text-white sm:text-xl">
              {branch.name}
            </h3>
            <ChevronRight className="h-5 w-5 shrink-0 text-white/90 transition-transform duration-300 group-hover:translate-x-0.5" />
          </div>
          <p className="mt-1 text-sm text-white/80">{branch.area}</p>
        </div>
      </a>
    </ScrollReveal>
  )
}

export default function BranchLocations({
  title = 'Locations',
  description = '',
  buttonText = 'Explore all locations',
  branches = [],
}: BranchLocationsProps) {
  if (!branches.length) return null

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
          <ScrollReveal className="flex flex-col justify-center sm:col-span-2 lg:col-span-1 lg:row-span-2 lg:pr-4">
            <h2 className="heading-display text-4xl uppercase text-gray-900 sm:text-5xl">
              {title}
            </h2>
            {description ? (
              <p className="mt-4 max-w-sm text-base leading-relaxed text-gray-500">
                {description}
              </p>
            ) : null}
            <a
              href="#locations"
              className="mt-8 inline-flex w-fit items-center rounded-full border-2 border-burgundy px-6 py-2.5 text-sm font-semibold text-burgundy transition-colors hover:bg-burgundy hover:text-white"
            >
              {buttonText}
            </a>
          </ScrollReveal>

          {branches.map((branch, index) => (
            <div
              key={branch.id}
              id={index === 0 ? 'locations' : undefined}
              className={
                index === 2
                  ? 'sm:col-span-2 lg:col-span-1 lg:col-start-2 lg:row-start-2'
                  : undefined
              }
            >
              <BranchCard branch={branch} index={index} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
