import "dotenv/config";
import { importPublicSiteImages } from "../src/lib/import-public-images.js";
import { prisma } from "../src/lib/prisma.js";

importPublicSiteImages()
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
