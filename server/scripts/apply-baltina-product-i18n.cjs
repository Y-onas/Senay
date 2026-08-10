const fs = require('fs')
const path = require('path')
const esbuild = require('esbuild')

const ROOT = path.resolve(__dirname, '../..')
const SOURCE = path.join(__dirname, 'baltina-drinks-product-i18n.source.js')
const MIN_FILE = path.join(__dirname, 'baltina-drinks-product-i18n.min.js')

const BUNDLES = [
  'app/public/st-hq/assets/index-Ddcqtvm3.js',
  'admin/dist/assets/index-Ddcqtvm3.js',
  'app/dist/st-hq/assets/index-Ddcqtvm3.js',
]

const ANCHOR_START = 'function k5('
const ANCHOR_END = 'function M5('

const OLD_L_STATE =
  '[L,q]=x.useState({name:"",slug:"",category:"flours",price:"",unit:"kg",minQty:"0.5",step:"0.5",image:"",description:""})'

const NEW_L_STATE =
  '[L,q]=x.useState({name:"",nameEn:"",nameAm:"",slug:"",category:"flours",price:"",unit:"kg",minQty:"0.5",step:"0.5",image:"",description:"",descEn:"",descAm:""})'

const OLD_Z_STATE =
  '[z,B]=x.useState({name:"",slug:"",price:"",unit:"L",minQty:"1",step:"0.5",image:"",description:""})'

const NEW_Z_STATE =
  '[z,B]=x.useState({name:"",nameEn:"",nameAm:"",slug:"",price:"",unit:"L",minQty:"1",step:"0.5",image:"",descEn:"",descAm:"",description:""})'

const OLD_BALTINA_NAME_FIELD =
  'i.jsx(ge,{label:"Product name",children:i.jsx(J,{placeholder:"e.g. Shiro",value:L.name,onChange:H=>q(ue=>({...ue,name:H.target.value}))})})'

const NEW_BALTINA_NAME_FIELD = `i.jsxs("div",{className:"space-y-2 sm:col-span-2",children:[i.jsx(me,{children:"Name"}),i.jsxs("div",{className:"grid grid-cols-1 gap-3 md:grid-cols-2",children:[i.jsxs("div",{className:"space-y-1",children:[i.jsx("p",{className:"text-[11px] font-semibold uppercase tracking-wide text-brown-muted",children:"EN"}),i.jsx(J,{placeholder:"e.g. Shiro",value:L.nameEn,onChange:H=>q(ue=>({...ue,nameEn:H.target.value,name:H.target.value}))})]}),i.jsxs("div",{className:"space-y-1",children:[i.jsx("p",{className:"text-[11px] font-semibold uppercase tracking-wide text-brown-muted",children:"AM"}),i.jsx(J,{placeholder:"ሽሮ",value:L.nameAm,onChange:H=>q(ue=>({...ue,nameAm:H.target.value}))})]})]})]})`

const OLD_BALTINA_DESC_FIELD =
  'i.jsx(ge,{label:"Description",className:"sm:col-span-2",children:i.jsx(J,{placeholder:"Short description",value:L.description,onChange:H=>q(ue=>({...ue,description:H.target.value}))})})'

const NEW_BALTINA_DESC_FIELD = `i.jsxs("div",{className:"space-y-2 sm:col-span-2",children:[i.jsx(me,{children:"Description"}),i.jsxs("div",{className:"grid grid-cols-1 gap-3 md:grid-cols-2",children:[i.jsxs("div",{className:"space-y-1",children:[i.jsx("p",{className:"text-[11px] font-semibold uppercase tracking-wide text-brown-muted",children:"EN"}),i.jsx(Vn,{rows:2,placeholder:"Short description",value:L.descEn,onChange:H=>q(ue=>({...ue,descEn:H.target.value,description:H.target.value}))})]}),i.jsxs("div",{className:"space-y-1",children:[i.jsx("p",{className:"text-[11px] font-semibold uppercase tracking-wide text-brown-muted",children:"AM"}),i.jsx(Vn,{rows:2,placeholder:"አጭር መግለጫ",value:L.descAm,onChange:H=>q(ue=>({...ue,descAm:H.target.value}))})]})]})]})`

const OLD_BALTINA_CREATE =
  'name:L.name.trim(),description:L.description.trim(),price:dt(L.price),image:L.image.trim()||null,available:!0,metadata:{category:L.category,unit:L.unit.trim()||"kg",minQty:dt(L.minQty||"0.5"),step:dt(L.step||"0.5")}}),we.success("Baltina product created"),q({name:"",slug:"",category:"flours",price:"",unit:"kg",minQty:"0.5",step:"0.5",image:"",description:""})'

const NEW_BALTINA_CREATE =
  'name:(L.nameEn||L.name).trim(),nameI18n:{en:(L.nameEn||L.name).trim(),am:(L.nameAm||"").trim()},description:(L.descEn||L.description).trim(),descriptionI18n:{en:(L.descEn||L.description).trim(),am:(L.descAm||"").trim()},price:dt(L.price),image:L.image.trim()||null,available:!0,metadata:{category:L.category,unit:L.unit.trim()||"kg",minQty:dt(L.minQty||"0.5"),step:dt(L.step||"0.5")}}),we.success("Baltina product created"),q({name:"",nameEn:"",nameAm:"",slug:"",category:"flours",price:"",unit:"kg",minQty:"0.5",step:"0.5",image:"",description:"",descEn:"",descAm:""})'

const OLD_DRINKS_NAME_FIELD =
  'i.jsx(ge,{label:"Product name",children:i.jsx(J,{placeholder:"e.g. Tela",value:z.name,onChange:H=>B(ue=>({...ue,name:H.target.value}))})})'

const NEW_DRINKS_NAME_FIELD = `i.jsxs("div",{className:"space-y-2 sm:col-span-2",children:[i.jsx(me,{children:"Name"}),i.jsxs("div",{className:"grid grid-cols-1 gap-3 md:grid-cols-2",children:[i.jsxs("div",{className:"space-y-1",children:[i.jsx("p",{className:"text-[11px] font-semibold uppercase tracking-wide text-brown-muted",children:"EN"}),i.jsx(J,{placeholder:"e.g. Tela",value:z.nameEn,onChange:H=>B(ue=>({...ue,nameEn:H.target.value,name:H.target.value}))})]}),i.jsxs("div",{className:"space-y-1",children:[i.jsx("p",{className:"text-[11px] font-semibold uppercase tracking-wide text-brown-muted",children:"AM"}),i.jsx(J,{placeholder:"ተላ",value:z.nameAm,onChange:H=>B(ue=>({...ue,nameAm:H.target.value}))})]})]})]})`

const OLD_DRINKS_DESC_FIELD =
  'i.jsx(ge,{label:"Description",className:"sm:col-span-2",children:i.jsx(J,{value:z.description,onChange:H=>B(ue=>({...ue,description:H.target.value}))})})'

const NEW_DRINKS_DESC_FIELD = `i.jsxs("div",{className:"space-y-2 sm:col-span-2",children:[i.jsx(me,{children:"Description"}),i.jsxs("div",{className:"grid grid-cols-1 gap-3 md:grid-cols-2",children:[i.jsxs("div",{className:"space-y-1",children:[i.jsx("p",{className:"text-[11px] font-semibold uppercase tracking-wide text-brown-muted",children:"EN"}),i.jsx(Vn,{rows:2,placeholder:"Short description",value:z.descEn,onChange:H=>B(ue=>({...ue,descEn:H.target.value,description:H.target.value}))})]}),i.jsxs("div",{className:"space-y-1",children:[i.jsx("p",{className:"text-[11px] font-semibold uppercase tracking-wide text-brown-muted",children:"AM"}),i.jsx(Vn,{rows:2,placeholder:"አጭር መግለጫ",value:z.descAm,onChange:H=>B(ue=>({...ue,descAm:H.target.value}))})]})]})]})`

const OLD_DRINKS_CREATE =
  'name:z.name.trim(),description:z.description.trim(),price:dt(z.price),image:z.image.trim()||null,available:!0,metadata:{category:"drinks",unit:z.unit.trim()||"L",minQty:dt(z.minQty||"1"),step:dt(z.step||"0.5")}}),we.success("Drinks product created"),B({name:"",slug:"",price:"",unit:"L",minQty:"1",step:"0.5",image:"",description:""})'

const NEW_DRINKS_CREATE =
  'name:(z.nameEn||z.name).trim(),nameI18n:{en:(z.nameEn||z.name).trim(),am:(z.nameAm||"").trim()},description:(z.descEn||z.description).trim(),descriptionI18n:{en:(z.descEn||z.description).trim(),am:(z.descAm||"").trim()},price:dt(z.price),image:z.image.trim()||null,available:!0,metadata:{category:"drinks",unit:z.unit.trim()||"L",minQty:dt(z.minQty||"1"),step:dt(z.step||"0.5")}}),we.success("Drinks product created"),B({name:"",nameEn:"",nameAm:"",slug:"",price:"",unit:"L",minQty:"1",step:"0.5",image:"",descEn:"",descAm:"",description:""})'

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

function patchBundle(relPath, editorsCode) {
  const file = path.join(ROOT, relPath)
  if (!fs.existsSync(file)) {
    console.warn('Skip missing', relPath)
    return
  }

  let text = fs.readFileSync(file, 'utf8')

  const start = text.indexOf(ANCHOR_START)
  const end = text.indexOf(ANCHOR_END)
  if (start === -1 || end === -1 || start >= end) {
    throw new Error(`editor anchor missing in ${relPath}`)
  }

  if (!text.includes('nameI18n:{en:') || !text.includes('readI18n')) {
    text = text.slice(0, start) + editorsCode + text.slice(end)
  } else {
    const editorStart = text.indexOf(ANCHOR_START)
    const editorEnd = text.indexOf(ANCHOR_END)
    text = text.slice(0, editorStart) + editorsCode + text.slice(editorEnd)
  }

  const patches = [
    [OLD_L_STATE, NEW_L_STATE],
    [OLD_Z_STATE, NEW_Z_STATE],
    [OLD_BALTINA_NAME_FIELD, NEW_BALTINA_NAME_FIELD],
    [OLD_BALTINA_DESC_FIELD, NEW_BALTINA_DESC_FIELD],
    [OLD_BALTINA_CREATE, NEW_BALTINA_CREATE],
    [OLD_DRINKS_NAME_FIELD, NEW_DRINKS_NAME_FIELD],
    [OLD_DRINKS_DESC_FIELD, NEW_DRINKS_DESC_FIELD],
    [OLD_DRINKS_CREATE, NEW_DRINKS_CREATE],
  ]

  for (const [oldStr, newStr] of patches) {
    if (text.includes(newStr)) continue
    if (!text.includes(oldStr)) {
      console.warn(`Skip missing anchor in ${relPath}: ${oldStr.slice(0, 60)}`)
      continue
    }
    text = text.replace(oldStr, newStr)
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

const editorsCode = minifySource()
for (const rel of BUNDLES) {
  patchBundle(rel, editorsCode)
}
bumpCache()
