#!/usr/bin/env python3
"""Replace w6() redirect with About page settings editor in admin bundles."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EDITOR = ROOT / "server" / "scripts" / "about-editor-w6.js"
BUNDLE_PATHS = [
    ROOT / "app" / "public" / "st-hq" / "assets" / "index-Ddcqtvm3.js",
    ROOT / "admin" / "dist" / "assets" / "index-Ddcqtvm3.js",
]

new_w6 = re.sub(r"\s+", " ", EDITOR.read_text(encoding="utf-8").strip())

for path in BUNDLE_PATHS:
    text = path.read_text(encoding="utf-8")
    match = re.search(r"function w6\(\).*?(function a5\(\))", text, re.DOTALL)
    if not match:
        raise SystemExit(f"Could not find w6() in {path}")
    updated = text[: match.start()] + new_w6 + match.group(1) + text[match.end() :]
    path.write_text(updated, encoding="utf-8")
    print(f"patched {path}")
