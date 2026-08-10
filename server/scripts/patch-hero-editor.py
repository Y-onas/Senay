#!/usr/bin/env python3
"""Add a dedicated Hero editor to the admin Home page."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BUNDLE_PATHS = [
    ROOT / "app/public/st-hq/assets/index-Ddcqtvm3.js",
    ROOT / "admin/dist/assets/index-Ddcqtvm3.js",
    ROOT / "app/dist/st-hq/assets/index-Ddcqtvm3.js",
]
INDEX_HTML = ROOT / "app/public/st-hq/index.html"

H7 = (
    'function h7({section:n,onSave:l}){'
    'const[r,o]=x.useState(n),[u,f]=x.useState(n.content??{});'
    'x.useEffect(()=>{o(n),f(n.content??{})},[n]);'
    'const slides=Array.isArray(u.slides)?[...u.slides]:[];'
    'while(slides.length<4)slides.push({src:"",alt:""});'
    'const four=slides.slice(0,4),setSlide=(y,v)=>{const S=[...four];S[y]={...S[y],...v},f(w=>({...w,slides:S}))},'
    'line1=u.headlineLine1??((u.headline||"").split(/\\s+of\\s+/i)[0]||"Taste the Soul"),'
    'line2=u.headlineLine2??((u.headline||"").split(/\\s+of\\s+/i)[1]||"Ethiopia"),'
    'save=()=>{const a=u.headlineLine1??line1,b=u.headlineLine2??line2;'
    'l(r,{...u,eyebrow:u.eyebrow||"",headlineLine1:a,headlineLine2:b,headline:(a+" of "+b).trim(),slides:four})};'
    'return i.jsxs(Ke,{children:['
    'i.jsx(Ot,{children:i.jsxs("div",{className:"flex items-center justify-between",children:['
    'i.jsxs("div",{children:['
    'i.jsx(Mt,{className:"text-base",children:"Hero"}),'
    'i.jsx("p",{className:"text-sm text-brown-muted",children:"Top banner text and four rotating product images."})'
    ']}),'
    'i.jsxs("div",{className:"flex items-center gap-2",children:['
    'i.jsx(rn,{checked:r.enabled,onCheckedChange:y=>o(v=>({...v,enabled:y}))}),'
    'i.jsxs(re,{size:"sm",onClick:save,children:[i.jsx(ha,{className:"w-4 h-4 mr-2"}),"Save section"]})'
    ']}'
    ')]})}),'
    'i.jsxs(xt,{className:"space-y-6",children:['
    'i.jsxs("div",{className:"grid grid-cols-1 gap-4 md:grid-cols-2",children:['
    'i.jsxs("div",{className:"space-y-2 md:col-span-2",children:['
    'i.jsx(me,{children:"Tagline"}),'
    'i.jsx(J,{value:u.eyebrow||"",placeholder:"Authentic • Traditional • Brewed by Chemist",onChange:y=>f(v=>({...v,eyebrow:y.target.value}))}),'
    'i.jsx("p",{className:"text-[11px] text-brown-muted",children:"Separate phrases with • (middle dot)."})'
    ']}),'
    'i.jsxs("div",{className:"space-y-2",children:['
    'i.jsx(me,{children:"Headline line 1"}),'
    'i.jsx(J,{value:line1,placeholder:"Taste the Soul",onChange:y=>f(v=>({...v,headlineLine1:y.target.value}))})'
    ']}),'
    'i.jsxs("div",{className:"space-y-2",children:['
    'i.jsx(me,{children:"Headline line 2"}),'
    'i.jsx(J,{value:line2,placeholder:"of Ethiopia",onChange:y=>f(v=>({...v,headlineLine2:y.target.value}))})'
    ']}'
    ']}),'
    'i.jsxs("div",{className:"space-y-4",children:['
    'i.jsx(me,{className:"text-base",children:"Hero images (4)"}),'
    'i.jsx("p",{className:"text-sm text-brown-muted",children:"These rotate in the carousel at the bottom of the hero."}),'
    'four.map((y,v)=>i.jsx(Ke,{className:"p-4",children:i.jsxs("div",{className:"grid grid-cols-1 gap-4 md:grid-cols-2",children:['
    'i.jsxs("div",{className:"space-y-2",children:['
    'i.jsxs(me,{children:["Image ",v+1," alt text"]}),'
    'i.jsx(J,{value:y.alt||"",onChange:S=>setSlide(v,{alt:S.target.value})})'
    ']}),'
    'i.jsx(Fn,{label:"Image "+(v+1),value:y.src||"",onChange:S=>setSlide(v,{src:S}),aspect:"square"})'
    ']})},v))'
    ']}'
    ']}'
    ')]})}'
)

INSERT_BEFORE = "const Hm=[{key:\"categories\""
T5_OLD = ':u==="catering"?i.jsx(c7,{section:g,onSave:h}):i.jsx(n5,{section:g,onSave:h})'
T5_NEW = ':u==="catering"?i.jsx(c7,{section:g,onSave:h}):u==="hero"?i.jsx(h7,{section:g,onSave:h}):i.jsx(n5,{section:g,onSave:h})'


def patch_file(path: Path) -> None:
    text = path.read_text(encoding="utf-8")

    if "function h7(" in text:
        print(f"Already patched: {path.relative_to(ROOT)}")
        return

    if INSERT_BEFORE not in text:
        raise SystemExit(f"Insert anchor not found in {path}")

    if T5_OLD not in text:
        raise SystemExit(f"t5 conditional not found in {path}")

    text = text.replace(INSERT_BEFORE, H7 + INSERT_BEFORE, 1)
    text = text.replace(T5_OLD, T5_NEW, 1)
    path.write_text(text, encoding="utf-8")
    print(f"Patched {path.relative_to(ROOT)}")


def bump_cache() -> None:
    html = INDEX_HTML.read_text(encoding="utf-8")
    import re

    match = re.search(r"\?v=(\d+)", html)
    if not match:
        raise SystemExit("Cache version not found")
    current = int(match.group(1))
    INDEX_HTML.write_text(html.replace(f"?v={current}", f"?v={current + 1}", 1), encoding="utf-8")
    print(f"Bumped admin cache bust to v={current + 1}")


def main() -> None:
    for path in BUNDLE_PATHS:
        if path.exists():
            patch_file(path)
    bump_cache()


if __name__ == "__main__":
    main()
