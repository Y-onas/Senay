/**
 * Admin notification service.
 * Sends Telegram messages to admins when new requests arrive.
 * Admin chat IDs come from the database (Admin.telegramChatId), not hardcoded.
 */
import { Bot } from "grammy";
import { prisma } from "../lib/prisma.js";
import { resolveBotToken, shouldNotifyAdmins } from "../lib/botConfig.js";

let botInstance: Bot | null = null;

async function getBotApi() {
  if (botInstance?.api) return botInstance.api;
  const botToken = resolveBotToken();
  return botToken ? new Bot(botToken).api : null;
}

/** Register the bot instance for sending notifications. */
export function setNotificationBot(bot: Bot): void {
  botInstance = bot;
}

/**
 * Send a notification to all admins with a telegramChatId configured.
 */
export async function notifyAdmins(message: string): Promise<void> {
  if (!(await shouldNotifyAdmins())) {
    console.log("[Bot Notifications] Admin notifications disabled in dashboard settings.");
    return;
  }
  // The API server and the polling bot can run as separate processes. Use the
  // configured token directly when no in-process bot instance is available.
  const botApi = await getBotApi();
  if (!botApi) {
    console.warn("[Bot Notifications] BOT_TOKEN is not configured — skipping notification.");
    return;
  }

  try {
    const admins = await prisma.admin.findMany({
      where: {
        telegramChatId: { not: null },
        status: "ACTIVE",
      },
      select: { telegramChatId: true, name: true },
    });

    const envAdminIds = (process.env.ADMIN_IDS || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    const recipientIds = [...new Set([
      ...admins.map((admin) => admin.telegramChatId!),
      ...envAdminIds,
    ])];

    if (recipientIds.length === 0) {
      console.log("[Bot Notifications] No Telegram admin recipients are configured.");
      return;
    }

    const results = await Promise.allSettled(
      recipientIds.map((chatId) =>
        botApi.sendMessage(chatId, message, {
          parse_mode: "HTML",
        }),
      ),
    );

    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      console.warn(`[Bot Notifications] Failed to notify ${failed.length}/${recipientIds.length} admins.`);
    }
  } catch (err) {
    console.error("[Bot Notifications] Error sending notifications:", err);
  }
}

/** Send a confirmation only to the Telegram account authenticated by WebApp data. */
export async function notifyTelegramUser(telegramId: string, message: string): Promise<boolean> {
  const botApi = await getBotApi();
  if (!botApi) {
    console.warn("[Bot Notifications] BOT_TOKEN is not configured â€” customer confirmation skipped.");
    return false;
  }

  try {
    await botApi.sendMessage(telegramId, message, { parse_mode: "HTML" });
    return true;
  } catch (error) {
    console.warn("[Bot Notifications] Customer confirmation could not be delivered:", error);
    return false;
  }
}

/**
 * Format and send a new service request notification to admins.
 */
export async function notifyNewRequest(request: {
  reference: string;
  customerName: string;
  phone: string;
  serviceName: string;
  serviceSlug: string;
  source: string;
  packageSummary?: string | null;
  totalAmount?: number | null;
  notes?: string | null;
  telegramUsername?: string | null;
}): Promise<void> {
  const sourceLabel = request.source === "TELEGRAM" ? "🤖 Telegram" : "🌐 Website";

  let message = `🔔 <b>New ${request.serviceName} Request</b>\n\n`;
  message += `📋 <b>Reference:</b> ${request.reference}\n`;
  message += `👤 <b>Customer:</b> ${request.customerName}\n`;
  message += `📞 <b>Phone:</b> ${request.phone}\n`;
  message += `📦 <b>Service:</b> ${request.serviceName}\n`;
  message += `📱 <b>Source:</b> ${sourceLabel}\n`;

  if (request.telegramUsername) {
    message += `💬 <b>Telegram:</b> @${request.telegramUsername}\n`;
  }
  if (request.packageSummary) {
    message += `📝 <b>Package:</b> ${request.packageSummary}\n`;
  }
  if (request.totalAmount) {
    message += `💰 <b>Amount:</b> ${request.totalAmount.toLocaleString()} ETB\n`;
  }
  if (request.notes) {
    message += `\n📌 <b>Notes:</b> ${request.notes}`;
  }

  await notifyAdmins(message);
}

/**
 * Also support sending directly via ADMIN_IDS env var as fallback.
 * This ensures notifications work even before admins set their telegramChatId.
 */
export async function notifyAdminIds(message: string): Promise<void> {
  if (!botInstance) return;

  const adminIds = (process.env.ADMIN_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (adminIds.length === 0) return;

  await Promise.allSettled(
    adminIds.map((chatId) =>
      botInstance!.api.sendMessage(chatId, message, { parse_mode: "HTML" }),
    ),
  );
}
