/**
 * Language selection callback handler.
 * Triggered when user presses 🇬🇧 English or 🇪🇹 አማርኛ.
 */
import { prisma } from "../../lib/prisma.js";
import type { BotContext } from "../middleware/user.js";
import { getText } from "../helpers/localize.js";
import { buildReplyKeyboard } from "./start.js";
import { getTelegramSettings } from "../../lib/botConfig.js";

/**
 * Handle language callback: "lang:en" or "lang:am"
 */
export async function handleLanguageSelection(ctx: BotContext): Promise<void> {
  const data = ctx.callbackQuery?.data;
  if (!data?.startsWith("lang:")) return;

  const lang = data.split(":")[1]; // "en" or "am"
  if (lang !== "en" && lang !== "am") return;

  const settings = await getTelegramSettings();
  const supported = settings.supportedLanguages.length
    ? settings.supportedLanguages
    : (["en", "am"] as const);
  if (!supported.includes(lang)) return;

  // Update user language in database
  await prisma.telegramUser.update({
    where: { id: ctx.session.telegramUserId },
    data: { languageCode: lang },
  });

  // Update session
  ctx.session.lang = lang;

  // Acknowledge the callback
  await ctx.answerCallbackQuery();

  // Send confirmation
  const confirmation = await getText("language_updated", lang);
  const welcome = await getText("welcome", lang);

  // Delete the language selection message
  try {
    await ctx.deleteMessage();
  } catch {
    // Ignore if can't delete
  }

  // Send welcome + persistent bottom keyboard
  const replyKb = await buildReplyKeyboard(lang);

  await ctx.reply(`${confirmation}\n\n${welcome}`, {
    reply_markup: replyKb,
    parse_mode: "HTML",
  });
}
