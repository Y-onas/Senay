import { lazy, Suspense } from 'react'
import HomeHero from '@/sections/home/HomeHero'
import HomeSectionGate from '@/components/home/HomeSectionGate'
import { HomeSectionsProvider } from '@/context/HomeSectionsProvider'

const HomeCategories = lazy(() => import('@/sections/home/HomeCategories'))
const HomeSpecialOffers = lazy(() => import('@/sections/home/HomeSpecialOffers'))
const HomeFeaturedMenu = lazy(() => import('@/sections/home/HomeFeaturedMenu'))
const HomeStory = lazy(() => import('@/sections/home/HomeStory'))
const HomeVideo = lazy(() => import('@/sections/home/HomeVideo'))
const HomeWhyChooseUs = lazy(() => import('@/sections/home/HomeWhyChooseUs'))
const HomeCatering = lazy(() => import('@/sections/home/HomeCatering'))
const HomeTestimonials = lazy(() => import('@/sections/home/HomeTestimonials'))
const HomeFAQ = lazy(() => import('@/sections/home/HomeFAQ'))
const HomeGallery = lazy(() => import('@/sections/home/HomeGallery'))
const HomeBlog = lazy(() => import('@/sections/home/HomeBlog'))
const HomeCTA = lazy(() => import('@/sections/home/HomeCTA'))

function LazySection({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>
}

export default function Home() {
  return (
    <HomeSectionsProvider>
      <>
        <HomeSectionGate sectionKey="hero">
          <HomeHero />
        </HomeSectionGate>
        <HomeSectionGate sectionKey="categories">
          <LazySection>
            <HomeCategories />
          </LazySection>
        </HomeSectionGate>
        <HomeSectionGate sectionKey="offers">
          <LazySection>
            <HomeSpecialOffers />
          </LazySection>
        </HomeSectionGate>
        <HomeSectionGate sectionKey="featuredMenu">
          <LazySection>
            <HomeFeaturedMenu />
          </LazySection>
        </HomeSectionGate>
        <HomeSectionGate sectionKey="story">
          <LazySection>
            <HomeStory />
          </LazySection>
        </HomeSectionGate>
        <HomeSectionGate sectionKey="video">
          <LazySection>
            <HomeVideo />
          </LazySection>
        </HomeSectionGate>
        <HomeSectionGate sectionKey="whyChooseUs">
          <LazySection>
            <HomeWhyChooseUs />
          </LazySection>
        </HomeSectionGate>
        <HomeSectionGate sectionKey="catering">
          <LazySection>
            <HomeCatering />
          </LazySection>
        </HomeSectionGate>
        <HomeSectionGate sectionKey="testimonials">
          <LazySection>
            <HomeTestimonials />
          </LazySection>
        </HomeSectionGate>
        <HomeSectionGate sectionKey="faq">
          <LazySection>
            <HomeFAQ />
          </LazySection>
        </HomeSectionGate>
        <HomeSectionGate sectionKey="gallery">
          <LazySection>
            <HomeGallery />
          </LazySection>
        </HomeSectionGate>
        <HomeSectionGate sectionKey="blog">
          <LazySection>
            <HomeBlog />
          </LazySection>
        </HomeSectionGate>
        <HomeSectionGate sectionKey="cta">
          <LazySection>
            <HomeCTA />
          </LazySection>
        </HomeSectionGate>
      </>
    </HomeSectionsProvider>
  )
}
