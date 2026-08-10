import type { BlogPost, RestaurantInfo } from '@/types'
import { normalizeBlocks } from '@/types/blogBlocks'
import { apiRequest, USE_MOCK, mockResolve, unwrapData } from './apiClient'
import { blogPosts } from '@/data/blog'
import { restaurant } from '@/data/restaurant'

export interface FaqItem {
  id: string
  question: string
  answer: string
  language: string
  sortOrder: number
}

export interface HomepageContent {
  heroEyebrow?: string
  heroHeadline?: string
  heroSubcopy?: string
  heroCarousel?: { src: string; alt: string }[]
  gallerySection?: { eyebrow?: string; title?: string; description?: string }
  testimonialsSection?: { eyebrow?: string; title?: string }
  offersSection?: {
    eyebrow?: string
    title?: string
    description?: string
    cards?: Array<{
      id: string
      label?: string
      title: string
      subtitle?: string
      image?: string
      link: string
      linkText: string
      discount?: string
      variant?: 'yellow' | 'green' | 'burgundy'
      tall?: boolean
    }>
  }
  videoSection?: { url?: string; title?: string; subtitle?: string }
}

export interface GalleryItem {
  id: string
  url: string
  name: string | null
  category: string
  caption: string | null
  tall: boolean
}

export interface TestimonialItem {
  id: string
  name: string
  quote: string
  role: string | null
  dish: string | null
  dishCategory: string | null
  imageUrl: string | null
  rating?: number | null
}

export async function getFaqs(): Promise<FaqItem[]> {
  if (USE_MOCK) {
    return mockResolve(
      [
        {
          id: '1',
          question: 'Do you deliver across Addis Ababa?',
          answer:
            'Yes. We deliver tela, tej and take-home products across Addis Ababa.',
          language: 'EN',
          sortOrder: 1,
        },
      ],
      200,
    )
  }
  try {
    const res = await apiRequest<{ data: FaqItem[] }>('/faqs')
    return unwrapData(res)
  } catch {
    return []
  }
}

export async function getRestaurantInfo(): Promise<RestaurantInfo> {
  if (USE_MOCK) return mockResolve(restaurant)
  try {
    const res = await apiRequest<{ data: RestaurantInfo }>('/settings/restaurant')
    return unwrapData(res)
  } catch {
    return restaurant
  }
}

export async function getGalleryImages(): Promise<GalleryItem[]> {
  if (USE_MOCK) return mockResolve([])
  try {
    const res = await apiRequest<{ data: GalleryItem[] }>('/gallery')
    return unwrapData(res)
  } catch {
    return []
  }
}

export async function getTestimonials(): Promise<TestimonialItem[]> {
  if (USE_MOCK) return mockResolve([])
  try {
    const res = await apiRequest<{ data: TestimonialItem[] }>('/testimonials')
    return unwrapData(res)
  } catch {
    return []
  }
}

export type SubmitTestimonialInput = {
  name: string
  quote: string
  role?: string
  dish?: string
  dishCategory?: 'food' | 'drinks' | 'products'
  rating?: number
}

/** Guest share — stored unpublished until admin approval. */
export async function submitTestimonial(
  input: SubmitTestimonialInput,
): Promise<{ id: string; pending: boolean }> {
  if (USE_MOCK) return mockResolve({ id: 'mock', pending: true })
  const res = await apiRequest<{ data: { id: string; pending: boolean } }>(
    '/testimonials',
    { method: 'POST', json: input },
  )
  return unwrapData(res)
}

export async function getHomepageContent(): Promise<HomepageContent> {
  if (USE_MOCK) {
    return mockResolve({
      heroEyebrow: 'Authentic • Traditional • Brewed by Chemist',
      heroHeadline: 'Taste the Soul of Ethiopia',
      heroSubcopy:
        'Clay-brewed tela, house tej, and traditional dishes made with care.',
    })
  }
  try {
    const res = await apiRequest<{ data: HomepageContent }>('/settings/homepage')
    return unwrapData(res)
  } catch {
    return {}
  }
}

export interface PageHeroContent {
  eyebrow?: string
  title?: string
  description?: string
  sectionLabel?: string
  sectionTitle?: string
  paragraphs?: string[]
  values?: { title: string; text: string }[]
  milestones?: { year: string; text: string }[]
  formTitle?: string
  minGuests?: number
  heroEyebrow?: string
  heroHeadline?: string
  heroSubcopy?: string
}

export async function getPageContent(
  page: string,
): Promise<PageHeroContent> {
  if (USE_MOCK) return mockResolve({})
  try {
    const key = page === 'home' ? 'homepage' : `page:${page}`
    const res = await apiRequest<{ data: PageHeroContent }>(`/settings/${key}`)
    return unwrapData(res)
  } catch {
    return {}
  }
}

export async function getFeaturedMenuItems(): Promise<
  Array<{
    id: string
    name: string
    description: string
    price: number | null
    image: string | null
    category?: { slug: string; name: string }
  }>
> {
  if (USE_MOCK) return mockResolve([])
  try {
    const res = await apiRequest<{ data: Array<{
      id: string
      name: string
      description: string
      price: string | number | null
      image: string | null
      category?: { slug: string; name: string }
    }> }>('/menu-items?featured=true')
    return unwrapData(res).map((item) => ({
      ...item,
      price: item.price == null ? null : Number(item.price),
    }))
  } catch {
    return []
  }
}

export async function getBlogPostsLive(): Promise<BlogPost[]> {
  if (USE_MOCK) return mockResolve(blogPosts)
  try {
    const res = await apiRequest<{ data: BlogPost[] }>('/blog')
    const posts = unwrapData(res)
    return posts.map((p) => mapBlogPost(p))
  } catch {
    return blogPosts
  }
}

function mapBlogPost(p: BlogPost & { publishedAt?: string }): BlogPost {
  const date =
    typeof p.publishedAt === 'string'
      ? new Date(p.publishedAt).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : p.date

  return {
    ...p,
    date,
    blocks: normalizeBlocks(p.blocks, p.content),
  }
}

export async function getBlogPostBySlugLive(
  slug: string,
): Promise<BlogPost | undefined> {
  if (USE_MOCK) return mockResolve(blogPosts.find((p) => p.slug === slug))
  try {
    const res = await apiRequest<{ data: BlogPost }>(`/blog/${slug}`)
    return mapBlogPost(unwrapData(res))
  } catch {
    return blogPosts.find((p) => p.slug === slug)
  }
}
