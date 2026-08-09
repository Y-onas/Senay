import { Link } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import type { BlogPost } from '@/types'
import BlogCardImage from '@/components/blog/BlogCardImage'

export default function BlogCard({ post }: { post: BlogPost }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg">
      <Link to={`/blog/${post.slug}`} className="relative block h-52 overflow-hidden sm:h-60">
        <BlogCardImage image={post.image} alt={post.title} />
        {post.tags?.[0] ? (
          <span className="absolute left-4 top-4 rounded-full bg-white/90 px-4 py-1.5 text-xs font-semibold text-gray-800 backdrop-blur-sm">
            {post.tags[0]}
          </span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{post.date}</span>
          <span>{post.readTime} read</span>
        </div>
        <h3 className="mt-3 font-display text-xl font-bold uppercase leading-tight text-gray-900">
          <Link to={`/blog/${post.slug}`} className="transition-colors hover:text-burgundy">
            {post.title}
          </Link>
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-500 line-clamp-3">
          {post.excerpt}
        </p>
        <Link
          to={`/blog/${post.slug}`}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-burgundy transition-colors hover:text-burgundy-light"
        >
          Read article
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  )
}
