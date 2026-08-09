import type { NextFunction } from "grammy";
import type { BotContext } from "./user.js";

/** Stop processing updates from users blocked in the admin dashboard. */
export async function blockedUserMiddleware(
  ctx: BotContext,
  next: NextFunction,
): Promise<void> {
  if (!ctx.session?.isBlocked) {
    await next();
    return;
  }

  const lang = ctx.session.lang === "am" ? "am" : "en";
  const text =
    lang === "am"
      ? "⛔ ይህን ቦት መጠቀም አይችሉም።"
      : "⛔ You cannot use this bot.";

  if (ctx.callbackQuery) {
    await ctx.answerCallbackQuery({ text, show_alert: true });
    return;
  }

  await ctx.reply(text);
}
