/**
 * FAQ display handler.
 * Shows FAQ answers when user clicks a specific question.
 * Handles callbacks like "faq:<id>".
 */
import { prisma } from "../../lib/prisma.js";
import type { BotContext } from "../middleware/user.js";
import { escapeHtml } from "../helpers/html.js";
import { resolveI18n } from "../helpers/localize.js";
import { InlineKeyboard } from "grammy";

/**
 * Handle faq:* callback queries.
 */
export async function handleFaqCallback(ctx: BotContext): Promise<void> {
  const data = ctx.callbackQuery?.data;
  if (!data?.startsWith("faq:")) return;

  const lang = ctx.session.lang;
  const faqId = data.replace("faq:", "");
  await ctx.answerCallbackQuery();

  const faq = await prisma.faq.findUnique({ where: { id: faqId } });
  if (!faq) {
    await ctx.reply(lang === "am" ? "ይህ ጥያቄ አልተገኘም።" : "This FAQ was not found.");
    return;
  }

  const question = escapeHtml(resolveI18n(faq.question, faq.questionI18n, lang));
  const answer = escapeHtml(resolveI18n(faq.answer, faq.answerI18n, lang));

  const text = `<b>❓ ${question}</b>\n\n${answer}`;

  const kb = new InlineKeyboard()
    .text(lang === "am" ? "↩️ ወደ FAQ ተመለስ" : "↩️ Back to FAQ", "menu:faq")
    .row()
    .text(lang === "am" ? "🏠 ዋና ምናሌ" : "🏠 Main Menu", "menu:back:main")
    .row();

  try {
    await ctx.editMessageText(text, {
      reply_markup: kb,
      parse_mode: "HTML",
    });
  } catch {
    await ctx.reply(text, {
      reply_markup: kb,
      parse_mode: "HTML",
    });
  }
}
