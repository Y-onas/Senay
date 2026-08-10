import { prisma } from "../src/lib/prisma.js";

const content = {
  eyebrow: "Explore",
  title: "Categories",
  description:
    "Browse our signature dishes, house-brewed drinks, and traditional favourites — all made fresh in our kitchen.",
  cards: [
    {
      label: "Doro Wat",
      description: "Slow-cooked chicken stew in berbere — our signature dish.",
      href: "/#menu",
      image: "/images/foodreference.png",
    },
    {
      label: "Tibs",
      description: "Sautéed beef or lamb with onions, peppers and awaze.",
      href: "/#menu",
      image: "/images/cat-chicken.png",
    },
    {
      label: "Shiro Wat",
      description: "Creamy chickpea stew — perfect for fasting or any day.",
      href: "/#menu",
      image: "/images/shiro-clean.png",
    },
    {
      label: "House Tela",
      description: "Clay-brewed traditional beer, fermented in-house.",
      href: "/traditional-drinks",
      image: "/images/tela-clean.png",
    },
    {
      label: "Classic Tej",
      description: "Golden honey wine served the traditional way.",
      href: "/traditional-drinks",
      image: "/images/tej-clean.png",
    },
    {
      label: "Beyaynetu",
      description: "Colourful vegan combination platter on injera.",
      href: "/#menu",
      image: "/images/foodreference.png",
    },
    {
      label: "Baltina",
      description: "Stone-ground shiro, berbere and pantry essentials.",
      href: "/baltina",
      image: "/images/senay-shiro-cut.png",
    },
    {
      label: "Catering",
      description: "Full mesob spreads for weddings and celebrations.",
      href: "/catering",
      image: "/images/catering-risotto.jpg",
    },
  ],
};

await prisma.homeSection.update({
  where: { key: "categories" },
  data: { label: "Categories", content },
});

console.log("Updated home categories section.");
await prisma.$disconnect();
