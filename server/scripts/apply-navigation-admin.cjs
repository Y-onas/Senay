const fs = require('fs')
const path = require('path')
const esbuild = require('esbuild')

const ROOT = path.resolve(__dirname, '../..')
const SOURCE = path.join(__dirname, 'navigation-admin.source.js')
const MIN_FILE = path.join(__dirname, 'navigation-admin.min.js')

const BUNDLES = [
  'app/public/st-hq/assets/index-Ddcqtvm3.js',
  'admin/dist/assets/index-Ddcqtvm3.js',
  'app/dist/st-hq/assets/index-Ddcqtvm3.js',
]

const INSERT_AFTER = 'function a5(){'
const INSERT_BEFORE = 'function l5(){'

function minifySource() {
  const source = fs.readFileSync(SOURCE, 'utf8')
  const result = esbuild.transformSync(source, {
    minify: true,
    target: 'es2020',
  })
  fs.writeFileSync(MIN_FILE, result.code)
  return result.code
}

function patchBundle(relPath, pageCode) {
  const file = path.join(ROOT, relPath)
  if (!fs.existsSync(file)) {
    console.warn('Skip missing', relPath)
    return
  }

  let text = fs.readFileSync(file, 'utf8')
  const start = text.indexOf(INSERT_AFTER)
  const end = text.indexOf(INSERT_BEFORE)
  if (start === -1 || end === -1 || start >= end) {
    throw new Error(`navigation admin window missing in ${relPath}`)
  }

  text = text.slice(0, start) + pageCode + text.slice(end)
  fs.writeFileSync(file, text)
  console.log('Patched', relPath)
}

function bumpCache() {
  const indexHtml = path.join(ROOT, 'app/public/st-hq/index.html')
  if (!fs.existsSync(indexHtml)) return
  const html = fs.readFileSync(indexHtml, 'utf8')
  const match = html.match(/\?v=(\d+)/)
  if (!match) return
  const next = Number(match[1]) + 1
  fs.writeFileSync(indexHtml, html.replace(`?v=${match[1]}`, `?v=${next}`))
  console.log('Cache bust v=' + next)
}

const pageCode = minifySource()
for (const rel of BUNDLES) {
  patchBundle(rel, pageCode)
}
bumpCache()
