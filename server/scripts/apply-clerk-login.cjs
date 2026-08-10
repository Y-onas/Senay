/**
 * Replace password login (S4) with redirect to Clerk branded page,
 * and fix 401 redirects to /st-hq/login.
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '../..')
const BUNDLES = [
  'app/public/st-hq/assets/index-Ddcqtvm3.js',
  'admin/dist/assets/index-Ddcqtvm3.js',
  'app/dist/st-hq/assets/index-Ddcqtvm3.js',
]

const OLD_S4_START = 'function S4(){const[n,l]=x.useState("admin@senaytela.com")'
const NEW_S4 =
  'function S4(){x.useEffect(()=>{window.location.replace("/st-hq/login.html")},[]);return i.jsx("div",{className:"flex min-h-screen items-center justify-center bg-burgundy text-cream",children:"Redirecting to secure sign-in…"})}'

const OLD_401_A =
  'window.location.pathname!=="/login"&&window.location.assign("/login")'
const NEW_401_A =
  '!window.location.pathname.includes("/st-hq/login")&&window.location.assign("/st-hq/login.html")'

function replaceS4(text) {
  const start = text.indexOf(OLD_S4_START)
  if (start === -1) {
    if (text.includes('window.location.replace("/st-hq/login")')) return text
    throw new Error('S4 login function not found')
  }
  const end = text.indexOf('}function Ke({className:n,...l})', start)
  if (end === -1) throw new Error('S4 end marker not found')
  return text.slice(0, start) + NEW_S4 + text.slice(end + 1)
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

for (const rel of BUNDLES) {
  const file = path.join(ROOT, rel)
  if (!fs.existsSync(file)) {
    console.warn('Skip missing', rel)
    continue
  }
  let text = fs.readFileSync(file, 'utf8')
  text = replaceS4(text)
  if (text.includes(OLD_401_A)) {
    text = text.split(OLD_401_A).join(NEW_401_A)
  }
  fs.writeFileSync(file, text)
  console.log('Patched', rel)
}
bumpCache()
