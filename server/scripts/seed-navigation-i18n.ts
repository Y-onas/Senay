/**
 * Backfill navigation labelI18n (Amharic) without wiping links.
 * Run: npx tsx server/scripts/seed-navigation-i18n.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const byHref: Record<string, { en: string; am: string }> = {
  "/": { en: "Home", am: "መነሻ" },
  "/baltina": { en: "Baltina", am: "ባልቲና" },
  "/traditional-drinks": { en: "Drinks", am: "መጠጦች" },
  "/festival-package": { en: "Festival", am: "ፌስቲቫል" },
  "/agelgil": { en: "Agelgil", am: "አገልጊል" },
  "/catering": { en: "Catering", am: "ካተሪንግ" },
  "/blog": { en: "Blog", am: "ብሎግ" },
  "/about": { en: "About", am: "ስለ እኛ" },
  "/contact": { en: "Contact", am: "እውቂያ" },
};

async function main() {
  const rows = await prisma.navigation.findMany();
  for (const row of rows) {
    const preset = byHref[row.href];
    if (!preset) continue;

    const existing =
      row.labelI18n && typeof row.labelI18n === "object" && !Array.isArray(row.labelI18n)
        ? (row.labelI18n as Record<string, string>)
        : {};

    await prisma.navigation.update({
      where: { id: row.id },
      data: {
        label: preset.en,
        labelI18n: {
          en: existing.en || preset.en,
          am: existing.am || preset.am,
        },
      },
    });
    console.log(`  ✓ ${row.href}`);
  }
  console.log("Navigation i18n backfill done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
