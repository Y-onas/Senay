const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '../..')
const H7 = fs
  .readFileSync(path.join(__dirname, 'hero-editor-h7.min.js'), 'utf8')
  .replace(/^"use strict";/, '')
  .replace(/^function \w+\(/, 'function h7(')

const bundles = [
  'app/public/st-hq/assets/index-Ddcqtvm3.js',
  'admin/dist/assets/index-Ddcqtvm3.js',
  'app/dist/st-hq/assets/index-Ddcqtvm3.js',
]

for (const rel of bundles) {
  const file = path.join(ROOT, rel)
  if (!fs.existsSync(file)) continue
  const text = fs.readFileSync(file, 'utf8')
  const start = text.indexOf('function h7(')
  const altStart = text.indexOf('function A({section:')
  const replaceStart = start !== -1 ? start : altStart
  const end = text.indexOf('const Hm=')
  if (end === -1) {
    console.error('Hm anchor missing in', rel)
    process.exit(1)
  }
  const next =
    replaceStart === -1
      ? text.slice(0, end) + H7 + text.slice(end)
      : text.slice(0, replaceStart) + H7 + text.slice(end)
  fs.writeFileSync(file, next)
  console.log('Updated', rel)
}

const indexHtml = path.join(ROOT, 'app/public/st-hq/index.html')
const html = fs.readFileSync(indexHtml, 'utf8')
const match = html.match(/\?v=(\d+)/)
if (match) {
  const v = Number(match[1]) + 1
  fs.writeFileSync(indexHtml, html.replace(`?v=${match[1]}`, `?v=${v}`))
  console.log('Cache bust v=' + v)
}
