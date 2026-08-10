/**
 * Patch st-hq sidebar to hide System / Telegram / Catalog from Content Management role.
 * Also refreshes Admins page + invite roles API.
 * Run from repo root: node server/scripts/patch-role-access.mjs
 */
import fs from "fs";
import path from "path";

const root = process.cwd();

const OLD_SIDEBAR =
  'const wb=[{label:"Content",items:[{to:"/",icon:LC,label:"Dashboard"},{to:"/media",icon:Sc,label:"Media Library"},{to:"/home-sections",icon:TC,label:"Home"},{to:"/about",icon:hb,label:"About Us"},{to:"/contact",icon:pb,label:"Contact Us"},{to:"/gallery",icon:Sc,label:"Gallery"},{to:"/blog",icon:eC,label:"Blog"},{to:"/testimonials",icon:gE,label:"Testimonials"},{to:"/faqs",icon:pb,label:"FAQ"}]},{label:"Site",items:[{to:"/navigation",icon:hC,label:"Navigation"},{to:"/footer",icon:bC,label:"Footer"},{to:"/menu-items",icon:fE,label:"Menu Items"}]},{label:"Catalog",items:[{to:"/services",icon:db,label:"Services"}]},{label:"Telegram",items:[{to:"/telegram",icon:mr,label:"Bot"},{to:"/telegram/users",icon:pb,label:"Users"}]},{label:"System",items:[{to:"/admins",icon:mr,label:"Admins"},{to:"/requests",icon:mr,label:"Requests"},{to:"/announcements",icon:XC,label:"Announcements"},{to:"/contact-messages",icon:pb,label:"Contact Messages"},{to:"/settings",icon:rE,label:"Settings"}]}]';

const NEW_SIDEBAR =
  'const wb=[{label:"Content",access:["overview.read","content.read","content.manage"],items:[{to:"/",icon:LC,label:"Dashboard"},{to:"/media",icon:Sc,label:"Media Library"},{to:"/home-sections",icon:TC,label:"Home"},{to:"/about",icon:hb,label:"About Us"},{to:"/contact",icon:pb,label:"Contact Us"},{to:"/gallery",icon:Sc,label:"Gallery"},{to:"/blog",icon:eC,label:"Blog"},{to:"/testimonials",icon:gE,label:"Testimonials"},{to:"/faqs",icon:pb,label:"FAQ"}]},{label:"Site",access:["content.read","content.manage"],items:[{to:"/navigation",icon:hC,label:"Navigation"},{to:"/footer",icon:bC,label:"Footer"},{to:"/menu-items",icon:fE,label:"Menu Items"}]},{label:"Catalog",access:["services.read","services.manage","packages.read","packages.manage"],items:[{to:"/services",icon:db,label:"Services"}]},{label:"Telegram",access:["telegram.manage"],items:[{to:"/telegram",icon:mr,label:"Bot"},{to:"/telegram/users",icon:pb,label:"Users"}]},{label:"System",access:["admins.read","admins.manage","requests.read","settings.manage","notifications.read"],items:[{to:"/admins",icon:mr,label:"Admins"},{to:"/requests",icon:mr,label:"Requests"},{to:"/announcements",icon:XC,label:"Announcements"},{to:"/contact-messages",icon:pb,label:"Contact Messages"},{to:"/settings",icon:rE,label:"Settings"}]}]';

const OLD_TX_START = "function tx({onNavigate:n}){return i.jsxs";

const NEW_TX = `function tx({onNavigate:n}){const{admin:r,hasPermission:o}=If();const u=wb.map(f=>({...f,items:f.items.filter(m=>!f.access||f.access.some(p=>o(p)))})).filter(f=>f.items.length);return i.jsxs`;

const OLD_VE = "VE=wb.flatMap(n=>n.items);";
const NEW_VE =
  'VE=wb.flatMap(n=>n.items);function canAccessPath(n,l){const r=wb.find(o=>o.items.some(u=>u.to===n||n.startsWith(u.to+"/")||u.to!=="/"&&n.startsWith(u.to)));if(!r||!r.access)return!0;return r.access.some(o=>l(o))}';

const OLD_API_ROLES =
  'roles:()=>ae.get("/admin/roles")}';
const NEW_API_ROLES =
  'roles:()=>ae.get("/admin/roles?invite=1")}';

// Prefer invite=1 if already present from earlier patch
const ALT_API =
  'admins:{list:()=>ae.get("/admin/admins"),create:n=>ae.post("/admin/admins",n),update:(n,l)=>ae.patch(`/admin/admins/${n}`,l),delete:n=>ae.delete(`/admin/admins/${n}`),roles:()=>ae.get("/admin/roles")},bot:';
const ALT_API_NEW =
  'admins:{list:()=>ae.get("/admin/admins"),create:n=>ae.post("/admin/admins",n),update:(n,l)=>ae.patch(`/admin/admins/${n}`,l),delete:n=>ae.delete(`/admin/admins/${n}`),roles:()=>ae.get("/admin/roles?invite=1")},bot:';

const bundlePaths = [
  "app/public/st-hq/assets/index-Ddcqtvm3.js",
  "admin/dist/assets/index-Ddcqtvm3.js",
  "app/dist/st-hq/assets/index-Ddcqtvm3.js",
]
  .map((p) => path.join(root, p))
  .filter((p) => fs.existsSync(p));

for (const bundlePath of bundlePaths) {
  let text = fs.readFileSync(bundlePath, "utf8");

  if (text.includes(OLD_SIDEBAR)) {
    text = text.replace(OLD_SIDEBAR, NEW_SIDEBAR);
    console.log("sidebar", path.relative(root, bundlePath));
  } else if (!text.includes('access:["overview.read"')) {
    console.error("sidebar pattern missing", bundlePath);
    process.exit(1);
  }

  if (text.includes(OLD_TX_START) && !text.includes("hasPermission:o}=If()")) {
    text = text.replace(OLD_TX_START, NEW_TX);
    console.log("tx filter", path.relative(root, bundlePath));
  }

  if (text.includes(OLD_VE) && !text.includes("function canAccessPath")) {
    text = text.replace(OLD_VE, NEW_VE);
    console.log("canAccessPath", path.relative(root, bundlePath));
  }

  if (text.includes(ALT_API)) {
    text = text.replace(ALT_API, ALT_API_NEW);
    console.log("roles invite api", path.relative(root, bundlePath));
  } else if (text.includes(OLD_API_ROLES) && !text.includes("/admin/roles?invite=1")) {
    text = text.replace(OLD_API_ROLES, NEW_API_ROLES);
    console.log("roles invite api2", path.relative(root, bundlePath));
  }

  fs.writeFileSync(bundlePath, text);
}

// Refresh A7 from source via existing patcher
const { spawnSync } = await import("child_process");
const r = spawnSync("node", ["server/scripts/patch-admins-page.mjs"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});
if (r.status !== 0) process.exit(r.status || 1);
console.log("done");
