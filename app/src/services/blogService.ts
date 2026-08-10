import type { BlogPost } from '@/types'
import { blogPosts } from '@/data/blog'
import { USE_MOCK, mockResolve } from './apiClient'
import { getBlogPostsLive, getBlogPostBySlugLive } from './contentService'

export async function getBlogPosts(): Promise<BlogPost[]> {
  if (USE_MOCK) return mockResolve(blogPosts)
  return getBlogPostsLive()
}

export async function getBlogPostBySlug(
  slug: string,
): Promise<BlogPost | undefined> {
  if (USE_MOCK) return mockResolve(blogPosts.find((p) => p.slug === slug))
  return getBlogPostBySlugLive(slug)
}
