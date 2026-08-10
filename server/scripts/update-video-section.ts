import { prisma } from "../src/lib/prisma.js";

const content = {
  url: "/images/chef-video.mp4",
  title: "Cooked with care",
  subtitle: "Every dish, the traditional way.",
};

await prisma.homeSection.update({
  where: { key: "video" },
  data: { label: "Video", content },
});

console.log("Updated home video section.");
await prisma.$disconnect();
