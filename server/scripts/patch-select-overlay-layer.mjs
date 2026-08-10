/**
 * Fixes admin Select/dropdown layering: opaque popover surface + popper positioning.
 * Root cause: live bundle used `bg-popover/98`, which was not present in the CSS
 * bundle, so open selects were transparent and underlying accordion/card text showed through.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

const jsPaths = [
  'app/public/st-hq/assets/index-Ddcqtvm3.js',
  'admin/dist/assets/index-Ddcqtvm3.js',
  'app/dist/st-hq/assets/index-Ddcqtvm3.js',
].map((p) => path.join(root, p)).filter((p) => fs.existsSync(p))

const cssPaths = [
  'app/public/st-hq/assets/index-DgaZqxrR.css',
  'admin/dist/assets/index-DgaZqxrR.css',
  'app/dist/st-hq/assets/index-DgaZqxrR.css',
].map((p) => path.join(root, p)).filter((p) => fs.existsSync(p))

const htmlPaths = [
  'app/public/st-hq/index.html',
  'admin/dist/index.html',
  'app/dist/st-hq/index.html',
].map((p) => path.join(root, p)).filter((p) => fs.existsSync(p))

const CSS_MARKER = '/* floating-overlay-layer */'
const CSS_PATCH = `${CSS_MARKER}
[data-slot="select-content"],
[data-slot="dropdown-menu-content"],
[data-slot="popover-content"],
[data-slot="context-menu-content"],
[data-slot="menubar-content"],
[data-slot="navigation-menu-content"] {
  background-color: hsl(var(--popover));
  color: hsl(var(--popover-foreground));
  isolation: isolate;
  z-index: 100;
}
[data-radix-popper-content-wrapper] {
  z-index: 100 !important;
}
`

for (const p of jsPaths) {
  let t = fs.readFileSync(p, 'utf8')
  t = t.replaceAll('bg-popover/98', 'bg-popover')
  t = t.replaceAll('position:r="item-aligned"', 'position:r="popper"')
  t = t.replace(
    'relative z-50 max-h-(--radix-select-content-available-height)',
    'isolate z-[100] max-h-(--radix-select-content-available-height)',
  )
  fs.writeFileSync(p, t)
  console.log('JS', path.relative(root, p), {
    solid: !t.includes('bg-popover/98'),
    popper: t.includes('position:r="popper"'),
    z100: t.includes('isolate z-[100] max-h-(--radix-select-content-available-height)'),
  })
}

for (const p of cssPaths) {
  let t = fs.readFileSync(p, 'utf8')
  const util = '.z-' + String.raw`\[100\]` + '{z-index:100}.isolate{isolation:isolate}\n'
  const block = CSS_PATCH.trim() + '\n' + util
  if (t.includes(CSS_MARKER)) {
    t = t.replace(new RegExp(`${CSS_MARKER}[\\s\\S]*$`), block)
  } else {
    t = t.trimEnd() + '\n' + block
  }
  fs.writeFileSync(p, t)
  console.log('CSS', path.relative(root, p))
}

const CACHE = 'v=58'
for (const p of htmlPaths) {
  let t = fs.readFileSync(p, 'utf8')
  t = t.replace(/index-Ddcqtvm3\.js(\?v=\d+)?/, `index-Ddcqtvm3.js?${CACHE}`)
  fs.writeFileSync(p, t)
  console.log('HTML', path.relative(root, p), CACHE)
}
