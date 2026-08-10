import { prisma } from "../src/lib/prisma.js";

const content = {
  eyebrow: "Our Story",
  title: "A kitchen built on tradition",
  description: "The story of Senay Tela.",
  image: "",
  buttonText: "More About Us",
  buttonLink: "/about",
};

await prisma.homeSection.update({
  where: { key: "story" },
  data: { label: "About Preview", content },
});

console.log("Updated home story section.");
await prisma.$disconnect();
