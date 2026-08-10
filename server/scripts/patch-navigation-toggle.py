#!/usr/bin/env python3
"""Auto-save navigation visibility toggle in admin bundle."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BUNDLE_PATHS = [
    ROOT / "app" / "public" / "st-hq" / "assets" / "index-Ddcqtvm3.js",
    ROOT / "admin" / "dist" / "assets" / "index-Ddcqtvm3.js",
]

OLD = (
    'i.jsx(rn,{checked:p.enabled,onCheckedChange:h=>l(g=>g.map(y=>y.id===p.id?{...y,enabled:h}:y))}),'
    'i.jsx(me,{className:"mb-0",children:"Enabled"})'
)
NEW = (
    'i.jsx(rn,{checked:p.enabled,onCheckedChange:async h=>{const next={...p,enabled:h};'
    'l(g=>g.map(y=>y.id===p.id?next:y));await u(next)}}),'
    'i.jsx(me,{className:"mb-0",children:"Visible on site"})'
)

for path in BUNDLE_PATHS:
    text = path.read_text(encoding="utf-8")
    if OLD not in text:
        raise SystemExit(f"navigation toggle anchor not found in {path}")
    path.write_text(text.replace(OLD, NEW, 1), encoding="utf-8")
    print(f"patched {path}")
