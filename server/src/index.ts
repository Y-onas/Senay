import "dotenv/config";
import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { ensurePublicSiteImagesImported } from "./lib/import-public-images.js";

const port = Number(process.env.PORT ?? 4000);
const app = createApp();

await ensurePublicSiteImagesImported();

console.log(`Senay API listening on http://localhost:${port}`);
serve({ fetch: app.fetch, port });
