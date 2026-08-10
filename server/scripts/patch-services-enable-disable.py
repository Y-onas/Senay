#!/usr/bin/env python3
"""Remove Visible toggle from services list; improve Enable/Disable on service edit."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BUNDLE_PATHS = [
    ROOT / "app/public/st-hq/assets/index-Ddcqtvm3.js",
    ROOT / "admin/dist/assets/index-Ddcqtvm3.js",
    ROOT / "app/dist/st-hq/assets/index-Ddcqtvm3.js",
]
INDEX_HTML = ROOT / "app/public/st-hq/index.html"

REMOVE_TOGGLE_HANDLER = ',h=async g=>{await ti.update(g.id,{enabled:!g.enabled}),await m()}'

OLD_LIST_FOOTER = (
    'i.jsxs("div",{className:"mt-5 flex items-center justify-between border-t border-border/60 pt-4",'
    'children:[i.jsxs("label",{className:"flex cursor-pointer items-center gap-2 text-sm text-brown-muted",'
    'children:[i.jsx(rn,{checked:g.enabled,onCheckedChange:()=>h(g)}),"Visible"]}),'
    'i.jsxs(ci,{to:`/services/${g.id}`,className:"inline-flex items-center gap-2 rounded-full bg-burgundy px-4 py-2 text-sm font-semibold text-cream transition-colors hover:bg-burgundy-light",'
    'children:[i.jsx(gb,{className:"h-4 w-4"})," Manage"]})]})'
)

NEW_LIST_FOOTER = (
    'i.jsx("div",{className:"mt-5 flex items-center justify-end border-t border-border/60 pt-4",'
    'children:i.jsxs(ci,{to:`/services/${g.id}`,className:"inline-flex items-center gap-2 rounded-full bg-burgundy px-4 py-2 text-sm font-semibold text-cream transition-colors hover:bg-burgundy-light",'
    'children:[i.jsx(gb,{className:"h-4 w-4"})," Manage"]})})'
)

OLD_EDIT_TOGGLE = (
    'i.jsxs("label",{className:"flex cursor-pointer items-center gap-2 rounded-xl border border-border/70 bg-muted/30 px-3 py-2.5 text-sm",'
    'children:[i.jsx(rn,{checked:l.enabled,onCheckedChange:H=>r({...l,enabled:H})}),'
    'i.jsx("span",{className:"text-brown",children:"Service enabled"})]})'
)

NEW_EDIT_TOGGLE = (
    'i.jsxs("div",{className:"rounded-xl border border-border/70 bg-muted/30 px-3 py-3",'
    'children:i.jsxs("label",{className:"flex cursor-pointer items-start justify-between gap-4",'
    'children:[i.jsxs("div",{children:[i.jsx("span",{className:"text-sm font-medium text-brown",children:"Enable on website"}),'
    'i.jsx("p",{className:"mt-1 text-[11px] leading-relaxed text-brown-muted",'
    'children:"When disabled and saved, this service is removed from navigation, footer, listings, and direct page access."})]}),'
    'i.jsx(rn,{checked:l.enabled,onCheckedChange:H=>r({...l,enabled:H})})]})})'
)


def patch_file(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    original = text

    if REMOVE_TOGGLE_HANDLER in text:
        text = text.replace(REMOVE_TOGGLE_HANDLER, "", 1)
    elif ",h=async g=>" in text:
        raise SystemExit(f"Toggle handler pattern changed in {path}")

    if OLD_LIST_FOOTER not in text:
        raise SystemExit(f"Services list footer pattern not found in {path}")
    text = text.replace(OLD_LIST_FOOTER, NEW_LIST_FOOTER, 1)

    if OLD_EDIT_TOGGLE not in text:
        raise SystemExit(f"Service edit toggle pattern not found in {path}")
    text = text.replace(OLD_EDIT_TOGGLE, NEW_EDIT_TOGGLE, 1)

    if text == original:
        raise SystemExit(f"No changes applied to {path}")

    path.write_text(text, encoding="utf-8")
    print(f"Patched {path.relative_to(ROOT)}")


def bump_cache() -> None:
    html = INDEX_HTML.read_text(encoding="utf-8")
    import re

    match = re.search(r"\?v=(\d+)", html)
    if not match:
        raise SystemExit("Cache version not found in index.html")
    current = int(match.group(1))
    updated = html.replace(f"?v={current}", f"?v={current + 1}", 1)
    INDEX_HTML.write_text(updated, encoding="utf-8")
    print(f"Bumped admin cache bust to v={current + 1}")


def main() -> None:
    for path in BUNDLE_PATHS:
        if not path.exists():
            print(f"Skipping missing bundle: {path}")
            continue
        patch_file(path)
    bump_cache()


if __name__ == "__main__":
    main()
