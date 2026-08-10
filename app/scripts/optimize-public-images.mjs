/**
 * Generates WebP variants for large hero/category PNGs (run: node scripts/optimize-public-images.mjs).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const imagesDir = path.resolve(__dirname, '../public/images')

const targets = [
  'tela-clean.png',
  'shiro-clean.png',
  'senay-tej-cut.png',
  'berbere-clean.png',
  'tej-clean.png',
  'cat-chicken.png',
  'foodreference.png',
  'senay-shiro-cut.png',
]

const maxWidth = 960

for (const file of targets) {
  const input = path.join(imagesDir, file)
  if (!fs.existsSync(input)) {
    console.warn(`skip (missing): ${file}`)
    continue
  }
  const output = input.replace(/\.png$/i, '.webp')
  const before = fs.statSync(input).size
  await sharp(input)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toFile(output)
  const after = fs.statSync(output).size
  console.log(`${file}: ${(before / 1024).toFixed(0)}KB → ${(after / 1024).toFixed(0)}KB webp`)
}
