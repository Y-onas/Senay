/**
 * Replace st-hq blog editor (function c5) with bilingual EN/AM version.
 * Run from repo root: node server/scripts/patch-blog-editor-i18n.mjs
 */
import fs from "fs";
import path from "path";

const root = process.cwd();
const sourcePath = path.join(root, "server/scripts/blog-editor-c5.js");
let source = fs.readFileSync(sourcePath, "utf8");
source = source.replace(/^\/\*[\s\S]*?\*\/\s*/, "");
if (!source.startsWith("function c5(")) {
  console.error("blog-editor-c5.js must start with function c5(");
  process.exit(1);
}
const c5Source = source.slice(0, source.lastIndexOf("}") + 1);

const bundlePaths = [
  "app/public/st-hq/assets/index-Ddcqtvm3.js",
  "admin/dist/assets/index-Ddcqtvm3.js",
  "app/dist/st-hq/assets/index-Ddcqtvm3.js",
]
  .map((p) => path.join(root, p))
  .filter((p) => fs.existsSync(p));

if (!bundlePaths.length) {
  console.error("No admin bundles found");
  process.exit(1);
}

for (const bundlePath of bundlePaths) {
  let text = fs.readFileSync(bundlePath, "utf8");
  const start = text.indexOf("function c5(");
  const end = text.indexOf("function u5(", start);
  if (start < 0 || end < 0) {
    console.error("c5/u5 not found in", bundlePath);
    process.exit(1);
  }
  text = text.slice(0, start) + c5Source + "\n" + text.slice(end);
  fs.writeFileSync(bundlePath, text);
  console.log("patched", path.relative(root, bundlePath));
}
