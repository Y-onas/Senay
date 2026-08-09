import "dotenv/config";
import {
  PrismaClient,
  CatalogItemKind,
  ContentLanguage,
  NavigationLocation,
  CategoryType,
  PageStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PERMISSIONS = [
  { code: "overview.read", description: "View dashboard overview" },
  { code: "requests.read", description: "View service requests" },
  { code: "requests.update", description: "Update request status and notes" },
  { code: "requests.assign", description: "Assign requests to staff" },
  { code: "services.read", description: "View services" },
  { code: "services.manage", description: "Create, edit, enable, reorder services" },
  { code: "packages.read", description: "View packages and products" },
  { code: "packages.manage", description: "Manage catalog items" },
  { code: "content.read", description: "View CMS content" },
  { code: "content.manage", description: "Edit site pages, media, FAQs, gallery, blog" },
  { code: "telegram.manage", description: "Manage Telegram bot, menus, and users" },
  { code: "admins.read", description: "View administrators" },
  { code: "admins.manage", description: "Create, edit, disable admins and reset passwords" },
  { code: "roles.manage", description: "Manage roles and permissions" },
  { code: "notifications.read", description: "View notifications" },
  { code: "settings.manage", description: "Edit system settings" },
] as const;

/** Roles shown in System → Admins invite UI. */
export const INVITE_ROLE_NAMES = ["Super Admin", "Content Management"] as const;

async function seedPermissions() {
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: p.code },
      create: p,
      update: { description: p.description },
    });
  }
  return prisma.permission.findMany();
}

async function seedRoles(allPermissionIds: string[]) {
  const superAdmin = await prisma.role.upsert({
    where: { name: "Super Admin" },
    create: {
      name: "Super Admin",
      description: "Full access to System, Telegram, Catalog, and content",
      isSystem: true,
    },
    update: {
      description: "Full access to System, Telegram, Catalog, and content",
    },
  });

  const contentManagement = await prisma.role.upsert({
    where: { name: "Content Management" },
    create: {
      name: "Content Management",
      description: "Edit site and content only — no System, Telegram, or Catalog",
      isSystem: true,
    },
    update: {
      description: "Edit site and content only — no System, Telegram, or Catalog",
    },
  });

  // Keep legacy roles for existing rows; they are not offered in the invite UI.
  const manager = await prisma.role.upsert({
    where: { name: "Manager" },
    create: {
      name: "Manager",
      description: "Legacy operations role",
      isSystem: true,
    },
    update: {},
  });

  const staff = await prisma.role.upsert({
    where: { name: "Staff" },
    create: {
      name: "Staff",
      description: "Legacy request-handling role",
      isSystem: true,
    },
    update: {},
  });

  const perms = await prisma.permission.findMany();
  const byCode = Object.fromEntries(perms.map((p) => [p.code, p.id]));

  // Super Admin → all
  for (const permissionId of allPermissionIds) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdmin.id, permissionId } },
      create: { roleId: superAdmin.id, permissionId },
      update: {},
    });
  }

  const contentCodes = ["overview.read", "content.read", "content.manage"] as const;

  // Reset Content Management perms to the allow-list (remove any extras).
  await prisma.rolePermission.deleteMany({
    where: {
      roleId: contentManagement.id,
      permissionId: { notIn: contentCodes.map((code) => byCode[code]).filter(Boolean) },
    },
  });
  for (const code of contentCodes) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: contentManagement.id,
          permissionId: byCode[code],
        },
      },
      create: { roleId: contentManagement.id, permissionId: byCode[code] },
      update: {},
    });
  }

  const managerCodes = PERMISSIONS.map((p) => p.code).filter(
    (c) => !c.startsWith("admins.") && c !== "roles.manage" && c !== "telegram.manage",
  );
  const staffCodes = [
    "overview.read",
    "requests.read",
    "requests.update",
    "services.read",
    "packages.read",
    "content.read",
    "notifications.read",
  ];

  for (const code of managerCodes) {
    if (!byCode[code]) continue;
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: manager.id, permissionId: byCode[code] },
      },
      create: { roleId: manager.id, permissionId: byCode[code] },
      update: {},
    });
  }

  for (const code of staffCodes) {
    if (!byCode[code]) continue;
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: staff.id, permissionId: byCode[code] },
      },
      create: { roleId: staff.id, permissionId: byCode[code] },
      update: {},
    });
  }

  return { superAdmin, contentManagement, manager, staff };
}

async function seedAdmin(roleId: string) {
  /**
   * Admins are never hardcoded. Optional seed from env only:
   *   ADMIN_SEED_EMAILS=one@example.com,two@example.com
   *   ADMIN_SEED_NAME=Super Admin   (optional; applied to every seeded email)
   * Prefer inviting people later via System → Admins.
   */
  const raw =
    process.env.ADMIN_SEED_EMAILS?.trim() ||
    process.env.ADMIN_BOOTSTRAP_EMAILS?.trim() ||
    "";
  const emails = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!emails.length) {
    console.log(
      "No ADMIN_SEED_EMAILS set — skipping admin seed. Add admins under System → Admins.",
    );
    return;
  }

  const defaultName = process.env.ADMIN_SEED_NAME?.trim() || "Admin";

  for (const email of emails) {
    const passwordHash = await bcrypt.hash(
      `clerk-seed:${email}:${crypto.randomUUID()}`,
      12,
    );
    const local = email.split("@")[0] || defaultName;
    await prisma.admin.upsert({
      where: { email },
      create: {
        name: defaultName === "Admin" ? local : defaultName,
        email,
        passwordHash,
        roleId,
        status: "ACTIVE",
      },
      update: { roleId, status: "ACTIVE" },
    });
  }
  console.log(`Seeded ${emails.length} admin account(s) from env.`);
}

async function seedServices() {
  const defs = [
    {
      slug: "catering",
      name: "Catering",
      description: "Full-service Ethiopian catering for events of any size.",
      descriptionI18n: {
        en: "Full-service Ethiopian catering for events of any size.",
        am: "ለכל መጠን ዝግጅት ሙሉ የኢትዮጵያ ኬተሪንግ አገልግሎት።",
      },
      image: "/images/foodreference.png",
      sortOrder: 1,
    },
    {
      slug: "baltina",
      name: "Baltina",
      description: "House-made spices, flours, and traditional pantry mixes.",
      descriptionI18n: {
        en: "House-made spices, flours, and traditional pantry mixes.",
        am: "ቤት ውስጥ የተሰሩ ቅመማ ቅመሞች፣ ዱቄቶች እና ባህላዊ መጋገሪያ ድብልቆች።",
      },
      image: "/images/shiro-clean.png",
      sortOrder: 2,
    },
    {
      slug: "agelgil",
      name: "Agelgil",
      description: "Traditional woven-basket meal sets for sharing.",
      descriptionI18n: {
        en: "Traditional woven-basket meal sets for sharing.",
        am: "ለማጋራት የባህላዊ ጠባቂ ምግብ ስብስቦች።",
      },
      image: "/images/foodreference.png",
      sortOrder: 3,
    },
    {
      slug: "drinks",
      name: "Drinks",
      description: "Clay-brewed tela and tej — house fermented.",
      descriptionI18n: {
        en: "Clay-brewed tela and tej — house fermented.",
        am: "በሸክላ የተጠመቁ ጠላ እና ጠጅ — በቤቱ የተፈረሙ።",
      },
      image: "/images/tela-clean.png",
      sortOrder: 4,
    },
    {
      slug: "festival",
      name: "Festival",
      description: "Celebration packages for holidays and gatherings.",
      descriptionI18n: {
        en: "Celebration packages for holidays and gatherings.",
        am: "ለበዓላት እና ለማኅበራዊ ጉባኤዎች የአክብሮት ፓኬጆች።",
      },
      image: "/images/foodreference.png",
      sortOrder: 5,
    },
  ] as const;

  const services: Record<string, string> = {};
  for (const s of defs) {
    const row = await prisma.service.upsert({
      where: { slug: s.slug },
      create: s,
      update: {
        name: s.name,
        description: s.description,
        descriptionI18n: "descriptionI18n" in s ? s.descriptionI18n : undefined,
        image: s.image,
        sortOrder: s.sortOrder,
      },
    });
    services[s.slug] = row.id;
  }
  return services;
}

async function upsertItem(
  serviceId: string,
  data: {
    slug: string;
    kind: CatalogItemKind;
    name: string;
    nameI18n?: Record<string, string>;
    description?: string;
    price?: number;
    image?: string;
    sortOrder?: number;
    metadata?: object;
  },
) {
  await prisma.catalogItem.upsert({
    where: { serviceId_slug: { serviceId, slug: data.slug } },
    create: {
      serviceId,
      slug: data.slug,
      kind: data.kind,
      name: data.name,
      nameI18n: data.nameI18n ?? undefined,
      description: data.description ?? "",
      price: data.price,
      image: data.image,
      sortOrder: data.sortOrder ?? 0,
      metadata: data.metadata ?? {},
    },
    update: {
      kind: data.kind,
      name: data.name,
      nameI18n: data.nameI18n ?? undefined,
      description: data.description ?? "",
      price: data.price,
      image: data.image,
      sortOrder: data.sortOrder ?? 0,
      metadata: data.metadata ?? {},
    },
  });
}

async function seedCatalog(services: Record<string, string>) {
  // Baltina — from app/src/data/baltinaCatalog.ts
  const baltina = [
    {
      slug: "shiro",
      name: "Shiro",
      description:
        "Stone-ground chickpea flour blend — ready for a creamy, comforting shiro wat.",
      price: 350,
      image: "/images/shiro-clean.png",
      metadata: { unit: "kg", category: "flours", minQty: 0.5, step: 0.5 },
    },
    {
      slug: "berbere",
      name: "Berbere",
      description:
        "Sun-dried chillies hand-blended with twelve spices — the soul of Ethiopian cooking.",
      price: 400,
      image: "/images/berbere-clean.png",
      metadata: { unit: "kg", category: "spices", minQty: 0.5, step: 0.5 },
    },
    {
      slug: "besso",
      name: "Besso",
      description:
        "Roasted barley flour for traditional besso drink — nourishing and lightly sweet.",
      price: 280,
      image: "/images/besso%20powder.png",
      metadata: { unit: "kg", category: "flours", minQty: 0.5, step: 0.5 },
    },
    {
      slug: "oat-flour",
      name: "Oat Flour",
      description: "Finely milled oat flour for porridge, baking, and everyday house cooking.",
      price: 250,
      image: "/images/senay%20oats.png",
      metadata: { unit: "kg", category: "flours", minQty: 0.5, step: 0.5 },
    },
    {
      slug: "porridge-flour",
      name: "Porridge Flour",
      description: "Traditional porridge flour blend for a warm, filling breakfast.",
      price: 220,
      image: "/images/senay%20porridge.png",
      metadata: { unit: "kg", category: "flours", minQty: 0.5, step: 0.5 },
    },
    {
      slug: "tela-ahl",
      name: "Tela Ahl",
      description: "Starter mix for brewing tela at home the traditional way.",
      price: 300,
      image: "/images/tela%20ehl.png",
      metadata: { unit: "kg", category: "mixes", minQty: 0.5, step: 0.5 },
    },
  ];

  for (const [i, p] of baltina.entries()) {
    await upsertItem(services.baltina, {
      ...p,
      kind: CatalogItemKind.PRODUCT,
      sortOrder: i + 1,
    });
  }

  // Drinks — from app/src/data/drinksCatalog.ts
  await upsertItem(services.drinks, {
    slug: "tela",
    kind: CatalogItemKind.PRODUCT,
    name: "Tela",
    description: "House-fermented tela, clay-brewed.",
    price: 250,
    image: "/images/tela-clean.png",
    sortOrder: 1,
    metadata: { unit: "L", category: "all", minQty: 1, step: 1 },
  });
  await upsertItem(services.drinks, {
    slug: "tej",
    kind: CatalogItemKind.PRODUCT,
    name: "Tej",
    description: "Golden honey wine, brewed in-house.",
    price: 450,
    image: "/images/tej-clean.png",
    sortOrder: 2,
    metadata: { unit: "L", category: "all", minQty: 1, step: 1 },
  });

  // Festival — from festivalCatalog.ts
  const festival = [
    {
      slug: "grand",
      name: "Festival Grand Package",
      price: 8500,
      metadata: {
        tagline: "The full celebration — chicken, bread, cheese, oil, and a house drink.",
        badge: "Best Value",
        items: [
          { id: "chicken", label: "1 Habesha Chicken", icon: "chicken" },
          { id: "eggs", label: "12 Eggs", icon: "eggs" },
          { id: "injera", label: "10 Injera", icon: "injera" },
          { id: "bread", label: "5 kg Defo Bread", icon: "bread" },
          { id: "ayib", label: "0.5 kg Ayib (Cheese)", icon: "cheese" },
          { id: "oil", label: "2 L Traditional Oil", icon: "oil" },
          {
            id: "drink",
            label: "2 L Tej or Berz (choose one)",
            icon: "drink",
            choice: ["tej", "berz"],
          },
        ],
      },
    },
    {
      slug: "premium",
      name: "Festival Premium Package",
      price: 6500,
      metadata: {
        tagline: "Chicken feast with injera, defo bread, and ayib.",
        items: [
          { id: "chicken", label: "1 Habesha Chicken", icon: "chicken" },
          { id: "eggs", label: "12 Eggs", icon: "eggs" },
          { id: "injera", label: "10 Injera", icon: "injera" },
          { id: "bread", label: "5 kg Defo Bread", icon: "bread" },
          { id: "ayib", label: "0.5 kg Ayib (Cheese)", icon: "cheese" },
        ],
      },
    },
    {
      slug: "classic",
      name: "Festival Classic Package",
      price: 5200,
      metadata: {
        tagline: "The classic holiday trio — chicken, eggs, injera, and cheese.",
        items: [
          { id: "chicken", label: "1 Habesha Chicken", icon: "chicken" },
          { id: "eggs", label: "12 Eggs", icon: "eggs" },
          { id: "injera", label: "10 Injera", icon: "injera" },
          { id: "ayib", label: "0.5 kg Ayib (Cheese)", icon: "cheese" },
        ],
      },
    },
    {
      slug: "essential",
      name: "Festival Essential Package",
      price: 4500,
      metadata: {
        tagline: "Chicken, eggs, and injera — the essentials.",
        items: [
          { id: "chicken", label: "1 Habesha Chicken", icon: "chicken" },
          { id: "eggs", label: "12 Eggs", icon: "eggs" },
          { id: "injera", label: "10 Injera", icon: "injera" },
        ],
      },
    },
    {
      slug: "basic",
      name: "Festival Basic Package",
      price: 3500,
      metadata: {
        tagline: "A simple celebration starter.",
        items: [
          { id: "chicken", label: "1 Habesha Chicken", icon: "chicken" },
          { id: "eggs", label: "12 Eggs", icon: "eggs" },
        ],
      },
    },
  ];

  for (const [i, p] of festival.entries()) {
    await upsertItem(services.festival, {
      slug: p.slug,
      kind: CatalogItemKind.PACKAGE,
      name: p.name,
      description: (p.metadata as { tagline: string }).tagline,
      price: p.price,
      sortOrder: i + 1,
      metadata: p.metadata,
    });
  }

  // Catering — core packages from cateringCatalog.ts
  await upsertItem(services.catering, {
    slug: "fasting",
    kind: CatalogItemKind.PACKAGE,
    name: "Maed Fasting",
    description: "A complete fasting spread — fully vegan, colourful, and ready to share.",
    price: 1100,
    sortOrder: 1,
    metadata: {
      tier: "fasting",
      mealType: "fasting",
      nameAm: "ማእድ ጾም",
      fixedPricePerGuest: 1100,
      beveragePricing: {
        "food-only": 1100,
        tela: 1200,
        tej: 1450,
        "tela-tej": 1400,
        "berz-tej": 1500,
      },
      dishes: [
        "Misir Wat (Red Lentils)",
        "Kik Alicha (Split Peas)",
        "Shiro Wat",
        "Gomen (Collard Greens)",
        "Atakilt Wat (Cabbage, Carrot & Potato)",
        "Key Sir (Beet & Potato Salad)",
        "Fosolia (Green Beans)",
        "Azifa (Lentil Salad)",
        "Timatim Salata (Tomato Salad)",
        "Injera",
      ],
    },
  });

  const cateringNonFasting = [
    {
      slug: "platinum",
      name: "Ma'ed Almaz · Diamond Buffet",
      nameAm: "ማእደ አልማዝ",
      badge: "💎",
      description:
        "Our fullest celebration buffet — kitfo, wots, pasta, rice, injera, and more.",
      beveragePricing: {
        "food-only": 1500,
        tela: 1600,
        tej: 1850,
        "tela-tej": 1800,
        "berz-tej": 1900,
      },
      dishes: [
        "ጥሬ ክትፎ (Tire Kitfo)",
        "ለብለብ ክትፎ (Lebleb Kitfo)",
        "ጎመን ክትፎ (Gomen Kitfo)",
        "አዲስ በነጭ (Ayeb Netch)",
        "አዲስ በቀይ (Ayeb Key)",
        "ቀይ ወጥ (Key Wot)",
        "ምንቸት አብሽ (Minchet Abish)",
        "ጎመን በስጋ (Gomen Besiga)",
        "ትሪፓ (Tripa)",
        "ዶሮ አልጫ (Doro Alicha)",
        "ዶሮ በቀይ (Doro Key)",
        "ሜት በል (Mêt Bel)",
        "የተጠበስ አትክልት (Yatabasa Atkilt)",
        "ሰላጣ (Salata)",
        "ሩዝ በስጋ (Ruz Besiga)",
        "ፓስታ አልፎርኖ (Pasta Al Forno)",
        "የተጠበሰ ድንች (Yatabasa Dintch)",
        "ፍርፍር (Firfir)",
        "ቀይ እንጀራ (Key Injera)",
        "ነጭ እንጀራ (Netch Injera)",
        "ሰላዴስ ዳቦ (Salades Dabo)",
        "ቆጮ (Kocho)",
      ],
    },
    {
      slug: "gold",
      name: "Ma'ed Woreke · Gold Buffet",
      nameAm: "ማእደ ወርቄ",
      badge: "🥇",
      description: "A generous non-fasting spread for mid-to-large celebrations.",
      beveragePricing: {
        "food-only": 1400,
        tela: 1500,
        tej: 1750,
        "tela-tej": 1700,
        "berz-tej": 1800,
      },
      dishes: [
        "ጥሬ ክትፎ (Tire Kitfo)",
        "ለብለብ ክትፎ (Lebleb Kitfo)",
        "ጎመን ክትፎ (Gomen Kitfo)",
        "አዲስ በነጭ (Ayeb Netch)",
        "አዲስ በቀይ (Ayeb Key)",
        "ፍርፍር (Firfir)",
        "ቀይ እንጀራ (Key Injera)",
        "ነጭ እንጀራ (Netch Injera)",
        "ሰላዴስ ዳቦ (Salades Dabo)",
        "ቆጮ (Kocho)",
      ],
    },
    {
      slug: "silver",
      name: "Ma'ed Buret · Silver Buffet",
      nameAm: "ማእደ ብሩት",
      badge: "🥈",
      description: "A classic non-fasting buffet — excellent value for gatherings.",
      beveragePricing: {
        "food-only": 1300,
        tela: 1400,
        tej: 1650,
        "tela-tej": 1600,
        "berz-tej": 1700,
      },
      dishes: [
        "ቀይ ወጥ (Key Wot)",
        "ምንቸት አብሽ (Minchet Abish)",
        "ጎመን በስጋ (Gomen Besiga)",
        "ትሪፓ (Tripa)",
        "ዶሮ አልጫ (Doro Alicha)",
        "ዶሮ በቀይ (Doro Key)",
        "ሜት በል (Mêt Bel)",
        "የተጠበስ አትክልት (Yatabasa Atkilt)",
        "ሰላጣ (Salata)",
        "ሩዝ በስጋ (Ruz Besiga)",
        "ፓስታ አልፎርኖ (Pasta Al Forno)",
        "ፍርፍር (Firfir)",
        "ቀይ እንጀራ (Key Injera)",
        "ነጭ እንጀራ (Netch Injera)",
      ],
    },
  ];

  for (const [i, p] of cateringNonFasting.entries()) {
    await upsertItem(services.catering, {
      slug: p.slug,
      kind: CatalogItemKind.PACKAGE,
      name: p.name,
      description: p.description,
      price: p.beveragePricing["food-only"],
      sortOrder: i + 2,
      metadata: {
        tier: p.slug,
        mealType: "non-fasting",
        nameAm: p.nameAm,
        badge: p.badge,
        beveragePricing: p.beveragePricing,
        dishes: p.dishes,
      },
    });
  }

  const cateringOccasions = [
    { slug: "wedding", emoji: "💍", en: "Wedding", am: "ሠርግ" },
    { slug: "engagement", emoji: "🫶", en: "Engagement", am: "መጽናዕ" },
    { slug: "birthday", emoji: "🎂", en: "Birthday", am: "የልደት" },
    { slug: "graduation", emoji: "🎓", en: "Graduation", am: "ምረቃ" },
    { slug: "meeting", emoji: "💼", en: "Meeting", am: "ስብሰባ" },
    { slug: "memorial", emoji: "🕊️", en: "Memorial", am: "የቀብር" },
    { slug: "religious", emoji: "🙏", en: "Religious Event", am: "የሃይማኖት" },
    { slug: "family", emoji: "👨‍👩‍👧‍👦", en: "Family Gathering", am: "የቤተሰብ" },
    { slug: "corporate", emoji: "🏢", en: "Corporate Event", am: "የኩባንያ" },
    { slug: "other", emoji: "✨", en: "Other", am: "ሌላ" },
  ];

  for (const [i, occasion] of cateringOccasions.entries()) {
    await upsertItem(services.catering, {
      slug: occasion.slug,
      kind: CatalogItemKind.CONFIG,
      name: occasion.en,
      nameI18n: { en: occasion.en, am: occasion.am },
      description: "",
      sortOrder: i + 1,
      metadata: { catalogRole: "occasion", emoji: occasion.emoji },
    });
  }

  const cateringBeverages = [
    { slug: "food-only", value: "food-only", en: "Food Only", am: "ምግብ ብቻ" },
    { slug: "tela", value: "tela", en: "With Tella", am: "ተላ ጭምር" },
    { slug: "tej", value: "tej", en: "With Tej", am: "ጠጅ ጭምር" },
    { slug: "tela-tej", value: "tela-tej", en: "With Tella + Tej", am: "ተላ + ጠጅ" },
    { slug: "berz-tej", value: "berz-tej", en: "With Berz + Tej", am: "ብርዝ + ጠጅ" },
  ];

  for (const [i, beverage] of cateringBeverages.entries()) {
    await upsertItem(services.catering, {
      slug: beverage.slug,
      kind: CatalogItemKind.CONFIG,
      name: beverage.en,
      nameI18n: { en: beverage.en, am: beverage.am },
      description: "",
      sortOrder: i + 1,
      metadata: { catalogRole: "beverage", value: beverage.value },
    });
  }

  // Agelgil pricing config — from agelgilCatalog.ts
  await upsertItem(services.agelgil, {
    slug: "pricing",
    kind: CatalogItemKind.CONFIG,
    name: "Agelgil Pricing",
    description: "Size × meal × package price table",
    sortOrder: 1,
    metadata: {
      sizes: [10, 15, 20, 30],
      minGuests: 10,
      priceTable: {
        "fasting-regular": { "10": 3500, "15": 5000, "20": 6500, "30": 9000 },
        "fasting-special": { "10": 4500, "15": 6500, "20": 8500, "30": 12000 },
        "non-fasting-regular": { "10": 3500, "15": 5000, "20": 6500, "30": 9000 },
        "non-fasting-special": { "10": 4500, "15": 6500, "20": 8500, "30": 12000 },
      },
      menus: {
        "fasting-regular": {
          label: "Regular Fasting",
          dishes: [
            "Misir Wat (Red Lentils)",
            "Kik Alicha (Split Peas)",
            "Shiro Wat",
            "Gomen (Collard Greens)",
            "Atakilt Wat",
            "Fosolia (Green Beans)",
            "Timatim Salata",
            "Injera",
          ],
        },
        "fasting-special": {
          label: "Special Fasting",
          dishes: [
            "Misir Wat (Red Lentils)",
            "Kik Alicha (Split Peas)",
            "Shiro Wat",
            "Gomen (Collard Greens)",
            "Atakilt Wat",
            "Fosolia (Green Beans)",
            "Timatim Salata",
            "Injera",
            "Sambusa",
            "አነባብሮ (Anebabro)",
          ],
        },
        "non-fasting-regular": {
          label: "Regular Non-Fasting",
          dishes: [
            "Doro Wat",
            "Key Wat",
            "Tibs",
            "Shiro Wat",
            "Gomen",
            "Atakilt Wat",
            "Salata",
            "Injera",
          ],
        },
        "non-fasting-special": {
          label: "Special Non-Fasting",
          dishes: [
            "Doro Wat",
            "Key Wat",
            "Tibs",
            "Shiro Wat",
            "Gomen",
            "Atakilt Wat",
            "Salata",
            "Injera",
            "Kitfo",
            "አይብ (Cheese)",
            "Kocho",
          ],
        },
      },
    },
  });
}

async function seedContent() {
  // FAQs from HomeFAQ.tsx (frontend source of truth)
  const faqs = [
    {
      question: "Do you deliver across Addis Ababa?",
      answer:
        "Yes. We deliver tela, tej and take-home products across Addis Ababa, with pickup also available from our restaurant in Bole.",
    },
    {
      question: "How far in advance should I book catering?",
      answer:
        "For catering we recommend booking at least 48 hours in advance. For large events like weddings, a week or more lets us plan the perfect spread.",
    },
    {
      question: "Is your tela and tej brewed in-house?",
      answer:
        "Always. Our tela and tej are fermented in clay pots in our own kitchen using traditional methods — never bought in.",
    },
    {
      question: "Do you have vegan and fasting options?",
      answer:
        "Absolutely. Our beyaynetu and shiro are fully vegan, and we offer complete fasting spreads for events during fasting seasons.",
    },
    {
      question: "Can I reserve a table?",
      answer:
        "Yes — call us or use the contact page and we will hold a table for you, especially recommended on weekends.",
    },
  ];

  const existingFaqs = await prisma.faq.count();
  if (existingFaqs === 0) {
    for (const [i, f] of faqs.entries()) {
      await prisma.faq.create({
        data: {
          question: f.question,
          answer: f.answer,
          language: ContentLanguage.EN,
          sortOrder: i + 1,
        },
      });
    }
  }

  // Restaurant profile — from app/src/data/restaurant.ts
  await prisma.siteSetting.upsert({
    where: { key: "restaurant" },
    create: {
      key: "restaurant",
      value: {
        name: "Senay Tela",
        tagline: "Authentic Ethiopian flavors, brewed and served with tradition.",
        phone: "+251 91 234 5678",
        email: "hello@senaytela.com",
        address: "Bole Medhanialem, Addis Ababa, Ethiopia",
        mapUrl:
          "https://www.google.com/maps?q=Bole+Medhanialem+Addis+Ababa&output=embed",
        openingHours: [
          { day: "Monday – Thursday", hours: "11:00 AM – 10:00 PM" },
          { day: "Friday – Saturday", hours: "11:00 AM – 12:00 AM" },
          { day: "Sunday", hours: "12:00 PM – 9:00 PM" },
        ],
        social: [
          { label: "Instagram", href: "https://instagram.com" },
          { label: "Facebook", href: "https://facebook.com" },
          { label: "TikTok", href: "https://tiktok.com" },
          { label: "YouTube", href: "https://youtube.com" },
        ],
        bankAccount: {
          bankName: "Commercial Bank of Ethiopia (CBE)",
          accountName: "Senay Tela Restaurant PLC",
          accountNumber: "1000 1234 5678 90",
        },
      },
    },
    update: {},
  });

  await prisma.siteSetting.upsert({
    where: { key: "homepage" },
    create: {
      key: "homepage",
      value: {
        heroEyebrow: "Authentic • Traditional • Brewed by Chemist",
        heroHeadline: "Taste the Soul of Ethiopia",
        heroSubcopy:
          "Clay-brewed tela, house tej, and traditional dishes made with care.",
        heroCarousel: [
          { src: "/images/tela-clean.png", alt: "House Tela" },
          { src: "/images/shiro-clean.png", alt: "Shiro pea powder" },
          { src: "/images/senay-tej-cut.png", alt: "Classic Tej" },
          { src: "/images/berbere-clean.png", alt: "Berbere spice" },
        ],
        gallerySection: {
          eyebrow: "Gallery",
          title: "A Feast for the Eyes",
          description:
            "A glimpse of the dishes, drinks and traditions that fill our table every day.",
        },
        testimonialsSection: {
          eyebrow: "Testimonials",
          title: "What Our Guests Say",
        },
        offersSection: {
          eyebrow: "Special Offers",
          title: "Traditional Deals You Can't Miss",
          description:
            "Enjoy your favourite Ethiopian dishes and house-brewed drinks at unbeatable prices.",
          cards: [
            {
              id: "tela-tej",
              label: "House Brew",
              title: "Clay-Brewed Tela & Tej",
              link: "/shop",
              linkText: "Order Now",
              discount: "25%",
              variant: "yellow",
            },
            {
              id: "mesob",
              title: "Family Mesob Feast",
              subtitle: "Shared. Generous. Joyful.",
              image: "/images/foodreference.png",
              link: "/menu",
              linkText: "Explore Menu",
              discount: "30%",
              variant: "green",
              tall: true,
            },
            {
              id: "fasting",
              label: "Fasting Menu",
              title: "Vegan Beyaynetu Spread",
              link: "/menu",
              linkText: "Order Now",
              discount: "20%",
              variant: "burgundy",
            },
          ],
        },
        videoSection: {
          url: "/images/chef-video.mp4",
          title: "Cooked with care",
          subtitle: "Every dish, the traditional way.",
        },
      },
    },
    update: {},
  });

  await prisma.siteSetting.upsert({
    where: { key: "telegram" },
    create: {
      key: "telegram",
      value: {
        enabled: false,
        webAppBaseUrl: "",
        notificationsEnabled: true,
        notifyOnNewRequest: true,
        menuLabels: {
          en: {
            orderNow: "Order Now",
            faq: "FAQ",
            contact: "Contact Us",
            location: "Our Location",
            about: "About Us",
          },
          am: {
            orderNow: "ለማዘዝ",
            faq: "ጥያቄዎች",
            contact: "ያግኙን",
            location: "አድራሻ",
            about: "ስለ እኛ",
          },
        },
      },
    },
    update: {},
  });

  await prisma.siteSetting.upsert({
    where: { key: "delivery" },
    create: {
      key: "delivery",
      value: { fee: 150, currency: "ETB", cateringMinGuests: 40 },
    },
    update: {},
  });

  // Per-page heroes / copy (CMS Pages tabs)
  const pageDefaults: Record<string, object> = {
    "page:agelgil": {
      eyebrow: "Agelgil",
      title: "Traditional Agelgil Sets",
      description:
        "Beautiful woven baskets filled with slow-cooked stews, fresh injera, and sides.",
    },
    "page:baltina": {
      eyebrow: "Baltina",
      title: "House-made pantry essentials",
      description:
        "Browse our stone-ground flours, spice blends, and traditional mixes.",
    },
    "page:festival": {
      eyebrow: "Festival",
      title: "Celebration packages for every feast",
      description:
        "Predefined holiday packages — from Grand to Basic — compare what’s included and order.",
    },
    "page:drinks": {
      eyebrow: "Traditional Drinks",
      title: "House-brewed tela & tej",
      description:
        "Order traditional drinks brewed in-house the authentic way.",
    },
    "page:catering": {
      eyebrow: "Catering",
      title: "Catering for every celebration",
      description:
        "Fasting and non-fasting packages with beverage options — priced per guest.",
      minGuests: 40,
    },
    "page:blog": {
      eyebrow: "Blog",
      title: "Stories from the kitchen",
      description: "Tradition, brewing, and the food that brings us together.",
    },
    "page:about": {
      eyebrow: "About Us",
      title: "The story of Senay Tela",
      description:
        "A family kitchen keeping Ethiopian tradition alive — one stew, one ceremony, one celebration at a time.",
      sectionLabel: "Who we are",
      sectionTitle: "More than a restaurant — a living tradition",
      paragraphs: [
        "Senay Tela was born from a simple wish: to share the food and drink that bring Ethiopian families together.",
        "Every dish that leaves our kitchen carries the same care it would in a family home.",
      ],
      values: [
        {
          title: "Cooked slowly",
          text: "Our wats simmer for hours in seasoned clay, just as they have for generations.",
        },
        {
          title: "Brewed in-house",
          text: "We ferment our own tela and tej — never bought, always fresh from the pot.",
        },
        {
          title: "Honest ingredients",
          text: "Stone-ground spices, fresh produce and no shortcuts. Many dishes are fully vegan.",
        },
        {
          title: "Genuine hospitality",
          text: "You are welcomed as family. Sharing food is the whole point.",
        },
      ],
      milestones: [
        {
          year: "2011",
          text: "Senay Tela opens its doors with a single clay pot and a family recipe book.",
        },
        {
          year: "2016",
          text: "We begin brewing our own tela and tej, becoming a neighbourhood favourite.",
        },
        {
          year: "2020",
          text: "Our catering service launches, serving weddings and holidays across Addis.",
        },
        {
          year: "Today",
          text: "We bring tradition to your table — in the restaurant, at home, and at your events.",
        },
      ],
    },
    "page:contact": {
      eyebrow: "Contact",
      title: "We'd love to hear from you",
      description:
        "Questions, reservations or feedback — reach out and our team will get back to you.",
      formTitle: "Send a message",
      phone: "+251 91 234 5678",
      email: "hello@senaytela.com",
      hoursTitle: "Opening Hours",
      contactTitle: "Get in touch",
      openingHours: [
        { day: "Monday – Thursday", hours: "11:00 AM – 10:00 PM" },
        { day: "Friday – Saturday", hours: "11:00 AM – 12:00 AM" },
        { day: "Sunday", hours: "12:00 PM – 9:00 PM" },
      ],
      locationsTitle: "Locations",
      locationsDescription:
        "Visit any of our three Addis Ababa branches for authentic Ethiopian food and house-brewed drinks.",
      locationsButtonText: "Explore all locations",
      branches: [
        {
          id: "lebu",
          name: "Lebu Muzika Sefer",
          area: "Lebu · Addis Ababa",
          mapUrl:
            "https://www.google.com/maps/search/?api=1&query=Lebu+Muzika+Sefer+Addis+Ababa",
        },
        {
          id: "figa",
          name: "Figa Mebrat Summit Road",
          area: "Summit · Addis Ababa",
          mapUrl:
            "https://www.google.com/maps/search/?api=1&query=Figa+Mebrat+Summit+Road+Addis+Ababa",
        },
        {
          id: "jemo",
          name: "Jemo 1 Condominium",
          area: "Jemo · Addis Ababa",
          mapUrl:
            "https://www.google.com/maps/search/?api=1&query=Jemo+1+Condominium+Addis+Ababa",
        },
      ],
    },
  };

  for (const [key, value] of Object.entries(pageDefaults)) {
    await prisma.siteSetting.upsert({
      where: { key },
      create: { key, value },
      update: {},
    });
  }

  // Blog — from app/src/data/blog.ts (titles only seed if empty)
  const blogCount = await prisma.blogPost.count();
  if (blogCount === 0) {
    await prisma.blogPost.createMany({
      data: [
        {
          slug: "the-craft-of-tela",
          title: "The Craft of Tela",
          excerpt: "How we brew tela in clay the traditional way.",
          content: [
            "Our tela starts with carefully prepared grains and a slow clay-pot fermentation.",
            "Every batch is tasted before it leaves the kitchen.",
          ],
          author: "Senay Kitchen",
          publishedAt: new Date("2025-01-10"),
          readTime: "4 min",
          tags: ["tela", "tradition"],
        },
        {
          slug: "berbere-the-soul-of-the-stew",
          title: "Berbere: The Soul of the Stew",
          excerpt: "Why our berbere is milled in small batches.",
          content: [
            "Berbere is more than heat — it is the backbone of Ethiopian flavour.",
          ],
          author: "Senay Kitchen",
          publishedAt: new Date("2025-02-02"),
          readTime: "3 min",
          tags: ["berbere", "spices"],
        },
        {
          slug: "inside-the-coffee-ceremony",
          title: "Inside the Coffee Ceremony",
          excerpt: "Hospitality in three rounds of buna.",
          content: [
            "The coffee ceremony is how we welcome guests — slowly, warmly, together.",
          ],
          author: "Senay Kitchen",
          publishedAt: new Date("2025-03-01"),
          readTime: "5 min",
          tags: ["coffee", "culture"],
        },
      ],
    });
  }

  const galleryCount = await prisma.galleryImage.count();
  if (galleryCount === 0) {
    await prisma.galleryImage.createMany({
      data: [
        { url: "/images/tela-clean.png", name: "House Tela", category: "drinks", tall: false, sortOrder: 1 },
        { url: "/images/shiro-clean.png", name: "Shiro Wat", category: "food", tall: true, sortOrder: 2 },
        { url: "/images/senay-tej-cut.png", name: "Classic Tej", category: "drinks", sortOrder: 3 },
        { url: "/images/berbere-clean.png", name: "Berbere", category: "products", sortOrder: 4 },
        { url: "/images/foodreference.png", name: "Beyaynetu", category: "food", tall: true, sortOrder: 5 },
      ],
    });
  }

  const testimonialCount = await prisma.testimonial.count();
  if (testimonialCount === 0) {
    await prisma.testimonial.createMany({
      data: [
        {
          name: "Hiwot G.",
          role: "Regular Guest",
          quote:
            "The doro wat tastes exactly like my grandmother used to make. And the tela — I have never had better outside a wedding.",
          dish: "Doro Wat",
          dishCategory: "food",
          sortOrder: 1,
        },
        {
          name: "Daniel & Sara",
          role: "Wedding Clients",
          quote:
            "They catered our wedding for 200 people. The coffee ceremony brought everyone together. Flawless from start to finish.",
          dish: "Tej",
          dishCategory: "drinks",
          sortOrder: 2,
        },
        {
          name: "Marcus T.",
          role: "Shop Customer",
          quote:
            "I order their shiro and berbere every month. Restaurant-quality flavour at home, delivered on time, every time.",
          dish: "Berbere",
          dishCategory: "products",
          sortOrder: 3,
        },
      ],
    });
  }
}

async function seedNavigation() {
  const items = [
    {
      location: NavigationLocation.PRIMARY,
      label: "Home",
      labelI18n: { en: "Home", am: "መነሻ" },
      href: "/",
      order: 1,
    },
    {
      location: NavigationLocation.PRIMARY,
      label: "Baltina",
      labelI18n: { en: "Baltina", am: "ባልቲና" },
      href: "/baltina",
      order: 2,
    },
    {
      location: NavigationLocation.PRIMARY,
      label: "Drinks",
      labelI18n: { en: "Drinks", am: "መጠጦች" },
      href: "/traditional-drinks",
      order: 3,
    },
    {
      location: NavigationLocation.PRIMARY,
      label: "Festival",
      labelI18n: { en: "Festival", am: "ፌስቲቫል" },
      href: "/festival-package",
      order: 4,
    },
    {
      location: NavigationLocation.PRIMARY,
      label: "Agelgil",
      labelI18n: { en: "Agelgil", am: "አገልጊል" },
      href: "/agelgil",
      order: 5,
    },
    {
      location: NavigationLocation.PRIMARY,
      label: "Catering",
      labelI18n: { en: "Catering", am: "ካተሪንግ" },
      href: "/catering",
      order: 6,
    },
    {
      location: NavigationLocation.PRIMARY,
      label: "Blog",
      labelI18n: { en: "Blog", am: "ብሎግ" },
      href: "/blog",
      order: 7,
    },
    {
      location: NavigationLocation.PRIMARY,
      label: "About",
      labelI18n: { en: "About", am: "ስለ እኛ" },
      href: "/about",
      order: 8,
    },
    {
      location: NavigationLocation.PRIMARY,
      label: "Contact",
      labelI18n: { en: "Contact", am: "እውቂያ" },
      href: "/contact",
      order: 9,
    },
  ];

  await prisma.navigation.deleteMany({ where: { location: NavigationLocation.PRIMARY } });
  await prisma.navigation.createMany({ data: items });
}

async function seedFooter() {
  await prisma.footer.deleteMany({
    where: { column: { in: ["brand", "links", "contact", "social", "explore", "company", "bottom"] } },
  });
  await prisma.footer.createMany({
    data: [
      {
        column: "brand",
        order: 1,
        content: {
          tagline: "Authentic Ethiopian flavors, brewed and served with tradition.",
          social: [
            { label: "Instagram", href: "https://instagram.com" },
            { label: "Facebook", href: "https://facebook.com" },
            { label: "TikTok", href: "https://tiktok.com" },
            { label: "YouTube", href: "https://youtube.com" },
          ],
        },
      },
      {
        column: "explore",
        title: "Explore",
        order: 2,
        content: {
          links: [
            { label: "Agelgil", href: "/agelgil" },
            { label: "Baltina", href: "/baltina" },
            { label: "Festival", href: "/festival-package" },
            { label: "Drinks", href: "/traditional-drinks" },
            { label: "Catering", href: "/catering" },
            { label: "Blog", href: "/blog" },
          ],
        },
      },
      {
        column: "company",
        title: "Company",
        order: 3,
        content: {
          links: [
            { label: "About Us", href: "/about" },
            { label: "Contact", href: "/contact" },
            { label: "Checkout", href: "/checkout" },
          ],
        },
      },
      {
        column: "bottom",
        order: 4,
        content: {
          creditText: "Made with care in Addis Ababa.",
        },
      },
    ],
  });
}

async function seedCategories() {
  const categories = [
    { slug: "appetizers", name: "Appetizers", type: CategoryType.MENU, order: 1 },
    { slug: "main-courses", name: "Main Courses", type: CategoryType.MENU, order: 2 },
    { slug: "vegetarian", name: "Vegetarian & Fasting", type: CategoryType.MENU, order: 3 },
    { slug: "drinks", name: "Drinks", type: CategoryType.MENU, order: 4 },
    { slug: "desserts", name: "Desserts", type: CategoryType.MENU, order: 5 },
  ];

  await prisma.menuItem.deleteMany({});
  await prisma.category.deleteMany({ where: { slug: { in: categories.map((c) => c.slug) } } });
  await prisma.category.createMany({ data: categories });
}

async function seedMenuItems() {
  const category = await prisma.category.findUnique({ where: { slug: "main-courses" } });
  if (!category) return;

  const items = [
    {
      name: "Doro Wat",
      description: "Ethiopian chicken stew slow-cooked in berbere and spiced butter, served with injera.",
      price: 750,
      categoryId: category.id,
      featured: true,
      order: 1,
    },
    {
      name: "Tibs",
      description: "Tender beef sautéed with onions, tomatoes, rosemary, and green chilli.",
      price: 680,
      categoryId: category.id,
      order: 2,
    },
    {
      name: "Shiro Wat",
      description: "Creamy chickpea stew — a comforting vegan classic.",
      price: 320,
      categoryId: category.id,
      vegetarian: true,
      featured: true,
      order: 3,
    },
  ];

  await prisma.menuItem.deleteMany({ where: { name: { in: items.map((i) => i.name) } } });
  await prisma.menuItem.createMany({ data: items });
}

async function seedHomeSections() {
  const sections = [
    {
      key: "hero",
      label: "Hero Carousel",
      order: 1,
      content: {
        eyebrow: "Authentic • Traditional • Brewed by Chemist",
        headline: "Taste the Soul of Ethiopia",
        headlineLine1: "Taste the Soul",
        headlineLine2: "of Ethiopia",
        subcopy: "Clay-brewed tela, house tej, and traditional dishes made with care.",
        slides: [
          { src: "/images/tela-clean.png", alt: "House Tela" },
          { src: "/images/shiro-clean.png", alt: "Shiro pea powder" },
          { src: "/images/senay-tej-cut.png", alt: "Classic Tej" },
          { src: "/images/berbere-clean.png", alt: "Berbere spice" },
        ],
      },
    },
    {
      key: "categories",
      label: "Categories",
      order: 2,
      content: {
        eyebrow: "Explore",
        title: "Categories",
        description:
          "Browse our signature dishes, house-brewed drinks, and traditional favourites — all made fresh in our kitchen.",
        cards: [
          {
            label: "Doro Wat",
            description: "Slow-cooked chicken stew in berbere — our signature dish.",
            href: "/#menu",
            image: "/images/foodreference.png",
          },
          {
            label: "Tibs",
            description: "Sautéed beef or lamb with onions, peppers and awaze.",
            href: "/#menu",
            image: "/images/cat-chicken.png",
          },
          {
            label: "Shiro Wat",
            description: "Creamy chickpea stew — perfect for fasting or any day.",
            href: "/#menu",
            image: "/images/shiro-clean.png",
          },
          {
            label: "House Tela",
            description: "Clay-brewed traditional beer, fermented in-house.",
            href: "/traditional-drinks",
            image: "/images/tela-clean.png",
          },
          {
            label: "Classic Tej",
            description: "Golden honey wine served the traditional way.",
            href: "/traditional-drinks",
            image: "/images/tej-clean.png",
          },
          {
            label: "Beyaynetu",
            description: "Colourful vegan combination platter on injera.",
            href: "/#menu",
            image: "/images/foodreference.png",
          },
          {
            label: "Baltina",
            description: "Stone-ground shiro, berbere and pantry essentials.",
            href: "/baltina",
            image: "/images/senay-shiro-cut.png",
          },
          {
            label: "Catering",
            description: "Full mesob spreads for weddings and celebrations.",
            href: "/catering",
            image: "/images/catering-risotto.jpg",
          },
        ],
      },
    },
    {
      key: "offers",
      label: "Special Offers",
      order: 3,
      content: {
        eyebrow: "Special Offers",
        title: "Traditional Deals You Can't Miss",
        description: "Enjoy your favourite Ethiopian dishes and house-brewed drinks at unbeatable prices.",
        cards: [
          {
            id: "tela-tej",
            label: "House Brew",
            title: "Clay-Brewed Tela & Tej",
            link: "/traditional-drinks",
            linkText: "Order Now",
            variant: "yellow",
          },
          {
            id: "mesob",
            title: "Family Mesob Feast",
            subtitle: "Shared. Generous. Joyful.",
            image: "/images/foodreference.png",
            link: "/#menu",
            linkText: "Explore Menu",
            variant: "green",
            tall: true,
          },
          {
            id: "fasting",
            label: "Fasting Menu",
            title: "Vegan Beyaynetu Spread",
            link: "/#menu",
            linkText: "Order Now",
            variant: "burgundy",
          },
        ],
      },
    },
    {
      key: "featuredMenu",
      label: "Featured Menu",
      order: 4,
      content: {
        eyebrow: "From the Menu",
        title: "Chef's Selection",
        description: "Small plates and favourites we are proud to serve every day.",
        buttonText: "View Full Menu",
        buttonLink: "/#menu",
        items: [
          {
            id: "doro-wat",
            name: "Doro Wat",
            description:
              "Ethiopian chicken stew slow-cooked in berbere and spiced butter, served with injera.",
            price: 750,
            image: "",
            category: "food",
          },
          {
            id: "shiro-wat",
            name: "Shiro Wat",
            description: "Creamy chickpea stew — a comforting vegan classic.",
            price: 320,
            image: "",
            category: "food",
          },
        ],
      },
    },
    {
      key: "story",
      label: "About Preview",
      order: 5,
      content: {
        eyebrow: "Our Story",
        title: "A kitchen built on tradition",
        description: "The story of Senay Tela.",
        image: "",
        buttonText: "More About Us",
        buttonLink: "/about",
      },
    },
    {
      key: "video",
      label: "Video Banner",
      order: 6,
      content: {
        url: "/images/chef-video.mp4",
        title: "Cooked with care",
        subtitle: "Every dish, the traditional way.",
      },
    },
    {
      key: "whyChooseUs",
      label: "Why Choose Us",
      order: 7,
      content: {
        eyebrow: "Why Choose Us",
        title: "Experience the Difference",
        description:
          "We combine traditional recipes, house-brewed drinks and warm hospitality to deliver an unforgettable Ethiopian dining experience.",
        features: [
          { title: "In-House Brewing", description: "Tela and tej fermented in clay pots by our own brewers." },
          { title: "Fresh Ingredients", description: "Stone-ground spices and produce sourced daily." },
          { title: "Generous Hospitality", description: "You are welcomed as family, every single visit." },
          { title: "Vegan Friendly", description: "Full fasting and vegan options available year-round." },
        ],
      },
    },
    {
      key: "catering",
      label: "Catering Showcase",
      order: 8,
      content: {
        eyebrow: "Catering",
        title: "Bring the Feast to Your Event",
        description: "From intimate dinners to weddings and holidays, we cater with tradition.",
        buttonText: "Book Catering",
        buttonLink: "/catering",
        dishes: [
          {
            label: "Wedding Catering",
            name: "Full Mesob Spread",
            description: "Enough for any celebration",
            image: "",
            category: "food",
          },
          {
            label: "Holiday Box",
            name: "Festival Package",
            description: "Chicken, eggs, injera and more",
            image: "",
            category: "food",
          },
          {
            label: "Vegan Tray",
            name: "Beyaynetu",
            description: "Colourful fasting selection",
            image: "",
            category: "food",
          },
        ],
      },
    },
    {
      key: "testimonials",
      label: "Testimonials",
      order: 9,
      content: {
        eyebrow: "Testimonials",
        title: "What Our Guests Say",
      },
    },
    {
      key: "faq",
      label: "FAQ",
      order: 10,
      content: {
        eyebrow: "FAQ",
        title: "Questions? Answered.",
        description:
          "Got questions about ordering, catering or our brewing? Here are the answers our guests ask most.",
      },
    },
    {
      key: "gallery",
      label: "Gallery Preview",
      order: 11,
      content: {
        eyebrow: "Gallery",
        title: "A Feast for the Eyes",
        description:
          "A glimpse of the dishes, drinks and traditions that fill our table every day.",
        slots: [
          { url: "/images/foodreference.png", caption: "Doro Wat", category: "food" },
          { url: "/images/tela-clean.png", caption: "House Tela", category: "drinks" },
          { url: "/images/shiro-clean.png", caption: "Shiro Wat", category: "food" },
          { url: "/images/tej-clean.png", caption: "Classic Tej", category: "drinks" },
          { url: "/images/senay-tej-cut.png", caption: "Beyaynetu", category: "food" },
          { url: "/images/berbere-clean.png", caption: "Berbere", category: "products" },
        ],
      },
    },
    {
      key: "blog",
      label: "Blog Preview",
      order: 12,
      content: {
        eyebrow: "Blog",
        title: "Stories, Culture & Food Traditions",
        description:
          "Tales from our kitchen, the craft behind our drinks, and the traditions that shape Ethiopian food.",
        buttonText: "Explore Blog",
        buttonLink: "/blog",
        featuredCount: 2,
      },
    },
    {
      key: "cta",
      label: "Call to Action",
      order: 13,
      content: {
        title: "Ready to taste tradition?",
        description: "Visit us, book catering, or order drinks to go.",
        primaryLink: "/menu",
        primaryText: "Order Now",
        secondaryLink: "/catering",
        secondaryText: "Book Catering",
      },
    },
  ];

  for (const s of sections) {
    await prisma.homeSection.upsert({
      where: { key: s.key },
      create: s,
      update: {},
    });
  }
}

async function seedPages() {
  const pages = [
    {
      slug: "home",
      title: "Home",
      status: PageStatus.PUBLISHED,
      isHome: true,
      description: "Authentic Ethiopian flavors, brewed and served with tradition.",
    },
    {
      slug: "about",
      title: "About Us",
      status: PageStatus.PUBLISHED,
      description: "The story of Senay Tela.",
    },
    {
      slug: "contact",
      title: "Contact",
      status: PageStatus.PUBLISHED,
      description: "Get in touch with Senay Tela.",
    },
  ];

  for (const p of pages) {
    await prisma.page.upsert({
      where: { slug: p.slug },
      create: p,
      update: {},
    });
  }
}

async function seedSeo() {
  await prisma.seoSetting.upsert({
    where: { key: "global" },
    create: {
      key: "global",
      value: {
        siteTitle: "Senay Tela",
        titleTemplate: "%s | Senay Tela",
        defaultDescription: "Authentic Ethiopian flavors, brewed and served with tradition.",
        defaultKeywords: "Ethiopian food, tela, tej, catering, Addis Ababa, restaurant",
      },
    },
    update: {},
  });
}

async function main() {
  console.log("Seeding permissions…");
  const permissions = await seedPermissions();

  console.log("Seeding roles…");
  const roles = await seedRoles(permissions.map((p) => p.id));

  console.log("Seeding default admin…");
  await seedAdmin(roles.superAdmin.id);

  console.log("Seeding services…");
  const services = await seedServices();

  console.log("Seeding catalog from frontend…");
  await seedCatalog(services);

  console.log("Seeding content…");
  await seedContent();

  console.log("Seeding navigation…");
  await seedNavigation();

  console.log("Seeding footer…");
  await seedFooter();

  console.log("Seeding categories & menu…");
  await seedCategories();
  await seedMenuItems();

  console.log("Seeding homepage sections…");
  await seedHomeSections();

  console.log("Seeding pages…");
  await seedPages();

  console.log("Seeding SEO settings…");
  await seedSeo();

  console.log("Done.");
  console.log(
    "Admins: invite via System → Admins, or set ADMIN_SEED_EMAILS before db:seed.",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
