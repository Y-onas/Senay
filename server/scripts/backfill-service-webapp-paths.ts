import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// One-time defaults for the existing public service pages. New services are
// configured through the Services dashboard, not this list.
const paths: Record<string, string> = {
  catering: "/catering",
  agelgil: "/agelgil",
  baltina: "/baltina",
  drinks: "/traditional-drinks",
  festival: "/festival-package",
};

async function main() {
  for (const [slug, webAppPath] of Object.entries(paths)) {
    const result = await prisma.service.updateMany({
      where: { slug, webAppPath: null },
      data: { webAppPath },
    });
    if (result.count) console.log(`Configured ${slug} → ${webAppPath}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
