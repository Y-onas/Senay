const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '../..')
const W7 = fs
  .readFileSync(path.join(__dirname, 'why-choose-us-editor-w7.min.js'), 'utf8')
  .replace(/^"use strict";/, '')
  .replace(/^function \w+\(/, 'function w7(')

const bundles = [
  'app/public/st-hq/assets/index-Ddcqtvm3.js',
  'admin/dist/assets/index-Ddcqtvm3.js',
  'app/dist/st-hq/assets/index-Ddcqtvm3.js',
]

for (const rel of bundles) {
  const file = path.join(ROOT, rel)
  if (!fs.existsSync(file)) continue
  const text = fs.readFileSync(file, 'utf8')
  const start = text.indexOf('function w7(')
  const end = text.indexOf('function x6(')
  if (end === -1) {
    console.error('x6 anchor missing in', rel)
    process.exit(1)
  }
  const next =
    start === -1
      ? text.slice(0, end) + W7 + text.slice(end)
      : text.slice(0, start) + W7 + text.slice(end)
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
