export type FieldType = 'string' | 'number' | 'boolean' | 'json'
export type ComplexMode = 'pairs' | 'list'

export type ComplexPair = { id: string; key: string; value: string }
export type ContentField = {
  id: string
  key: string
  type: FieldType
  value: string
  complexMode?: ComplexMode
  complexPairs?: ComplexPair[]
  complexItems?: string[]
}

function isPrimitive(value: unknown) {
  return value === null || ['string', 'number', 'boolean'].includes(typeof value)
}

function coerceValue(raw: string) {
  const trimmed = raw.trim()
  if (trimmed === '') return ''
  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed)
  return raw
}

export function inferComplexMode(key: string, value?: unknown): ComplexMode {
  const lower = key.toLowerCase()
  if (
    lower.includes('list') ||
    lower.includes('items') ||
    lower.includes('dishes') ||
    lower.includes('tags') ||
    lower.includes('gallery') ||
    lower.includes('images') ||
    Array.isArray(value)
  ) {
    return 'list'
  }
  return 'pairs'
}

function detectFieldType(value: unknown): { type: FieldType; value: string } {
  if (typeof value === 'number') return { type: 'number', value: String(value) }
  if (typeof value === 'boolean') return { type: 'boolean', value: value ? 'true' : 'false' }
  if (value && typeof value === 'object') return { type: 'json', value: JSON.stringify(value, null, 2) }
  return { type: 'string', value: String(value ?? '') }
}

function fieldFromJson(id: string, key: string, value: unknown, jsonValue: string): ContentField {
  if (Array.isArray(value) && value.every(isPrimitive)) {
    return {
      id,
      key,
      type: 'json',
      value: jsonValue,
      complexMode: 'list',
      complexItems: value.map((entry) => String(entry ?? '')),
    }
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.every(([, entry]) => isPrimitive(entry))) {
      return {
        id,
        key,
        type: 'json',
        value: jsonValue,
        complexMode: 'pairs',
        complexPairs: entries.map(([entryKey, entryValue], index) => ({
          id: `${id}-pair-${index}`,
          key: entryKey,
          value: String(entryValue ?? ''),
        })),
      }
    }
  }
  return {
    id,
    key,
    type: 'json',
    value: jsonValue,
    complexMode: inferComplexMode(key, value),
    complexPairs: [{ id: `${id}-pair-0`, key: '', value: '' }],
    complexItems: [''],
  }
}

export function contentToFields(content: Record<string, unknown>): ContentField[] {
  return Object.entries(content).map(([key, value], index) => {
    const detected = detectFieldType(value)
    const id = `${key}-${index}`
    if (detected.type !== 'json') {
      return { id, key, type: detected.type, value: detected.value }
    }
    return fieldFromJson(id, key, value, detected.value)
  })
}

export function fieldsToContent(fields: ContentField[]): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const field of fields) {
    const key = field.key.trim()
    if (!key) continue
    if (field.type === 'number') {
      const num = Number(field.value)
      result[key] = Number.isFinite(num) ? num : 0
      continue
    }
    if (field.type === 'boolean') {
      result[key] = field.value === 'true'
      continue
    }
    if (field.type === 'json') {
      const mode = field.complexMode ?? inferComplexMode(key)
      if (mode === 'pairs') {
        const obj: Record<string, unknown> = {}
        for (const pair of field.complexPairs ?? []) {
          const pairKey = pair.key.trim()
          if (pairKey) obj[pairKey] = coerceValue(pair.value)
        }
        result[key] = obj
        continue
      }
      result[key] = (field.complexItems ?? []).map((item) => item.trim()).filter(Boolean)
      continue
    }
    result[key] = field.value
  }
  return result
}

export function fingerprintContent(content: Record<string, unknown>) {
  const sorted = Object.keys(content)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = content[key]
      return acc
    }, {})
  return JSON.stringify(sorted)
}

export function slugifyTitle(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
