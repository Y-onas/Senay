import { prisma } from "../src/lib/prisma.js";

const content = {
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
};

await prisma.homeSection.upsert({
  where: { key: "whyChooseUs" },
  create: {
    key: "whyChooseUs",
    label: "Why Choose Us",
    order: 7,
    enabled: true,
    content,
  },
  update: { content },
});

console.log("Updated whyChooseUs section.");
await prisma.$disconnect();
