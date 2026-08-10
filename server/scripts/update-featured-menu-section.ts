import { prisma } from "../src/lib/prisma.js";

const content = {
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
};

await prisma.homeSection.update({
  where: { key: "featuredMenu" },
  data: { label: "Our Menu", content },
});

console.log("Updated home featured menu section.");
await prisma.$disconnect();
