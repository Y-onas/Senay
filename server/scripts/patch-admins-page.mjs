/**
 * Patch st-hq admin bundle: System → Admins CRUD (name + email for Clerk).
 * Run from repo root: node server/scripts/patch-admins-page.mjs
 */
import fs from "fs";
import path from "path";

const root = process.cwd();
const sourcePath = path.join(root, "server/scripts/admins-page-a7.js");
let source = fs.readFileSync(sourcePath, "utf8");
source = source.replace(/^\/\*[\s\S]*?\*\/\s*/, "");
if (!source.startsWith("function A7(")) {
  console.error("admins-page-a7.js must start with function A7(");
  process.exit(1);
}
const a7Source = source.slice(0, source.lastIndexOf("}") + 1);

const OLD_SIDEBAR_SYSTEM =
  '{label:"System",items:[{to:"/requests",icon:mr,label:"Requests"},{to:"/announcements",icon:XC,label:"Announcements"},{to:"/contact-messages",icon:pb,label:"Contact Messages"},{to:"/settings",icon:rE,label:"Settings"}]}';

const NEW_SIDEBAR_SYSTEM =
  '{label:"System",items:[{to:"/admins",icon:mr,label:"Admins"},{to:"/requests",icon:mr,label:"Requests"},{to:"/announcements",icon:XC,label:"Announcements"},{to:"/contact-messages",icon:pb,label:"Contact Messages"},{to:"/settings",icon:rE,label:"Settings"}]}';

const OLD_API_SETTINGS =
  'settings:{get:n=>ae.get(`/admin/settings/${n}`),update:(n,l)=>ae.put(`/admin/settings/${n}`,{value:l})},bot:';

const NEW_API_SETTINGS =
  'settings:{get:n=>ae.get(`/admin/settings/${n}`),update:(n,l)=>ae.put(`/admin/settings/${n}`,{value:l})},admins:{list:()=>ae.get("/admin/admins"),create:n=>ae.post("/admin/admins",n),update:(n,l)=>ae.patch(`/admin/admins/${n}`,l),delete:n=>ae.delete(`/admin/admins/${n}`),roles:()=>ae.get("/admin/roles?invite=1")},bot:';

const OLD_ROUTE =
  'i.jsx(Ut,{path:"settings",element:i.jsx(f5,{})})';

const NEW_ROUTE =
  'i.jsx(Ut,{path:"admins",element:i.jsx(A7,{})}),i.jsx(Ut,{path:"settings",element:i.jsx(f5,{})})';

const INSERT_BEFORE = "function f5(";

const bundlePaths = [
  "app/public/st-hq/assets/index-Ddcqtvm3.js",
  "admin/dist/assets/index-Ddcqtvm3.js",
  "app/dist/st-hq/assets/index-Ddcqtvm3.js",
]
  .map((p) => path.join(root, p))
  .filter((p) => fs.existsSync(p));

for (const bundlePath of bundlePaths) {
  let text = fs.readFileSync(bundlePath, "utf8");

  if (!text.includes('to:"/admins"')) {
    if (!text.includes(OLD_SIDEBAR_SYSTEM)) {
      console.warn("sidebar System block not found (may already be patched)", path.relative(root, bundlePath));
    } else {
      text = text.replace(OLD_SIDEBAR_SYSTEM, NEW_SIDEBAR_SYSTEM);
    }
  }

  if (!text.includes('admins:{list:()=>ae.get("/admin/admins")')) {
    if (!text.includes(OLD_API_SETTINGS)) {
      console.error("settings API block not found in", bundlePath);
      process.exit(1);
    }
    text = text.replace(OLD_API_SETTINGS, NEW_API_SETTINGS);
  }

  if (!text.includes('path:"admins"')) {
    if (!text.includes(OLD_ROUTE)) {
      console.error("settings route not found in", bundlePath);
      process.exit(1);
    }
    text = text.replace(OLD_ROUTE, NEW_ROUTE);
  }

  if (!text.includes("function A7(")) {
    if (!text.includes(INSERT_BEFORE)) {
      console.error("f5 insert anchor not found in", bundlePath);
      process.exit(1);
    }
    text = text.replace(INSERT_BEFORE, a7Source + "\n" + INSERT_BEFORE);
  } else {
    const start = text.indexOf("function A7(");
    const end = text.indexOf("function f5(", start);
    if (start >= 0 && end > start) {
      text = text.slice(0, start) + a7Source + "\n" + text.slice(end);
    }
  }

  fs.writeFileSync(bundlePath, text);
  console.log("patched", path.relative(root, bundlePath));
}
