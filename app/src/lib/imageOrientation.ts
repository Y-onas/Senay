export type ImageOrientation = 'landscape' | 'portrait' | 'square'

export function detectOrientation(width: number, height: number): ImageOrientation {
  const ratio = width / height
  if (ratio > 1.12) return 'landscape'
  if (ratio < 0.88) return 'portrait'
  return 'square'
}
