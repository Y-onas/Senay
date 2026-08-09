import { Bot } from "grammy";
import { webhookCallback } from "grammy";
import type { Context as HonoContext } from "hono";
import { getTelegramSettings, resolveBotToken, resolveWebhookSecretToken } from "../lib/botConfig.js";
import { registerBotHandlers } from "./register.js";
import { setNotificationBot } from "./notifications.js";
import type { BotContext } from "./middleware/user.js";

let botInstance: Bot<BotContext> | null = null;
let webhookHandler: ((c: HonoContext) => Promise<Response | void>) | null = null;

/** Lazy singleton used by the API webhook endpoint and notification helpers. */
export async function getBot(): Promise<Bot<BotContext>> {
  if (botInstance) return botInstance;

  const token = resolveBotToken();
  if (!token) {
    throw new Error("Bot token is not configured");
  }

  const bot = new Bot<BotContext>(token);
  registerBotHandlers(bot);
  setNotificationBot(bot as unknown as Bot);
  botInstance = bot;
  return bot;
}

/** Pre-built Hono webhook handler with secret-token verification. */
export async function getWebhookHandler(): Promise<(c: HonoContext) => Promise<Response | void>> {
  if (webhookHandler) return webhookHandler;

  const bot = await getBot();
  const secretToken = resolveWebhookSecretToken();
  if (!secretToken && process.env.NODE_ENV === "production") {
    throw new Error("BOT_WEBHOOK_SECRET must be set in production");
  }

  webhookHandler = webhookCallback(bot, "hono", {
    secretToken: secretToken || undefined,
  });
  return webhookHandler;
}

export function resetBotInstance(): void {
  botInstance = null;
  webhookHandler = null;
}
