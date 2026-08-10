/**
 * Replace window.confirm() in the admin bundle with styled adminConfirm() dialogs.
 * Run from repo root: node server/scripts/patch-admin-confirm-dialog.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

const BUNDLES = [
  "app/public/st-hq/assets/index-Ddcqtvm3.js",
  "admin/dist/assets/index-Ddcqtvm3.js",
  "app/dist/st-hq/assets/index-Ddcqtvm3.js",
];

const INDEX_HTML = "app/public/st-hq/index.html";

const REPLACEMENTS = [
  {
    from: 'confirm("Delete this block?")',
    to: 'await adminConfirm({title:"Delete this block?",description:"This block will be removed from the page. This cannot be undone.",confirmLabel:"Delete block"})',
  },
  {
    from: 'confirm("Delete FAQ?")',
    to: 'await adminConfirm({title:"Delete FAQ?",description:"This question and answer will be permanently removed from the site.",confirmLabel:"Delete FAQ"})',
  },
  {
    from: 'confirm(pending?"Reject this guest review?":"Delete testimonial?")',
    to: 'await adminConfirm(pending?{title:"Reject guest review?",description:"This review will be hidden from the website.",confirmLabel:"Reject review"}:{title:"Delete testimonial?",description:"This testimonial will be permanently removed.",confirmLabel:"Delete testimonial"})',
  },
  {
    from: 'confirm("Delete navigation item?")',
    to: 'await adminConfirm({title:"Delete navigation link?",description:"This menu link will be removed from the site header.",confirmLabel:"Delete link"})',
  },
  {
    from: 'confirm("Delete menu item?")',
    to: 'await adminConfirm({title:"Delete menu item?",description:"This dish will be removed from the menu.",confirmLabel:"Delete item"})',
  },
  {
    from: 'if(!confirm("Delete this article?"))return;',
    to: 'if(!(await adminConfirm({title:"Delete article?",description:"This blog post will be permanently removed.",confirmLabel:"Delete article"})))return;',
  },
  {
    from: 'confirm("Delete announcement?")',
    to: 'await adminConfirm({title:"Delete announcement?",description:"This site-wide banner will be removed.",confirmLabel:"Delete announcement"})',
  },
  {
    from: 'confirm("Delete message?")',
    to: 'await adminConfirm({title:"Delete message?",description:"This contact message will be permanently removed.",confirmLabel:"Delete message"})',
  },
  {
    from: 'if(!confirm(`Remove admin access for ${a.email}?`))return;',
    to: 'if(!(await adminConfirm({title:"Remove admin access?",description:`${a.email} will no longer be able to sign in to the admin panel.`,confirmLabel:"Remove access"})))return;',
  },
  {
    from: 'confirm("Delete catalog item?")',
    to: 'await adminConfirm({title:"Delete catalog item?",description:"This product or package will be permanently removed from the service.",confirmLabel:"Delete item"})',
  },
  {
    from: 'if(confirm("Upload all images from the website public/images folder to Cloudinary and update existing content URLs?"))',
    to: 'if(await adminConfirm({title:"Import public images?",description:"Upload all images from public/images to Cloudinary and update existing content URLs. This may take a minute.",confirmLabel:"Start import",variant:"default"}))',
  },
  {
    from: "T=async C=>{await Wl.delete(C),l(R=>R.filter(A=>A.id!==C))",
    to: 'T=async C=>{if(!(await adminConfirm({title:"Delete media file?",description:"This file will be removed from the media library. Content still using this URL may show broken images.",confirmLabel:"Delete file"})))return;await Wl.delete(C),l(R=>R.filter(A=>A.id!==C)',
  },
];

function patchBundle(relPath) {
  const file = path.join(ROOT, relPath);
  if (!fs.existsSync(file)) {
    console.warn("Skip missing bundle:", relPath);
    return false;
  }

  let text = fs.readFileSync(file, "utf8");
  let changed = false;

  for (const { from, to } of REPLACEMENTS) {
    if (!text.includes(from)) continue;
    text = text.split(from).join(to);
    changed = true;
    console.log("  replaced:", from.slice(0, 60) + "...");
  }

  if (changed) {
    fs.writeFileSync(file, text);
    console.log("Updated", relPath);
  } else {
    console.log("No changes needed in", relPath);
  }

  return changed;
}

function patchIndexHtml() {
  const file = path.join(ROOT, INDEX_HTML);
  if (!fs.existsSync(file)) {
    console.warn("Missing", INDEX_HTML);
    return;
  }

  let html = fs.readFileSync(file, "utf8");
  if (html.includes("admin-confirm.js")) {
    const match = html.match(/admin-confirm\.js\?v=(\d+)/);
    if (match) {
      const v = Number(match[1]) + 1;
      html = html.replace(`admin-confirm.js?v=${match[1]}`, `admin-confirm.js?v=${v}`);
    }
  } else {
    html = html.replace(
      '<script type="module" crossorigin src="/st-hq/assets/index-Ddcqtvm3.js',
      '<script src="/st-hq/assets/admin-confirm.js?v=1"></script>\n    <script type="module" crossorigin src="/st-hq/assets/index-Ddcqtvm3.js',
    );
  }

  const mainMatch = html.match(/index-Ddcqtvm3\.js\?v=(\d+)/);
  if (mainMatch) {
    const v = Number(mainMatch[1]) + 1;
    html = html.replace(`?v=${mainMatch[1]}`, `?v=${v}`);
  }

  fs.writeFileSync(file, html);
  console.log("Updated", INDEX_HTML);
}

function patchSourceFiles() {
  const sourceReplacements = REPLACEMENTS.filter(
    (r) => !r.from.startsWith("T=async") && !r.from.includes("Upload all images"),
  );

  const sources = [
    "server/scripts/faq-editor-g6.source.js",
    "server/scripts/navigation-admin.source.js",
    "server/scripts/blog-editor-c5.js",
    "server/scripts/admins-page-a7.js",
  ];

  for (const rel of sources) {
    const file = path.join(ROOT, rel);
    if (!fs.existsSync(file)) continue;
    let text = fs.readFileSync(file, "utf8");
    let changed = false;
    for (const { from, to } of sourceReplacements) {
      const sourceFrom = from.replace('confirm("', "confirm('").replace('")', "')");
      const sourceTo = to;
      if (text.includes(from)) {
        text = text.split(from).join(to);
        changed = true;
      } else if (text.includes(sourceFrom)) {
        text = text.split(sourceFrom).join(sourceTo.replace(/"/g, "'"));
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(file, text);
      console.log("Updated source", rel);
    }
  }
}

console.log("Patching admin confirm dialogs...");
for (const bundle of BUNDLES) patchBundle(bundle);
patchIndexHtml();
patchSourceFiles();
console.log("Done.");
