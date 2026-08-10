import { PrismaClient } from "@prisma/client";
import { agelgilMenus } from "../../app/src/data/agelgilCatalog";

const prisma = new PrismaClient();

function flatMenus(
  nested: typeof agelgilMenus,
): Record<string, { label: string; dishes: string[] }> {
  return {
    "fasting-regular": { ...nested.fasting.regular },
    "fasting-special": { ...nested.fasting.special },
    "non-fasting-regular": { ...nested["non-fasting"].regular },
    "non-fasting-special": { ...nested["non-fasting"].special },
  };
}

async function main() {
  const service = await prisma.service.findUnique({ where: { slug: "agelgil" } });
  if (!service) {
    console.error("Agelgil service not found");
    process.exit(1);
  }

  const defaults = {
    sizes: [10, 15, 20, 30],
    minGuests: 10,
    priceTable: {
      "fasting-regular": { "10": 3500, "15": 5000, "20": 6500, "30": 9000 },
      "fasting-special": { "10": 4500, "15": 6500, "20": 8500, "30": 12000 },
      "non-fasting-regular": { "10": 3500, "15": 5000, "20": 6500, "30": 9000 },
      "non-fasting-special": { "10": 4500, "15": 6500, "20": 8500, "30": 12000 },
    },
    menus: flatMenus(agelgilMenus),
  };

  await prisma.catalogItem.upsert({
    where: { serviceId_slug: { serviceId: service.id, slug: "pricing" } },
    create: {
      serviceId: service.id,
      slug: "pricing",
      kind: "CONFIG",
      name: "Agelgil Pricing",
      description: "Size × meal × package price table",
      sortOrder: 1,
      available: true,
      metadata: defaults,
    },
    update: {
      kind: "CONFIG",
      name: "Agelgil Pricing",
      description: "Size × meal × package price table",
      available: true,
      metadata: defaults,
    },
  });

  console.log("Agelgil pricing config updated with flat menus + prices.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
