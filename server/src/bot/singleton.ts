import { Bot } from "grammy";
import { getTelegramSettings, resolveBotToken } from "../lib/botConfig.js";
import { registerBotHandlers } from "./register.js";
import { setNotificationBot } from "./notifications.js";
import type { BotContext } from "./middleware/user.js";

let botInstance: Bot<BotContext> | null = null;

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

export function resetBotInstance(): void {
  botInstance = null;
}
