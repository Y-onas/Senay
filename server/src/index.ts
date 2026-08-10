import "dotenv/config";
import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { ensurePublicSiteImagesImported } from "./lib/import-public-images.js";
import {
  resolveBotToken,
  resolveWebhookUrl,
  syncTelegramWebhook,
  touchBotHeartbeat,
} from "./lib/botConfig.js";

const port = Number(process.env.PORT ?? 4000);
const app = createApp();

serve({ fetch: app.fetch, port });
console.log(`Senay API listening on http://localhost:${port}`);

/** In webhook mode the API receives updates — register the URL with Telegram on boot. */
async function bootstrapBotWebhook() {
  const mode = (process.env.BOT_MODE || "polling").trim();
  if (mode !== "webhook") return;

  const token = resolveBotToken();
  const webhookUrl = resolveWebhookUrl();
  if (!token) {
    console.warn("[Bot] BOT_MODE=webhook but BOT_TOKEN is missing — bot will not receive updates.");
    return;
  }
  if (!webhookUrl) {
    console.warn("[Bot] BOT_MODE=webhook but BOT_WEBHOOK_URL is missing — bot will not receive updates.");
    return;
  }

  try {
    await syncTelegramWebhook(token, webhookUrl);
    console.log(`[Bot] Webhook registered: ${webhookUrl}`);
    void touchBotHeartbeat();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Bot] Failed to register webhook: ${message}`);
  }
}

void bootstrapBotWebhook();

void ensurePublicSiteImagesImported().catch((error) => {
  const message = error instanceof Error ? error.message : "Media seed failed";
  console.warn(`Public image import skipped: ${message}`);
});
