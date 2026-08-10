import { Link } from 'react-router'
import PageHero from '@/components/common/PageHero'
import { offeringPages, type OfferingSlug } from '@/config/navigation'

interface OfferingPageProps {
  slug: OfferingSlug
}

export default function OfferingPage({ slug }: OfferingPageProps) {
  const page = offeringPages[slug]

  return (
    <>
      <PageHero
        eyebrow={page.eyebrow}
        title={page.title}
        description={page.description}
        crumbs={[{ label: 'Home', to: '/' }, { label: page.eyebrow }]}
      />

      <section className="bg-cream py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-base leading-relaxed text-gray-600 sm:text-lg">{page.body}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/contact" className="btn-primary">
              Get in Touch
            </Link>
            {slug === 'traditional-drinks' && (
              <Link to="/checkout" className="btn-primary-light">
                Order Now
              </Link>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
