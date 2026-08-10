const fs = require('fs')
const path = require('path')
const esbuild = require('esbuild')

const ROOT = path.resolve(__dirname, '../..')
const SOURCE = path.join(__dirname, 'telegram-admin.source.js')
const MIN_FILE = path.join(__dirname, 'telegram-admin.min.js')

const BUNDLES = [
  'app/public/st-hq/assets/index-Ddcqtvm3.js',
  'admin/dist/assets/index-Ddcqtvm3.js',
  'app/dist/st-hq/assets/index-Ddcqtvm3.js',
]

const OLD_SETTINGS =
  'settings:{get:n=>ae.get(`/admin/settings/${n}`),update:(n,l)=>ae.put(`/admin/settings/${n}`,{value:l})}}'

const NEW_SETTINGS =
  'settings:{get:n=>ae.get(`/admin/settings/${n}`),update:(n,l)=>ae.put(`/admin/settings/${n}`,{value:l})},bot:{menus:()=>ae.get("/admin/bot/menus"),patchMenu:(n,l)=>ae.patch(`/admin/bot/menus/${n}`,l),reorderMenus:n=>ae.post("/admin/bot/menus/reorder",{ids:n}),messages:()=>ae.get("/admin/bot/messages"),putMessage:(n,l)=>ae.put(`/admin/bot/messages/${n}`,l),services:()=>ae.get("/admin/bot/services"),patchService:(n,l)=>ae.patch(`/admin/bot/services/${n}`,l),stats:()=>ae.get("/admin/bot/stats"),health:()=>ae.get("/admin/bot/health"),users:n=>ae.get(`/admin/bot/users${n?`?${n}`:""}`),user:n=>ae.get(`/admin/bot/users/${n}`),patchUser:(n,l)=>ae.patch(`/admin/bot/users/${n}`,l),admins:()=>ae.get("/admin/admins")}}'

const OLD_BOT_SERVICES_ANCHOR =
  'putMessage:(n,l)=>ae.put(`/admin/bot/messages/${n}`,l),stats:()=>ae.get("/admin/bot/stats")'

const NEW_BOT_SERVICES_ANCHOR =
  'putMessage:(n,l)=>ae.put(`/admin/bot/messages/${n}`,l),services:()=>ae.get("/admin/bot/services"),patchService:(n,l)=>ae.patch(`/admin/bot/services/${n}`,l),stats:()=>ae.get("/admin/bot/stats")'

const OLD_SIDEBAR =
  '},{label:"Catalog",items:[{to:"/services",icon:db,label:"Services"}]},{label:"System",items:'

const NEW_SIDEBAR =
  '},{label:"Catalog",items:[{to:"/services",icon:db,label:"Services"}]},{label:"Telegram",items:[{to:"/telegram",icon:mr,label:"Bot"},{to:"/telegram/users",icon:pb,label:"Users"}]},{label:"System",items:'

const OLD_ROUTES =
  'i.jsx(Ut,{path:"services/:id",element:i.jsx(_5,{})})]})'

const NEW_ROUTES =
  'i.jsx(Ut,{path:"services/:id",element:i.jsx(_5,{})}),i.jsx(Ut,{path:"telegram",element:i.jsx(b7,{})}),i.jsx(Ut,{path:"telegram/users",element:i.jsx(u7,{})}),i.jsx(Ut,{path:"telegram/users/:id",element:i.jsx(d7,{})})]})'

const INSERT_BEFORE = 'function a5(){'

function minifySource() {
  const source = fs.readFileSync(SOURCE, 'utf8')
  const result = esbuild.transformSync(source, {
    minify: true,
    target: 'es2020',
  })
  let code = result.code
    .replace(/^function b7\(/, 'function b7(')
    .replace(/\nfunction u7\(/, '\nfunction u7(')
    .replace(/\nfunction d7\(/, '\nfunction d7(')
  fs.writeFileSync(MIN_FILE, code)
  return code
}

function patchBundle(relPath, pagesCode) {
  const file = path.join(ROOT, relPath)
  if (!fs.existsSync(file)) {
    console.warn('Skip missing', relPath)
    return
  }

  let text = fs.readFileSync(file, 'utf8')

  if (!text.includes('Ws.bot.menus')) {
    if (!text.includes(OLD_SETTINGS)) throw new Error(`settings anchor missing in ${relPath}`)
    text = text.replace(OLD_SETTINGS, NEW_SETTINGS)
  } else if (!text.includes('patchService:') && text.includes(OLD_BOT_SERVICES_ANCHOR)) {
    text = text.replace(OLD_BOT_SERVICES_ANCHOR, NEW_BOT_SERVICES_ANCHOR)
  }

  if (!text.includes('label:"Telegram"')) {
    if (!text.includes(OLD_SIDEBAR)) throw new Error(`sidebar anchor missing in ${relPath}`)
    text = text.replace(OLD_SIDEBAR, NEW_SIDEBAR)
  }

  if (!text.includes('path:"telegram"')) {
    if (!text.includes(OLD_ROUTES)) throw new Error(`routes anchor missing in ${relPath}`)
    text = text.replace(OLD_ROUTES, NEW_ROUTES)
  }

  if (!text.includes('function b7()')) {
    if (!text.includes(INSERT_BEFORE)) throw new Error(`insert anchor missing in ${relPath}`)
    text = text.replace(INSERT_BEFORE, pagesCode + INSERT_BEFORE)
  } else {
    const start = text.indexOf('function b7()')
    const end = text.indexOf(INSERT_BEFORE)
    if (start === -1 || end === -1 || start >= end) throw new Error(`replace window missing in ${relPath}`)
    text = text.slice(0, start) + pagesCode + text.slice(end)
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

const pagesCode = minifySource()
for (const rel of BUNDLES) {
  patchBundle(rel, pagesCode)
}
bumpCache()
