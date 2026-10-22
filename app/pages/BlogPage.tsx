import { Link } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import { getBlogPosts } from '@/services'
import { useAsync } from '@/hooks/useAsync'
import PageHero from '@/components/common/PageHero'
import CardSkeleton from '@/components/common/CardSkeleton'
import ScrollReveal from '@/components/common/ScrollReveal'
import BlogCardImage from '@/components/blog/BlogCardImage'
import { usePageContent } from '@/hooks/usePageContent'
import { useLanguage } from '@/hooks/useLanguage'

export default function BlogPage() {
  const { locale } = useLanguage()
  const { data: posts, loading } = useAsync(() => getBlogPosts(), [locale])
  const page = usePageContent('blog')

  return (
    <>
      <PageHero
        eyebrow={page.eyebrow || 'Journal'}
        title={page.title || 'Stories, culture & flavour'}
        description={
          page.description ||
          'Tales from our kitchen, the craft behind our drinks, and the traditions that shape Ethiopian food.'
        }
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Blog' }]}
      />

      <section className="bg-cream py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <CardSkeleton count={2} />
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
              {posts?.map((post, i) => (
                <ScrollReveal key={post.id} delay={(i % 2) * 0.08}>
                  <article className="group h-full overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">
                    <Link
                      to={`/blog/${post.slug}`}
                      className="relative block h-52 overflow-hidden sm:h-60 md:h-72"
                    >
                      <BlogCardImage image={post.image} alt={post.title} />
                      {post.tags?.[0] && (
                        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-4 py-1.5 text-xs font-semibold text-gray-800 backdrop-blur-sm">
                          {post.tags[0]}
                        </span>
                      )}
                    </Link>
                    <div className="p-5 sm:p-6">
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Read time: {post.readTime}</span>
                        <span>{post.date}</span>
                      </div>
                      <h3 className="mt-3 font-display text-xl font-bold uppercase leading-tight text-gray-900 sm:text-2xl">
                        {post.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-500">
                        {post.excerpt}
                      </p>
                      <Link
                        to={`/blog/${post.slug}`}
                        className="mt-4 inline-flex items-center gap-2 rounded-full bg-burgundy px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-burgundy-light"
                      >
                        Read Article
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </article>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
