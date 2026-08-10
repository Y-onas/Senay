import { CatalogItemKind, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const catering = await prisma.service.findUnique({ where: { slug: "catering" } });
  if (!catering) {
    console.error("Catering service not found");
    process.exit(1);
  }

  const upsert = async (data: {
    slug: string;
    name: string;
    nameI18n: Record<string, string>;
    sortOrder: number;
    metadata: Record<string, unknown>;
  }) => {
    await prisma.catalogItem.upsert({
      where: { serviceId_slug: { serviceId: catering.id, slug: data.slug } },
      create: {
        serviceId: catering.id,
        kind: CatalogItemKind.CONFIG,
        slug: data.slug,
        name: data.name,
        nameI18n: data.nameI18n,
        description: "",
        sortOrder: data.sortOrder,
        metadata: data.metadata,
        available: true,
      },
      update: {
        kind: CatalogItemKind.CONFIG,
        name: data.name,
        nameI18n: data.nameI18n,
        sortOrder: data.sortOrder,
        metadata: data.metadata,
      },
    });
  };

  const occasions = [
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

  for (const [i, o] of occasions.entries()) {
    await upsert({
      slug: o.slug,
      name: o.en,
      nameI18n: { en: o.en, am: o.am },
      sortOrder: i + 1,
      metadata: { catalogRole: "occasion", emoji: o.emoji },
    });
  }

  const beverages = [
    { slug: "food-only", value: "food-only", en: "Food Only", am: "ምግብ ብቻ" },
    { slug: "tela", value: "tela", en: "With Tella", am: "ተላ ጭምር" },
    { slug: "tej", value: "tej", en: "With Tej", am: "ጠጅ ጭምር" },
    { slug: "tela-tej", value: "tela-tej", en: "With Tella + Tej", am: "ተላ + ጠጅ" },
    { slug: "berz-tej", value: "berz-tej", en: "With Berz + Tej", am: "ብርዝ + ጠጅ" },
  ];

  for (const [i, b] of beverages.entries()) {
    await upsert({
      slug: b.slug,
      name: b.en,
      nameI18n: { en: b.en, am: b.am },
      sortOrder: i + 1,
      metadata: { catalogRole: "beverage", value: b.value },
    });
  }

  console.log("Catering occasion & beverage labels seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
