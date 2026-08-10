#!/usr/bin/env python3
"""Inject or replace Contact Us admin editor in admin bundles."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EDITOR = ROOT / "server" / "scripts" / "contact-editor-h6.js"
BUNDLE_PATHS = [
    ROOT / "app" / "public" / "st-hq" / "assets" / "index-Ddcqtvm3.js",
    ROOT / "admin" / "dist" / "assets" / "index-Ddcqtvm3.js",
]

new_h6 = re.sub(r"\s+", " ", EDITOR.read_text(encoding="utf-8").strip())

SIDEBAR_OLD = '{to:"/about",icon:hb,label:"About Us"},{to:"/gallery",icon:Sc,label:"Gallery"}'
SIDEBAR_NEW = '{to:"/about",icon:hb,label:"About Us"},{to:"/contact",icon:pb,label:"Contact Us"},{to:"/gallery",icon:Sc,label:"Gallery"}'

ROUTE_OLD = 'i.jsx(Ut,{path:"about",element:i.jsx(w6,{})}),i.jsx(Ut,{path:"gallery",element:i.jsx(y6,{})})'
ROUTE_NEW = 'i.jsx(Ut,{path:"about",element:i.jsx(w6,{})}),i.jsx(Ut,{path:"contact",element:i.jsx(h6,{})}),i.jsx(Ut,{path:"gallery",element:i.jsx(y6,{})})'

for path in BUNDLE_PATHS:
    text = path.read_text(encoding="utf-8")

    if "function h6()" in text:
        text = re.sub(r"function h6\(\).*?(?=function a5\(\))", new_h6, text, count=1, flags=re.DOTALL)
    else:
        text = text.replace("function a5(){", new_h6 + "function a5(){", 1)

    if SIDEBAR_OLD in text and SIDEBAR_NEW not in text:
        text = text.replace(SIDEBAR_OLD, SIDEBAR_NEW, 1)

    if ROUTE_OLD in text and 'path:"contact"' not in text:
        text = text.replace(ROUTE_OLD, ROUTE_NEW, 1)

    path.write_text(text, encoding="utf-8")
    print(f"patched {path}")
