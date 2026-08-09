import { useCallback, useEffect, useState, type SyntheticEvent } from 'react'
import FoodVisual from '@/components/common/FoodVisual'
import { detectOrientation, type ImageOrientation } from '@/lib/imageOrientation'
import { cn } from '@/lib/utils'

export default function BlogCardImage({
  image,
  alt,
  className,
  fallbackCategory = 'food',
}: {
  image?: string
  alt: string
  className?: string
  fallbackCategory?: 'food' | 'drinks' | 'products'
}) {
  const [orientation, setOrientation] = useState<ImageOrientation>('landscape')
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setLoaded(false)
    setFailed(false)
  }, [image])

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

  if (!image || failed) {    return (
      <div className={cn('h-full w-full', className)}>
        <FoodVisual name={alt} category={fallbackCategory} />
      </div>
    )
  }

  const isPortrait = orientation === 'portrait'

  return (
    <div
      className={cn(
        'relative h-full w-full overflow-hidden bg-[#f7f2ea]',
        className,
      )}
    >
      {!loaded ? <div className="absolute inset-0 animate-pulse bg-burgundy/5" /> : null}
      <img
        src={image}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(          'h-full w-full transition-transform duration-500 group-hover:scale-[1.03]',
          loaded ? 'opacity-100' : 'opacity-0',
          isPortrait ? 'object-contain object-center' : 'object-cover object-center',
        )}
      />
    </div>
  )
}
