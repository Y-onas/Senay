import type { NextFunction } from "grammy";
import { isBotEnabled } from "../../lib/botConfig.js";
import type { BotContext } from "./user.js";

/** Skip bot handlers when disabled in the admin dashboard. */
export async function botEnabledMiddleware(
  ctx: BotContext,
  next: NextFunction,
): Promise<void> {
  const enabled = await isBotEnabled();
  if (enabled) {
    await next();
    return;
  }

  const lang = ctx.session?.lang === "am" ? "am" : "en";
  const text =
    lang === "am"
      ? "🤖 ቦቱ ጊዜያዊ መዝጋቱ ላይ ነው። እባክዎ ትንሽ ቆይተው ይሞክሩ።"
      : "🤖 The bot is temporarily offline. Please try again later.";

  if (ctx.callbackQuery) {
    await ctx.answerCallbackQuery({ text, show_alert: true });
    return;
  }

  await ctx.reply(text);
}
