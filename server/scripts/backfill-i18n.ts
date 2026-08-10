import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type LocalizedText = Record<string, string>;

function fromEnglish(value: string | null | undefined): LocalizedText | null {
  if (!value || !value.trim()) return null;
  return { en: value };
}

async function backfillServices() {
  const rows = await prisma.service.findMany();
  for (const row of rows) {
    await prisma.service.update({
      where: { id: row.id },
      data: {
        nameI18n: row.nameI18n ?? fromEnglish(row.name),
        descriptionI18n:
          row.descriptionI18n ?? fromEnglish(row.description),
      },
    });
  }
}

async function backfillCatalog() {
  const rows = await prisma.catalogItem.findMany();
  for (const row of rows) {
    await prisma.catalogItem.update({
      where: { id: row.id },
      data: {
        nameI18n: row.nameI18n ?? fromEnglish(row.name),
        descriptionI18n:
          row.descriptionI18n ?? fromEnglish(row.description),
      },
    });
  }
}

async function backfillFaqs() {
  const rows = await prisma.faq.findMany();
  for (const row of rows) {
    await prisma.faq.update({
      where: { id: row.id },
      data: {
        questionI18n: row.questionI18n ?? fromEnglish(row.question),
        answerI18n: row.answerI18n ?? fromEnglish(row.answer),
      },
    });
  }
}

async function backfillGallery() {
  const rows = await prisma.galleryImage.findMany();
  for (const row of rows) {
    await prisma.galleryImage.update({
      where: { id: row.id },
      data: {
        nameI18n: row.nameI18n ?? fromEnglish(row.name ?? undefined),
        captionI18n:
          row.captionI18n ?? fromEnglish(row.caption ?? undefined),
      },
    });
  }
}

async function backfillTestimonials() {
  const rows = await prisma.testimonial.findMany();
  for (const row of rows) {
    await prisma.testimonial.update({
      where: { id: row.id },
      data: {
        nameI18n: row.nameI18n ?? fromEnglish(row.name),
        quoteI18n: row.quoteI18n ?? fromEnglish(row.quote),
        roleI18n: row.roleI18n ?? fromEnglish(row.role ?? undefined),
        dishI18n: row.dishI18n ?? fromEnglish(row.dish ?? undefined),
      },
    });
  }
}

async function backfillBlog() {
  const rows = await prisma.blogPost.findMany();
  for (const row of rows) {
    await prisma.blogPost.update({
      where: { id: row.id },
      data: {
        titleI18n: row.titleI18n ?? fromEnglish(row.title),
        excerptI18n: row.excerptI18n ?? fromEnglish(row.excerpt),
        authorI18n: row.authorI18n ?? fromEnglish(row.author),
        readTimeI18n: row.readTimeI18n ?? fromEnglish(row.readTime),
        seoTitleI18n:
          row.seoTitleI18n ?? fromEnglish(row.seoTitle ?? undefined),
        seoDescriptionI18n:
          row.seoDescriptionI18n ??
          fromEnglish(row.seoDescription ?? undefined),
      },
    });
  }
}

async function backfillNavigation() {
  const rows = await prisma.navigation.findMany();
  for (const row of rows) {
    await prisma.navigation.update({
      where: { id: row.id },
      data: {
        labelI18n: row.labelI18n ?? fromEnglish(row.label),
      },
    });
  }
}

async function backfillPages() {
  const pages = await prisma.page.findMany();
  for (const row of pages) {
    await prisma.page.update({
      where: { id: row.id },
      data: {
        titleI18n: row.titleI18n ?? fromEnglish(row.title),
        descriptionI18n:
          row.descriptionI18n ?? fromEnglish(row.description ?? undefined),
      },
    });
  }

  const seos = await prisma.pageSeo.findMany();
  for (const row of seos) {
    await prisma.pageSeo.update({
      where: { pageId: row.pageId },
      data: {
        titleI18n: row.titleI18n ?? fromEnglish(row.title ?? undefined),
        descriptionI18n:
          row.descriptionI18n ?? fromEnglish(row.description ?? undefined),
        keywordsI18n:
          row.keywordsI18n ?? fromEnglish(row.keywords ?? undefined),
      },
    });
  }
}

async function backfillMenu() {
  const categories = await prisma.category.findMany();
  for (const row of categories) {
    await prisma.category.update({
      where: { id: row.id },
      data: {
        nameI18n: row.nameI18n ?? fromEnglish(row.name),
        descriptionI18n:
          row.descriptionI18n ?? fromEnglish(row.description ?? undefined),
      },
    });
  }

  const items = await prisma.menuItem.findMany();
  for (const row of items) {
    await prisma.menuItem.update({
      where: { id: row.id },
      data: {
        nameI18n: row.nameI18n ?? fromEnglish(row.name),
        descriptionI18n:
          row.descriptionI18n ?? fromEnglish(row.description),
      },
    });
  }
}

async function backfillAnnouncements() {
  const rows = await prisma.announcement.findMany();
  for (const row of rows) {
    await prisma.announcement.update({
      where: { id: row.id },
      data: {
        messageI18n: row.messageI18n ?? fromEnglish(row.message),
      },
    });
  }
}

async function main() {
  console.log("Backfilling localized fields...");
  await backfillServices();
  await backfillCatalog();
  await backfillFaqs();
  await backfillGallery();
  await backfillTestimonials();
  await backfillBlog();
  await backfillNavigation();
  await backfillPages();
  await backfillMenu();
  await backfillAnnouncements();
  console.log("Done.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
