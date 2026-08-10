/**
 * Copy Vite build into server/public/site and stage admin at /st-hq.
 * Run from repo root: node server/scripts/prepare-railway-site.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const appDist = path.join(root, "app", "dist");
const adminDist = path.join(root, "admin", "dist");
const siteRoot = path.join(root, "server", "public", "site");
const adminTarget = path.join(siteRoot, "st-hq");

if (!fs.existsSync(appDist)) {
  console.error("Missing app/dist — run `npm run build --prefix app` first.");
  process.exit(1);
}

if (!fs.existsSync(path.join(adminDist, "index.html"))) {
  console.error("Missing admin/dist — run `npm run build --prefix admin` first.");
  process.exit(1);
}

fs.rmSync(siteRoot, { recursive: true, force: true });
fs.mkdirSync(adminTarget, { recursive: true });
fs.cpSync(appDist, siteRoot, { recursive: true });

fs.cpSync(path.join(adminDist, "index.html"), path.join(adminTarget, "index.html"));
fs.cpSync(path.join(adminDist, "assets"), path.join(adminTarget, "assets"), { recursive: true });

const loginBundleDir = path.join(adminDist, "st-hq");
const loginPublicDir = path.join(root, "admin", "public", "st-hq");
for (const name of ["login.html", "login.js", "login.css"]) {
  const fromDist = path.join(loginBundleDir, name);
  const fromPublic = path.join(loginPublicDir, name);
  const src = fs.existsSync(fromDist) ? fromDist : fromPublic;
  if (fs.existsSync(src)) fs.cpSync(src, path.join(adminTarget, name));
}

console.log(`Prepared ${path.relative(root, siteRoot)} from app/dist + admin/dist`);
