import { prisma } from "../src/lib/prisma.js";

const columns = [
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
];

await prisma.footer.deleteMany({
  where: { column: { in: ["links", "contact", "social"] } },
});

for (const item of columns) {
  const existing = await prisma.footer.findFirst({ where: { column: item.column } });
  if (existing) {
    await prisma.footer.update({
      where: { id: existing.id },
      data: {
        title: item.title ?? null,
        order: item.order,
        content: item.content,
      },
    });
  } else {
    await prisma.footer.create({
      data: {
        column: item.column,
        title: item.title ?? null,
        order: item.order,
        content: item.content,
      },
    });
  }
}

console.log("Updated footer columns.");
await prisma.$disconnect();
