import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Keep English names unchanged; only set Amharic labels. */
const updates = [
  { slug: "baltina", name: "Baltina", nameI18n: { en: "Baltina", am: "ባልትና" } },
  { slug: "drinks", name: "Drinks", nameI18n: { en: "Drinks", am: "መጠጦች" } },
  { slug: "festival", name: "Festival", nameI18n: { en: "Festival", am: "የበዓል ጥቅሎች" } },
  { slug: "agelgil", name: "Agelgil", nameI18n: { en: "Agelgil", am: "አገልግል" } },
  { slug: "catering", name: "Catering", nameI18n: { en: "Catering", am: "ኬተሪንግ/ ቡፌ" } },
] as const;

async function main() {
  for (const u of updates) {
    const result = await prisma.service.updateMany({
      where: { slug: u.slug },
      data: { name: u.name, nameI18n: u.nameI18n },
    });
    console.log(`${u.slug}: ${result.count} row(s) → en="${u.name}" am="${u.nameI18n.am}"`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
