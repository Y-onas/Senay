/**
 * /start command handler.
 * First-time users → language selection.
 * Returning users → welcome message + persistent reply keyboard at bottom.
 */
import { Keyboard } from "grammy";
import type { BotContext } from "../middleware/user.js";
import { getText, resolveI18n } from "../helpers/localize.js";
import { buildLanguageKeyboard } from "../helpers/keyboard.js";
import { prisma } from "../../lib/prisma.js";
import { getTelegramSettings } from "../../lib/botConfig.js";

/** Label used by the persistent keyboard for changing the interface language. */
export function getLanguageButtonLabel(lang: string): string {
  return lang === "am" ? "🌐 ቋንቋ ቀይር" : "🌐 Change language";
}

/**
 * Build persistent reply keyboard (bottom buttons) from BotMenu items.
 */
async function buildReplyKeyboard(lang: string): Promise<Keyboard> {
  const items = await prisma.botMenu.findMany({
    where: { parentKey: null, enabled: true },
    orderBy: { sortOrder: "asc" },
  });

  const kb = new Keyboard();

  // Arrange in 2-column grid
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const label = resolveI18n(item.label, item.labelI18n, lang);
    const buttonText = item.icon ? `${item.icon} ${label}` : label;
    kb.text(buttonText);
    // New row every 2 buttons
    if (i % 2 === 1) kb.row();
  }

  // Language is a core bot action rather than a content-menu item, so always
  // expose it even when the administrator has not created a menu record for it.
  if (items.length % 2 === 1) kb.row();
  kb.text(getLanguageButtonLabel(lang)).row();

  // Make sure keyboard stays persistent
  kb.resized().persistent();

  return kb;
}

export { buildReplyKeyboard };

export async function handleStart(ctx: BotContext): Promise<void> {
  const lang = ctx.session.lang;

  // First-time users pick a language when more than one is supported.
  if (ctx.session.isNewUser) {
    const settings = await getTelegramSettings();
    const supported = settings.supportedLanguages.length
      ? settings.supportedLanguages
      : (["en", "am"] as const);

    if (supported.length === 1) {
      const welcome = await getText("welcome", supported[0]);
      const replyKb = await buildReplyKeyboard(supported[0]);
      await ctx.reply(welcome, { reply_markup: replyKb, parse_mode: "HTML" });
      return;
    }

    const prompt = await getText("language_prompt", settings.defaultLanguage);
    await ctx.reply(prompt, {
      reply_markup: buildLanguageKeyboard(supported),
    });
    return;
  }

  // Returning user → show welcome + persistent bottom menu
  const welcome = await getText("welcome", lang);
  const replyKb = await buildReplyKeyboard(lang);

  await ctx.reply(welcome, {
    reply_markup: replyKb,
    parse_mode: "HTML",
  });
}
