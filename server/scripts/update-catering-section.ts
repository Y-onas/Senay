import { prisma } from "../src/lib/prisma.js";

const content = {
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
};

await prisma.homeSection.upsert({
  where: { key: "catering" },
  create: {
    key: "catering",
    label: "Catering Showcase",
    order: 8,
    enabled: true,
    content,
  },
  update: { content },
});

console.log("Updated catering section.");
await prisma.$disconnect();
