/**
 * Service listing & info handler.
 * Shows services from the database and opens WebApp for ordering.
 * Handles callbacks like "service:catering", "service:agelgil", etc.
 */
import { prisma } from "../../lib/prisma.js";
import type { BotContext } from "../middleware/user.js";
import { getText, resolveI18n } from "../helpers/localize.js";
import { InlineKeyboard } from "grammy";
import { hrefForServiceSlug } from "../../lib/serviceRoutes.js";
import { buildWebAppUrl } from "../helpers/webapp-url.js";
import { getTelegramSettings, resolveWebAppBaseUrl } from "../../lib/botConfig.js";

/**
 * Handle service:* callback queries.
 * Shows service info + WebApp "Continue to Order" button.
 */
export async function handleServiceCallback(ctx: BotContext): Promise<void> {
  const data = ctx.callbackQuery?.data;
  if (!data?.startsWith("service:")) return;

  const lang = ctx.session.lang;
  const slug = data.replace("service:", "");
  await ctx.answerCallbackQuery();

  // Fetch service from database
  const service = await prisma.service.findUnique({
    where: { slug },
  });

  if (!service || !service.enabled) {
    const msg = lang === "am"
      ? "ይህ አገልግሎት አሁን አይገኝም።"
      : "This service is currently unavailable.";
    await ctx.reply(msg);
    return;
  }

  // Build service info message
  const name = resolveI18n(service.name, service.nameI18n, lang);
  const description = resolveI18n(service.description, service.descriptionI18n, lang);

  const infoText = `<b>${name}</b>\n\n${description}`;

  const settings = await getTelegramSettings();
  const webAppBaseUrl = resolveWebAppBaseUrl(settings);
  // Service slugs are database values; public paths are defined in one shared
  // map. Catering therefore opens `/catering`, not `/order/catering`.
  const servicePath = service.webAppPath || hrefForServiceSlug(service.slug);
  if (!servicePath) {
    await ctx.reply(
      lang === "am"
        ? "ይህ አገልግሎት ገጽ ገና አልተዘጋጀም።"
        : "This service page is not configured yet.",
    );
    return;
  }
  const fullUrl = buildWebAppUrl(webAppBaseUrl, servicePath, lang);
  const continueLabel = await getText("open_webapp", lang);
  const isHttps = webAppBaseUrl.startsWith("https://");

  const kb = new InlineKeyboard();

  if (isHttps) {
    // Production: native Telegram WebApp button (no URL visible to user)
    kb.webApp(`${continueLabel} ➤`, fullUrl).row();
  } else {
    // Development: WebApp requires HTTPS — show URL button as fallback
    kb.url(`🌐 ${continueLabel} ➤`, fullUrl).row();
  }

  kb.text(lang === "am" ? "↩️ ተመለስ" : "↩️ Back", "menu:order").row();

  try {
    await ctx.editMessageText(infoText, {
      reply_markup: kb,
      parse_mode: "HTML",
    });
  } catch {
    await ctx.reply(infoText, {
      reply_markup: kb,
      parse_mode: "HTML",
    });
  }
}
