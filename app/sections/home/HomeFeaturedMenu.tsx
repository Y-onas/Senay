import { motion } from 'framer-motion'

import { Link } from 'react-router'

import { ArrowUpRight } from 'lucide-react'

import type { CategorySlug } from '@/types'

import { formatPrice } from '@/lib/format'

import FoodVisual from '@/components/common/FoodVisual'

import { useHomeSection } from '@/hooks/useHomeSection'



type FeaturedItem = {

  id: string

  name: string

  description: string

  price: number

  image?: string

  category?: CategorySlug

}



type FeaturedMenuContent = {

  eyebrow?: string

  title?: string

  description?: string

  buttonText?: string

  buttonLink?: string

  items?: FeaturedItem[]

}



function revealOnMount(delay = 0) {

  return {

    initial: { opacity: 0, y: 30 },

    animate: { opacity: 1, y: 0 },

    transition: { duration: 0.6, delay },

  } as const

}



export default function HomeFeaturedMenu() {

  const { content, loading } = useHomeSection<FeaturedMenuContent>('featuredMenu')



  const featured =

    content?.items

      ?.filter((item) => String(item.name ?? '').trim())

      .slice(0, 5) ?? []



  const hasSectionText = Boolean(

    String(content?.eyebrow ?? '').trim() ||

      String(content?.title ?? '').trim() ||

      String(content?.description ?? '').trim(),

  )



  if (!loading && !hasSectionText && !featured.length) return null



  return (

    <section id="menu" className="bg-burgundy py-16 sm:py-20 lg:py-24">

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <motion.div

          className="mb-10 flex flex-col sm:mb-14 lg:flex-row lg:items-end lg:justify-between"

          {...revealOnMount()}

        >

          <div>

            {content?.eyebrow ? (

              <div className="section-label section-label-light text-white/90">

                <span className="text-xs sm:text-sm">{content.eyebrow}</span>

              </div>

            ) : null}

            {content?.title ? (

              <h2 className="heading-display text-3xl uppercase text-white sm:text-4xl lg:text-5xl">

                {content.title}

              </h2>

            ) : null}

            {content?.description ? (

              <p className="mt-4 max-w-xl text-sm text-white/70 sm:text-base">

                {content.description}

              </p>

            ) : null}

          </div>

          {content?.buttonText && content?.buttonLink ? (

            <Link to={content.buttonLink} className="btn-primary-light mt-6 self-start lg:mt-0">

              {content.buttonText}

              <ArrowUpRight className="h-4 w-4" />

            </Link>

          ) : null}

        </motion.div>



        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">

          {featured.map((item, i) => (

            <motion.div

              key={item.id || `featured-${i}`}

              className="group overflow-hidden rounded-2xl bg-burgundy-card"

              {...revealOnMount(0.1 * i)}

              whileHover={{ y: -4 }}

            >

              <div className="relative h-48 overflow-hidden sm:h-56">

                <FoodVisual

                  name={item.name}

                  category={item.category ?? 'food'}

                  image={item.image}

                  imgClassName="transition-transform duration-500 group-hover:scale-110"

                />

                <div className="absolute inset-0 bg-gradient-to-t from-burgundy-card/80 to-transparent" />

              </div>

              <div className="p-5">

                <h3 className="font-display text-xl font-bold uppercase text-white">{item.name}</h3>

                {item.description ? (

                  <p className="mt-2 line-clamp-2 text-sm text-white/70">{item.description}</p>

                ) : null}

                <p className="mt-3 font-display text-lg font-bold text-yellow-brand">

                  {formatPrice(Number(item.price) || 0)}

                </p>

              </div>

            </motion.div>

          ))}

        </div>

      </div>

    </section>

  )

}


