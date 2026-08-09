/**
 * Bot entry point.
 * Initializes Grammy bot, registers all middleware and handlers,
 * then starts in polling or webhook mode based on BOT_MODE env.
 *
 * Run:  npm run bot       (dev — watch mode)
 *       npm run bot:start  (production)
 */
import "dotenv/config";
import { Bot } from "grammy";
import { setNotificationBot } from "./notifications.js";
import { registerBotHandlers } from "./register.js";
import {
  getTelegramSettings,
  resolveBotToken,
  resolveWebhookUrl,
  syncTelegramWebhook,
  touchBotHeartbeat,
} from "../lib/botConfig.js";
import type { BotContext } from "./middleware/user.js";

async function startBot() {
  const settings = await getTelegramSettings();
  const token = resolveBotToken();

  if (!token) {
    console.error("❌ Bot token is not configured. Set BOT_TOKEN in .env or save it in the admin dashboard.");
    process.exit(1);
  }

  const bot = new Bot<BotContext>(token);
  registerBotHandlers(bot);
  setNotificationBot(bot as unknown as Bot);

  const mode = process.env.BOT_MODE || "polling";
  console.log(`\n🤖 Senay Tela Bot starting in ${mode} mode...`);

  if (mode === "webhook") {
    const webhookUrl = resolveWebhookUrl();
    if (!webhookUrl) {
      console.error("❌ Webhook URL is required in webhook mode (dashboard or BOT_WEBHOOK_URL)");
      process.exit(1);
    }
    await syncTelegramWebhook(token, webhookUrl);
    console.log(`✅ Webhook set to: ${webhookUrl}`);
    console.log("ℹ️  Updates are delivered to the API server. Keep the API process running.\n");
    return;
  }

  await bot.api.deleteWebhook();

  await bot.api.setMyCommands([
    { command: "start", description: "Main menu" },
    { command: "order", description: "Place an order" },
    { command: "language", description: "Change language" },
    { command: "contact", description: "Contact us" },
    { command: "help", description: "Show help" },
    { command: "myid", description: "Show your Telegram chat ID" },
  ]);

  console.log("✅ Bot commands registered with Telegram");
  console.log("✅ Bot is running. Press Ctrl+C to stop.\n");

  bot.start({
    onStart: (botInfo) => {
      console.log(`🤖 Bot started as @${botInfo.username}`);
      void touchBotHeartbeat();
      setInterval(() => {
        void touchBotHeartbeat();
      }, 60_000);
    },
  });
}

startBot().catch((err) => {
  console.error("❌ Failed to start bot:", err);
  process.exit(1);
});

export {};
