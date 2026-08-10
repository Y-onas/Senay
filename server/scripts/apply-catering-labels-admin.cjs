const fs = require('fs')
const path = require('path')
const esbuild = require('esbuild')

const ROOT = path.resolve(__dirname, '../..')
const SOURCE = path.join(__dirname, 'catering-labels-admin.source.js')
const MIN_FILE = path.join(__dirname, 'catering-labels-admin.min.js')

const BUNDLES = [
  'app/public/st-hq/assets/index-Ddcqtvm3.js',
  'admin/dist/assets/index-Ddcqtvm3.js',
  'app/dist/st-hq/assets/index-Ddcqtvm3.js',
]

const INSERT_BEFORE = 'function _5(){'

const OLD_FILTERS =
  'he=l.catalogItems.filter(H=>H.kind==="PACKAGE"),K=l.catalogItems.filter(H=>H.kind!=="PACKAGE"),'

const NEW_FILTERS =
  'he=l.catalogItems.filter(H=>H.kind==="PACKAGE"),CtOcc=l.catalogItems.filter(H=>H.kind==="CONFIG"&&H.metadata?.catalogRole==="occasion"),CtBev=l.catalogItems.filter(H=>H.kind==="CONFIG"&&H.metadata?.catalogRole==="beverage"),K=l.catalogItems.filter(H=>H.kind!=="PACKAGE"&&!(H.kind==="CONFIG"&&(H.metadata?.catalogRole==="occasion"||H.metadata?.catalogRole==="beverage"))),'

const OLD_CATERING_SECTION =
  'Se?i.jsxs(i.Fragment,{children:[i.jsx(Ua,{title:"Catering packages"'

const NEW_CATERING_SECTION =
  'Se?i.jsxs(i.Fragment,{children:[i.jsx(Cl7,{role:"occasion",title:"Event occasions",description:"Labels on the catering form (Wedding, Birthday, etc.) in English and Amharic.",addLabel:"Add occasion",emptyLabel:"No occasions yet.",items:CtOcc,serviceId:l.id,onRefresh:ce,onDelete:at}),i.jsx(Cl7,{role:"beverage",title:"Beverage options",description:"Drink add-on choices on the catering form.",addLabel:"Add option",emptyLabel:"No beverage options yet.",items:CtBev,serviceId:l.id,onRefresh:ce,onDelete:at}),i.jsx(Ua,{title:"Catering packages"'

function minifySource() {
  const source = fs.readFileSync(SOURCE, 'utf8')
  const result = esbuild.transformSync(source, {
    minify: true,
    target: 'es2020',
  })
  const code = result.code
  fs.writeFileSync(MIN_FILE, code)
  return code
}

function patchBundle(relPath, componentCode) {
  const file = path.join(ROOT, relPath)
  if (!fs.existsSync(file)) {
    console.warn('Skip missing', relPath)
    return
  }

  let text = fs.readFileSync(file, 'utf8')

  if (!text.includes('function Cl7(')) {
    if (!text.includes(INSERT_BEFORE)) throw new Error(`insert anchor missing in ${relPath}`)
    text = text.replace(INSERT_BEFORE, componentCode + INSERT_BEFORE)
  } else {
    const start = text.indexOf('function Cl7(')
    const end = text.indexOf(INSERT_BEFORE)
    if (start === -1 || end === -1 || start >= end) {
      throw new Error(`replace window missing in ${relPath}`)
    }
    text = text.slice(0, start) + componentCode + text.slice(end)
  }

  if (!text.includes('CtOcc=l.catalogItems.filter')) {
    if (!text.includes(OLD_FILTERS)) throw new Error(`filters anchor missing in ${relPath}`)
    text = text.replace(OLD_FILTERS, NEW_FILTERS)
  }

  if (!text.includes('title:"Event occasions"')) {
    if (!text.includes(OLD_CATERING_SECTION)) {
      throw new Error(`catering section anchor missing in ${relPath}`)
    }
    text = text.replace(OLD_CATERING_SECTION, NEW_CATERING_SECTION)
  }

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

const componentCode = minifySource()
for (const rel of BUNDLES) {
  patchBundle(rel, componentCode)
}
bumpCache()
