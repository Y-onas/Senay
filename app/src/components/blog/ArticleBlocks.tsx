import { useCallback, useEffect, useState, type SyntheticEvent } from 'react'
import { Link } from 'react-router'
import { ArrowUpRight, ImageOff, Quote } from 'lucide-react'import type { BlogBlock } from '@/types/blogBlocks'
import { displayLocalized } from '@/types/blogBlocks'
import { detectOrientation, type ImageOrientation } from '@/lib/imageOrientation'
import { useLanguage } from '@/hooks/useLanguage'

function ArticleImage({
  url,
  caption,
  layout = 'default',
  framed = true,
}: {
  url: string
  caption?: string
  layout?: 'default' | 'wide' | 'full'
  framed?: boolean
}) {
  const [orientation, setOrientation] = useState<ImageOrientation>('landscape')
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setLoaded(false)
    setFailed(false)
  }, [url])

  const handleLoad = useCallback((event: SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget
    setOrientation(detectOrientation(img.naturalWidth, img.naturalHeight))
    setLoaded(true)
    setFailed(false)
  }, [])

  const handleError = useCallback(() => {
    setFailed(true)
    setLoaded(false)
  }, [])
  const isPortrait = orientation === 'portrait'
  const isSquare = orientation === 'square'

  const frameClass = framed
    ? 'overflow-hidden rounded-[1.75rem] border border-burgundy/10 bg-white shadow-[0_18px_50px_-28px_rgba(74,14,24,0.45)]'
    : 'overflow-hidden rounded-[1.75rem]'

  const wrapperClass =
    layout === 'full'
      ? 'mx-auto w-full max-w-5xl'
      : layout === 'wide'
        ? 'mx-auto w-full max-w-4xl'
        : isPortrait
          ? 'mx-auto w-full max-w-md sm:max-w-lg'
          : 'mx-auto w-full max-w-3xl'

  const imageClass = [
    'block w-full transition-opacity duration-500',
    loaded ? 'opacity-100' : 'opacity-0',
    isPortrait
      ? 'max-h-[min(72vh,680px)] object-contain object-center mx-auto bg-[#f7f2ea]'
      : isSquare
        ? 'aspect-square max-h-[min(62vh,560px)] object-cover object-center'
        : layout === 'full' || layout === 'wide'
          ? 'max-h-[min(58vh,520px)] object-cover object-center'
          : 'max-h-[min(52vh,460px)] object-cover object-center',
  ].join(' ')

  const placeholderClass = isPortrait
    ? 'min-h-[320px] sm:min-h-[420px]'
    : 'aspect-[16/10] min-h-[220px]'

  return (
    <figure className={wrapperClass}>
      <div className={`relative ${frameClass}`}>
        {failed ? (
          <div
            className={`flex flex-col items-center justify-center gap-2 bg-burgundy/5 px-6 text-center text-gray-500 ${placeholderClass}`}
            role="img"
            aria-label={caption ? `Failed to load image: ${caption}` : 'Image unavailable'}
          >
            <ImageOff className="h-8 w-8 text-burgundy/40" aria-hidden />
            <span className="text-sm">Image could not be loaded</span>
          </div>
        ) : (
          <>
            {!loaded ? (
              <div className={`animate-pulse bg-burgundy/5 ${placeholderClass}`} />
            ) : null}
            <img
              src={url}
              alt={caption || ''}
              className={`${imageClass}${loaded ? '' : ' absolute inset-0 h-full w-full'}`}
              loading="lazy"
              decoding="async"
              onLoad={handleLoad}
              onError={handleError}
            />
          </>
        )}
      </div>      {caption ? (
        <figcaption className="mt-4 px-1 text-center text-sm leading-relaxed text-gray-500 sm:text-[0.95rem]">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  )
}

function GalleryImage({ url, caption }: { url: string; caption?: string }) {
  const [orientation, setOrientation] = useState<ImageOrientation>('landscape')

  return (
    <figure className="min-w-0">
      <div className="overflow-hidden rounded-2xl border border-burgundy/10 bg-white shadow-sm">
        <img
          src={url}
          alt={caption || ''}
          loading="lazy"
          decoding="async"
          onLoad={(event) => {
            const img = event.currentTarget
            setOrientation(detectOrientation(img.naturalWidth, img.naturalHeight))
          }}
          className={
            orientation === 'portrait'
              ? 'mx-auto max-h-80 w-full object-contain bg-[#f7f2ea]'
              : 'aspect-[4/3] w-full object-cover object-center'
          }
        />
      </div>
      {caption ? <figcaption className="mt-2 text-xs text-gray-500">{caption}</figcaption> : null}
    </figure>
  )
}

function BlockRenderer({
  block,
  index,
  locale,
}: {
  block: BlogBlock
  index: number
  locale: 'en' | 'am'
}) {
  switch (block.type) {
    case 'paragraph':
      return (
        <p
          className={`text-[1.05rem] leading-[1.9] text-gray-700 sm:text-[1.125rem] sm:leading-[1.95] ${
            index === 0 ? 'first-letter:float-left first-letter:mr-3 first-letter:font-display first-letter:text-6xl first-letter:font-bold first-letter:leading-[0.85] first-letter:text-burgundy' : ''
          }`}
        >
          {displayLocalized(block.text, locale)}
        </p>
      )
    case 'heading':
      return (
        <div className="space-y-3 pt-2">
          <div className="h-px w-16 bg-yellow-brand" />
          {block.level === 3 ? (
            <h3 className="font-display text-2xl font-bold uppercase tracking-[0.04em] text-gray-900 sm:text-[2rem]">
              {displayLocalized(block.text, locale)}
            </h3>
          ) : (
            <h2 className="font-display text-3xl font-bold uppercase tracking-[0.04em] text-gray-900 sm:text-4xl lg:text-[2.65rem]">
              {displayLocalized(block.text, locale)}
            </h2>
          )}
        </div>
      )
    case 'quote':
      return (
        <blockquote className="relative overflow-hidden rounded-[1.75rem] bg-burgundy px-6 py-7 text-white sm:px-8 sm:py-8">
          <Quote className="absolute right-6 top-6 h-10 w-10 text-yellow-brand/35" />
          <p className="relative max-w-3xl text-xl font-medium italic leading-relaxed sm:text-2xl">
            “{displayLocalized(block.text, locale)}”
          </p>
          {displayLocalized(block.attribution, locale) ? (
            <cite className="relative mt-4 block text-sm font-semibold not-italic text-yellow-brand">
              — {displayLocalized(block.attribution, locale)}
            </cite>
          ) : null}
        </blockquote>
      )
    case 'list':
      if (block.style === 'numbered') {
        return (
          <ol className="space-y-3 rounded-2xl border border-burgundy/10 bg-white/80 px-5 py-5 sm:px-6">
            {block.items.map((item, idx) => (
              <li key={idx} className="flex gap-3 text-base leading-relaxed text-gray-700 sm:text-lg">
                <span className="font-display text-sm font-bold text-burgundy">{idx + 1}.</span>
                <span>{displayLocalized(item, locale)}</span>
              </li>
            ))}
          </ol>
        )
      }
      return (
        <ul className="space-y-3 rounded-2xl border border-burgundy/10 bg-white/80 px-5 py-5 sm:px-6">
          {block.items.map((item, idx) => (
            <li key={idx} className="flex gap-3 text-base leading-relaxed text-gray-700 sm:text-lg">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-brand" />
              <span>{displayLocalized(item, locale)}</span>
            </li>
          ))}
        </ul>
      )
    case 'image':
      return (
        <ArticleImage
          url={block.url}
          caption={displayLocalized(block.caption, locale) || undefined}
          layout={block.layout}
        />
      )
    case 'gallery':
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
          {block.images.map((image, idx) => (
            <GalleryImage
              key={idx}
              url={image.url}
              caption={displayLocalized(image.caption, locale) || undefined}
            />
          ))}
        </div>
      )
    case 'columns':
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
          {block.images.map((image, idx) => (
            <GalleryImage
              key={idx}
              url={image.url}
              caption={displayLocalized(image.caption, locale) || undefined}
            />
          ))}
        </div>
      )
    case 'cta':
      return (
        <div className="relative overflow-hidden rounded-[1.75rem] bg-burgundy px-6 py-8 text-center text-white sm:px-10 sm:py-10">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full border border-white/10" />
          <p className="relative text-lg leading-relaxed text-white/90 sm:text-xl">
            {displayLocalized(block.text, locale)}
          </p>
          <Link
            to={block.buttonLink}
            className="relative mt-5 inline-flex items-center gap-2 rounded-full bg-yellow-brand px-6 py-3 text-sm font-semibold text-burgundy transition-colors hover:bg-yellow-brand/90"
          >
            {displayLocalized(block.buttonText, locale)}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      )
    case 'divider':
      return (
        <div className="flex items-center gap-4 py-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-burgundy/15 to-transparent" />
          <div className="h-2 w-2 rounded-full bg-yellow-brand/80" />
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-burgundy/15 to-transparent" />
        </div>
      )
    default:
      return null
  }
}

export default function ArticleBlocks({ blocks }: { blocks: BlogBlock[] }) {
  const { locale } = useLanguage()
  return (
    <div className="space-y-9 sm:space-y-11">
      {blocks.map((block, index) => {
        const isVisual =
          block.type === 'image' ||
          block.type === 'gallery' ||
          block.type === 'columns' ||
          block.type === 'quote' ||
          block.type === 'cta'

        return (
          <div
            key={block.id}
            className={isVisual ? 'py-1' : block.type === 'heading' ? 'pt-3' : undefined}
          >
            <BlockRenderer block={block} index={index} locale={locale} />
          </div>
        )
      })}
    </div>
  )
}
