import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useOptionalHomeSectionsContext } from '@/context/HomeSectionsProvider'
import { useHomeSection } from '@/hooks/useHomeSection'

const IMMEDIATE_SECTIONS = new Set(['hero'])

export default function HomeSectionGate({
  sectionKey,
  children,
}: {
  sectionKey: string
  children: ReactNode
}) {
  const ctx = useOptionalHomeSectionsContext()
  const containerRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(() => IMMEDIATE_SECTIONS.has(sectionKey))
  const { enabled } = useHomeSection(sectionKey)

  useEffect(() => {
    if (!enabled) return
    if (IMMEDIATE_SECTIONS.has(sectionKey)) {
      ctx?.ensureLoaded()
      return
    }

    const node = containerRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setVisible(true)
        ctx?.ensureLoaded()
        observer.disconnect()
      },
      { rootMargin: '120px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [sectionKey, ctx, enabled])

  if (!visible) {
    return <div ref={containerRef} className="min-h-px" aria-hidden />
  }

  if (!enabled) return null

  return <div ref={containerRef}>{children}</div>
}
