import "dotenv/config";
import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { ensurePublicSiteImagesImported } from "./lib/import-public-images.js";

const port = Number(process.env.PORT ?? 4000);
const app = createApp();

serve({ fetch: app.fetch, port });
console.log(`Senay API listening on http://localhost:${port}`);

void ensurePublicSiteImagesImported().catch((error) => {
  const message = error instanceof Error ? error.message : "Media seed failed";
  console.warn(`Public image import skipped: ${message}`);
});
