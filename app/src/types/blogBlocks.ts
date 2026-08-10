export type BlogBlockType =
  | 'paragraph'
  | 'heading'
  | 'quote'
  | 'list'
  | 'image'
  | 'gallery'
  | 'columns'
  | 'cta'
  | 'divider'

/** Resolved plain string on the public site; admin may store `{ en, am }`. */
export type LocalizedString = string | { en?: string; am?: string }

export interface BlogImageItem {
  url: string
  caption?: LocalizedString
}

interface BlogBlockBase {
  id: string
  type: BlogBlockType
}

export interface ParagraphBlock extends BlogBlockBase {
  type: 'paragraph'
  text: LocalizedString
}

export interface HeadingBlock extends BlogBlockBase {
  type: 'heading'
  level: 2 | 3
  text: LocalizedString
}

export interface QuoteBlock extends BlogBlockBase {
  type: 'quote'
  text: LocalizedString
  attribution?: LocalizedString
}

export interface ListBlock extends BlogBlockBase {
  type: 'list'
  style: 'bullet' | 'numbered'
  items: LocalizedString[]
}

export interface ImageBlock extends BlogBlockBase {
  type: 'image'
  url: string
  caption?: LocalizedString
  layout?: 'default' | 'wide' | 'full'
}

export interface GalleryBlock extends BlogBlockBase {
  type: 'gallery'
  images: BlogImageItem[]
}

export interface ColumnsBlock extends BlogBlockBase {
  type: 'columns'
  images: BlogImageItem[]
}

export interface CtaBlock extends BlogBlockBase {
  type: 'cta'
  text: LocalizedString
  buttonText: LocalizedString
  buttonLink: string
}

export interface DividerBlock extends BlogBlockBase {
  type: 'divider'
}

export type BlogBlock =
  | ParagraphBlock
  | HeadingBlock
  | QuoteBlock
  | ListBlock
  | ImageBlock
  | GalleryBlock
  | ColumnsBlock
  | CtaBlock
  | DividerBlock

export function blocksFromLegacyContent(content: string[]): BlogBlock[] {
  return content
    .map((text) => text.trim())
    .filter(Boolean)
    .map((text, index) => ({
      id: `legacy-${index}`,
      type: 'paragraph' as const,
      text,
    }))
}

export function normalizeBlocks(
  blocks: unknown,
  content: string[] = [],
): BlogBlock[] {
  if (Array.isArray(blocks) && blocks.length > 0) {
    return blocks as BlogBlock[]
  }
  return blocksFromLegacyContent(content)
}

/** Public API resolves locale server-side; keep a safe display helper for mocks. */
export function displayLocalized(
  value: LocalizedString | undefined | null,
  locale: 'en' | 'am' = 'en',
): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  const direct = value[locale]
  if (typeof direct === 'string' && direct.trim()) return direct
  if (typeof value.en === 'string') return value.en
  if (typeof value.am === 'string') return value.am
  return ''
}
