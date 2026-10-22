import { Link, useParams } from 'react-router'
import { ArrowLeft, CalendarDays, Clock, User } from 'lucide-react'
import { getBlogPostBySlug, getBlogPosts } from '@/services'
import { useAsync } from '@/hooks/useAsync'
import { useLanguage } from '@/hooks/useLanguage'
import BlogCard from '@/components/blog/BlogCard'
import ArticleBlocks from '@/components/blog/ArticleBlocks'
import { normalizeBlocks } from '@/types/blogBlocks'

function formatDate(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function BlogDetailPage() {
  const { slug } = useParams()
  const { locale } = useLanguage()
  const { data: post, loading } = useAsync(
    () => getBlogPostBySlug(slug ?? ''),
    [slug, locale],
  )
  const { data: allPosts } = useAsync(() => getBlogPosts(), [locale])

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-cream pt-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-burgundy/20 border-t-burgundy" />
      </div>
    )
  }

  if (!post) {
    return (
      <section className="flex min-h-[70vh] items-center justify-center bg-cream px-4 pt-20 text-center">
        <div>
          <h1 className="heading-display text-3xl uppercase text-gray-900">
            Article not found
          </h1>
          <Link to="/blog" className="btn-primary mt-6">
            Back to the blog
          </Link>
        </div>
      </section>
    )
  }

  const blocks = normalizeBlocks(post.blocks, post.content)
  const related = allPosts?.filter((p) => p.slug !== post.slug).slice(0, 3) ?? []
  const displayDate = formatDate(post.date)

  return (
    <article className="relative overflow-x-clip bg-cream pb-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-40 h-72 w-72 rounded-full bg-yellow-brand/10 blur-3xl" />
        <div className="absolute right-[-6rem] top-[38rem] h-80 w-80 rounded-full bg-burgundy/8 blur-3xl" />
        <div className="absolute bottom-[18rem] left-[12%] hidden h-px w-32 bg-burgundy/10 lg:block" />
        <div className="absolute bottom-[18rem] right-[12%] hidden h-px w-32 bg-burgundy/10 lg:block" />
      </div>

      <header className="relative overflow-hidden bg-burgundy pb-20 pt-28 sm:pb-24 sm:pt-32">
        {post.image ? (
          <>
            <img
              src={post.image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-burgundy/35 via-burgundy/70 to-burgundy" />
          </>
        ) : (
          <div className="pointer-events-none absolute inset-0 opacity-10">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border-2 border-white" />
            <div className="absolute bottom-10 left-10 h-40 w-40 rounded-full border border-white/70" />
          </div>
        )}

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-10">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/85 backdrop-blur-sm transition-colors hover:bg-white/15 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            All articles
          </Link>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {post.tags?.[0] ? (
              <span className="inline-flex rounded-full bg-yellow-brand px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-burgundy">
                {post.tags[0]}
              </span>
            ) : null}
            <span className="text-sm text-white/70">{post.readTime} read</span>
          </div>

          <h1 className="heading-display mt-5 max-w-4xl text-3xl uppercase leading-[1.02] text-white sm:text-5xl lg:text-6xl">
            {post.title}
          </h1>

          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 pt-6 text-sm text-white/75">
            <span className="flex items-center gap-2">
              <User className="h-4 w-4 text-yellow-brand" /> {post.author}
            </span>
            {displayDate ? (
              <span className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-yellow-brand" /> {displayDate}
              </span>
            ) : null}
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-brand" /> {post.readTime}
            </span>
          </div>
        </div>
      </header>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14 xl:grid-cols-[240px_minmax(0,1fr)_180px]">
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-6 pt-12">
              <div className="rounded-2xl border border-burgundy/10 bg-white/70 p-5 shadow-sm backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-burgundy/70">
                  Story
                </p>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  {post.excerpt || 'A story from Senay Restaurant & Catering.'}
                </p>
              </div>
              {post.tags && post.tags.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-burgundy/70">
                    Topics
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-burgundy/8 px-3 py-1 text-xs font-medium text-burgundy"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </aside>

          <div className="min-w-0">
            {post.excerpt ? (
              <div className="-mt-10 sm:-mt-12">
                <p className="rounded-[1.75rem] border border-burgundy/10 bg-white px-6 py-6 text-lg leading-relaxed text-gray-600 shadow-[0_24px_60px_-34px_rgba(74,14,24,0.35)] sm:px-8 sm:py-7 sm:text-[1.2rem]">
                  {post.excerpt}
                </p>
              </div>
            ) : null}

            <div className="mt-10 rounded-[2rem] border border-burgundy/8 bg-white/75 px-5 py-8 shadow-[0_24px_70px_-40px_rgba(74,14,24,0.28)] backdrop-blur-sm sm:px-8 sm:py-10 lg:px-10 lg:py-12">
              <ArticleBlocks blocks={blocks} />
            </div>

            <div className="mt-8 flex flex-wrap gap-2 lg:hidden">
              {post.tags?.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-burgundy/10 px-4 py-1.5 text-sm font-medium text-burgundy"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <aside className="hidden xl:block">
            <div className="sticky top-28 pt-12">
              <div className="space-y-4 border-l border-burgundy/10 pl-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-burgundy/70">
                  Details
                </p>
                <div className="space-y-3 text-sm text-gray-600">
                  <p>
                    <span className="block text-[0.7rem] uppercase tracking-[0.16em] text-gray-400">
                      Author
                    </span>
                    {post.author}
                  </p>
                  {displayDate ? (
                    <p>
                      <span className="block text-[0.7rem] uppercase tracking-[0.16em] text-gray-400">
                        Published
                      </span>
                      {displayDate}
                    </p>
                  ) : null}
                  <p>
                    <span className="block text-[0.7rem] uppercase tracking-[0.16em] text-gray-400">
                      Read time
                    </span>
                    {post.readTime}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {related.length > 0 ? (
        <div className="relative mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-10">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-burgundy/70">
                Continue reading
              </p>
              <h2 className="heading-display mt-2 text-2xl uppercase text-gray-900 sm:text-3xl">
                Keep reading
              </h2>
            </div>
            <Link
              to="/blog"
              className="hidden text-sm font-semibold text-burgundy hover:text-burgundy-light sm:inline-flex"
            >
              View all articles
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {related.map((p) => (
              <BlogCard key={p.id} post={p} />
            ))}
          </div>
        </div>
      ) : null}
    </article>
  )
}
