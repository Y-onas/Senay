/**
 * Admin notification service.
 * Sends Telegram messages to admins when new requests arrive.
 * Admin chat IDs come from the database (Admin.telegramChatId), not hardcoded.
 */
import { Bot, InlineKeyboard } from "grammy";
import { prisma } from "../lib/prisma.js";
import { resolveBotToken, resolveWebsiteBaseUrl, shouldNotifyAdmins } from "../lib/botConfig.js";
import { escapeHtml } from "./helpers/html.js";

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

/** Public origin used for admin deep-links (must be reachable from the admin's phone). */
function resolveAdminSiteOrigin(): string {
  const fromEnv = (
    process.env.ADMIN_SITE_URL?.trim() ||
    process.env.WEBAPP_URL?.trim() ||
    process.env.WEBSITE_BASE_URL?.trim() ||
    resolveWebsiteBaseUrl()
  ).replace(/\/+$/, "");
  return fromEnv || "http://localhost:3000";
}

export function buildAdminRequestUrl(requestId: string): string {
  return `${resolveAdminSiteOrigin()}/st-hq/requests/${encodeURIComponent(requestId)}`;
}

type NotifyOptions = {
  reply_markup?: InlineKeyboard;
};

/**
 * Send a notification to all admins with a telegramChatId configured.
 */
export async function notifyAdmins(message: string, options: NotifyOptions = {}): Promise<void> {
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
          link_preview_options: { is_disabled: true },
          ...(options.reply_markup ? { reply_markup: options.reply_markup } : {}),
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
    console.warn("[Bot Notifications] BOT_TOKEN is not configured — customer confirmation skipped.");
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
  id: string;
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
  const serviceName = escapeHtml(request.serviceName);
  const reference = escapeHtml(request.reference);
  const customerName = escapeHtml(request.customerName);
  const phone = escapeHtml(request.phone);
  const adminUrl = buildAdminRequestUrl(request.id);
  const safeUrl = escapeHtml(adminUrl);

  let message = `🔔 <b>New ${serviceName} Request</b>\n\n`;
  message += `📋 <b>Reference:</b> ${reference}\n`;
  message += `👤 <b>Customer:</b> ${customerName}\n`;
  message += `📞 <b>Phone:</b> ${phone}\n`;
  message += `📦 <b>Service:</b> ${serviceName}\n`;
  message += `📱 <b>Source:</b> ${sourceLabel}\n`;

  if (request.telegramUsername) {
    message += `💬 <b>Telegram:</b> @${escapeHtml(request.telegramUsername)}\n`;
  }
  if (request.packageSummary) {
    message += `📝 <b>Package:</b> ${escapeHtml(request.packageSummary)}\n`;
  }
  if (request.totalAmount) {
    message += `💰 <b>Amount:</b> ${request.totalAmount.toLocaleString()} ETB\n`;
  }
  if (request.notes) {
    message += `\n📌 <b>Notes:</b> ${escapeHtml(request.notes)}\n`;
  }

  message += `\n🔗 <a href="${safeUrl}">Open request in admin</a>`;

  const keyboard = new InlineKeyboard().url("Open request", adminUrl);

  await notifyAdmins(message, { reply_markup: keyboard });
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
