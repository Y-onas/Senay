import { prisma } from "../src/lib/prisma.js";

const content = {
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
};

await prisma.homeSection.upsert({
  where: { key: "gallery" },
  create: {
    key: "gallery",
    label: "Gallery Preview",
    order: 11,
    enabled: true,
    content,
  },
  update: {
    label: "Gallery Preview",
    content,
  },
});

console.log("Updated gallery section with 6 fixed slots.");
await prisma.$disconnect();
