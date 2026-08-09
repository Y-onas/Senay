import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import ScrollReveal from './ScrollReveal'

interface SectionHeadingProps {
  label: string
  title: ReactNode
  description?: ReactNode
  /** Use light styling on dark/burgundy backgrounds. */
  light?: boolean
  align?: 'left' | 'center'
  className?: string
  /** Optional action node rendered to the right on desktop. */
  action?: ReactNode
}

/** Consistent section header (eyebrow label + display title + copy). */
export default function SectionHeading({
  label,
  title,
  description,
  light = false,
  align = 'left',
  className,
  action,
}: SectionHeadingProps) {
  const centered = align === 'center'
  return (
    <ScrollReveal
      className={cn(
        'mb-10 flex flex-col gap-4 sm:mb-14',
        centered
          ? 'items-center text-center'
          : action
            ? 'lg:flex-row lg:items-end lg:justify-between'
            : '',
        className,
      )}
    >
      <div className={cn(centered && 'flex flex-col items-center')}>
        <div
          className={cn(
            'section-label',
            light && 'section-label-light text-white/90',
            !light && 'text-burgundy',
            centered && 'justify-center',
          )}
        >
          <span className="text-xs sm:text-sm">{label}</span>
        </div>
        <h2
          className={cn(
            'heading-display text-3xl uppercase sm:text-4xl lg:text-5xl',
            light ? 'text-white' : 'text-brown',
          )}
        >
          {title}
        </h2>
        {description && (
          <p
            className={cn(
              'mt-4 max-w-xl text-sm sm:text-base',
              light ? 'text-white/70' : 'text-gray-500',
              centered && 'mx-auto max-w-2xl',
            )}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </ScrollReveal>
  )
}
