import { Link } from 'react-router'
import { ArrowUpRight, Coffee, Flame, HandHeart, Leaf } from 'lucide-react'
import PageHero from '@/components/common/PageHero'
import ScrollReveal from '@/components/common/ScrollReveal'
import FoodVisual from '@/components/common/FoodVisual'
import { usePageContent } from '@/hooks/usePageContent'
import { useLanguage } from '@/hooks/useLanguage'

const ICONS = [Flame, Coffee, Leaf, HandHeart]

export default function AboutPage() {
  const { t, navLabel } = useLanguage()
  const page = usePageContent('about')
  const values = page.values?.filter((entry) => entry.title?.trim() || entry.text?.trim()) ?? []
  const milestones =
    page.milestones?.filter((entry) => entry.year?.trim() || entry.text?.trim()) ?? []
  const paragraphs = page.paragraphs?.filter((entry) => entry.trim()) ?? []

  const hasHero = Boolean(
    page.eyebrow?.trim() || page.title?.trim() || page.description?.trim(),
  )

  if (!hasHero && !paragraphs.length && !values.length && !milestones.length) {
    return null
  }

  return (
    <>
      {hasHero ? (
        <PageHero
          eyebrow={page.eyebrow}
          title={page.title ?? ''}
          description={page.description}
          crumbs={[
            { label: navLabel('/', 'Home'), to: '/' },
            { label: navLabel('/about', 'About') },
          ]}
        />
      ) : null}

      {paragraphs.length || page.sectionLabel || page.sectionTitle ? (
        <section className="bg-cream py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <ScrollReveal>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-72 overflow-hidden rounded-3xl shadow-md">
                  <FoodVisual name="Doro Wat" category="food" />
                </div>
                <div className="mt-10 h-72 overflow-hidden rounded-3xl shadow-md">
                  <FoodVisual name="House Tela" category="drinks" />
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              {page.sectionLabel ? (
                <div className="section-label text-burgundy">
                  <span className="text-xs sm:text-sm">{page.sectionLabel}</span>
                </div>
              ) : null}
              {page.sectionTitle ? (
                <h2 className="heading-display text-3xl uppercase text-gray-900 sm:text-4xl">
                  {page.sectionTitle}
                </h2>
              ) : null}
              {paragraphs.length ? (
                <div className="mt-4 space-y-4 text-gray-500">
                  {paragraphs.map((paragraph, index) => (
                    <p key={`about-paragraph-${index}`}>{paragraph}</p>
                  ))}
                </div>
              ) : null}
              <Link to="/menu" className="btn-primary mt-8">
                {t('exploreMenu')}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </ScrollReveal>
          </div>
        </section>
      ) : null}

      {values.length ? (
        <section className="bg-cream-warm py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {values.map((value, index) => {
                const Icon = ICONS[index % ICONS.length]
                return (
                  <ScrollReveal key={`about-value-${index}`} delay={index * 0.08}>
                    <div className="h-full rounded-3xl bg-white p-6 shadow-sm">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-burgundy/10 text-burgundy">
                        <Icon className="h-6 w-6" />
                      </span>
                      {value.title ? (
                        <h3 className="mt-4 font-display text-lg font-bold uppercase text-gray-900">
                          {value.title}
                        </h3>
                      ) : null}
                      {value.text ? (
                        <p className="mt-2 text-sm text-gray-500">{value.text}</p>
                      ) : null}
                    </div>
                  </ScrollReveal>
                )
              })}
            </div>
          </div>
        </section>
      ) : null}

      {milestones.length ? (
        <section className="bg-burgundy py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="section-label section-label-light text-white/90">
              <span className="text-xs sm:text-sm">{t('ourJourney')}</span>
            </div>
            <h2 className="heading-display text-3xl uppercase text-white sm:text-4xl">
              {t('fromOnePot')}
            </h2>
            <ol className="mt-10 space-y-8">
              {milestones.map((milestone, index) => (
                <ScrollReveal key={`about-milestone-${index}`} delay={index * 0.08}>
                  <li className="flex gap-5">
                    {milestone.year ? (
                      <span className="font-display text-2xl font-bold text-yellow-brand">
                        {milestone.year}
                      </span>
                    ) : null}
                    {milestone.text ? (
                      <p className="border-l border-white/20 pl-5 text-white/80">{milestone.text}</p>
                    ) : null}
                  </li>
                </ScrollReveal>
              ))}
            </ol>
          </div>
        </section>
      ) : null}
    </>
  )
}
