import { motion, useInView } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import { blogPosts } from '@/data/blog'
import type { BlogPost } from '@/types'
import BlogCardImage from '@/components/blog/BlogCardImage'
import { getBlogPostsLive } from '@/services/contentService'
import { useHomeSection } from '@/hooks/useHomeSection'
import { useLanguage } from '@/hooks/useLanguage'

export default function HomeBlog() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const { locale } = useLanguage()
  const { content } = useHomeSection<{
    eyebrow?: string
    title?: string
    description?: string
    buttonText?: string
    buttonLink?: string
    featuredCount?: number
  }>('blog')
  const [preview, setPreview] = useState<BlogPost[]>(blogPosts.slice(0, 2))

  useEffect(() => {
    getBlogPostsLive().then((posts) => {
      const count = content?.featuredCount ?? 2
      if (posts.length) setPreview(posts.slice(0, count))
    })
  }, [content?.featuredCount, locale])

  return (
    <section id="blog" className="bg-cream py-16 sm:py-20 lg:py-24" ref={ref}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mb-10 flex flex-col sm:mb-14 lg:flex-row lg:items-end lg:justify-between"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div>
            <div className="section-label text-burgundy">
              <span className="text-xs sm:text-sm">{content?.eyebrow ?? 'Blog'}</span>
            </div>
            <h2 className="heading-display text-3xl uppercase text-gray-900 sm:text-4xl lg:text-5xl">
              {content?.title ?? (
                <>
                  Stories, Culture
                  <br />
                  &amp; Food Traditions
                </>
              )}
            </h2>
          </div>
          <div className="mt-4 lg:mt-0 lg:text-right">
            <p className="max-w-md text-sm text-gray-500 sm:text-base lg:ml-auto">
              {content?.description ??
                'Tales from our kitchen, the craft behind our drinks, and the traditions that shape Ethiopian food.'}
            </p>
            <Link to={content?.buttonLink ?? '/blog'} className="btn-primary mt-4">
              {content?.buttonText ?? 'Explore Blog'}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
          {preview.map((post, i) => (
            <motion.article
              key={post.id}
              className="group overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow duration-300 hover:shadow-md"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * i }}
            >
              <Link to={`/blog/${post.slug}`} className="block">
                <div className="group h-52 overflow-hidden sm:h-60">
                  <BlogCardImage image={post.image} alt={post.title} />
                </div>
                <div className="p-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-yellow-dark">
                    {post.date}
                  </p>
                  <h3 className="mt-2 font-display text-xl font-bold uppercase text-burgundy">
                    {post.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm text-gray-500">{post.excerpt}</p>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
