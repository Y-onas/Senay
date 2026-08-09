/**
 * Register all bot middleware and handlers on a Grammy instance.
 */
import { Bot } from "grammy";
import { userTrackingMiddleware, type BotContext } from "./middleware/user.js";
import { botEnabledMiddleware } from "./middleware/enabled.js";
import { blockedUserMiddleware } from "./middleware/blocked.js";
import {
  handleStart,
  buildReplyKeyboard,
  getLanguageButtonLabel,
} from "./handlers/start.js";
import { handleLanguageSelection } from "./handlers/language.js";
import { handleMenuCallback } from "./handlers/menu.js";
import { handleServiceCallback } from "./handlers/services.js";
import { handleFaqCallback } from "./handlers/faq.js";
import { getText, resolveI18n } from "./helpers/localize.js";
import { buildLanguageKeyboard, buildServiceKeyboard } from "./helpers/keyboard.js";
import { prisma } from "../lib/prisma.js";
import { buildWebAppUrl } from "./helpers/webapp-url.js";
import { formatBotContact, getBotContactDetails, replyWithBotLocations } from "./helpers/contact.js";
import { getTelegramSettings, resolveWebAppBaseUrl } from "../lib/botConfig.js";

export function registerBotHandlers(bot: Bot<BotContext>): void {
  bot.use(userTrackingMiddleware);
  bot.use(blockedUserMiddleware);
  bot.use(botEnabledMiddleware);

  bot.command("start", handleStart);

  bot.command("myid", async (ctx) => {
    await ctx.reply(
      `Your Telegram chat ID is <code>${ctx.from?.id}</code>\n\nCopy it into the admin's Telegram chat ID field in the dashboard.`,
      { parse_mode: "HTML" },
    );
  });

  bot.command("language", async (ctx) => {
    const prompt = await getText("language_prompt", ctx.session.lang);
    const settings = await getTelegramSettings();
    await ctx.reply(prompt, {
      reply_markup: buildLanguageKeyboard(settings.supportedLanguages),
    });
  });

  bot.command("order", async (ctx) => {
    const lang = ctx.session.lang;
    const header = await getText("select_service", lang);
    const keyboard = await buildServiceKeyboard(lang);
    await ctx.reply(header, { reply_markup: keyboard, parse_mode: "HTML" });
  });

  bot.command("contact", async (ctx) => {
    const lang = ctx.session.lang;
    const contactHeader = await getText("contact_header", lang);
    const parts = formatBotContact(await getBotContactDetails(lang));
    const contactText = parts.length > 0 ? `${contactHeader}\n\n${parts.join("\n")}` : contactHeader;
    await ctx.reply(contactText, { parse_mode: "HTML" });
  });

  bot.command("help", async (ctx) => {
    const lang = ctx.session.lang;
    const helpText = await getText("help", lang);

    if (helpText && helpText !== "help") {
      await ctx.reply(helpText, { parse_mode: "HTML" });
    } else {
      const text =
        lang === "am"
          ? `📖 <b>የሚገኙ ትዕዛዞች</b>\n\n/start — ዋና ምናሌ\n/order — ትዕዛዝ\n/language — ቋንቋ ቀይር\n/contact — አግኙን\n/help — እርዳታ`
          : `📖 <b>Available Commands</b>\n\n/start — Main menu\n/order — Place an order\n/language — Change language\n/contact — Contact us\n/help — Show this help`;
      await ctx.reply(text, { parse_mode: "HTML" });
    }
  });

  bot.callbackQuery(/^lang:/, handleLanguageSelection);
  bot.callbackQuery(/^menu:/, handleMenuCallback);
  bot.callbackQuery(/^service:/, handleServiceCallback);
  bot.callbackQuery(/^faq:/, handleFaqCallback);

  bot.on("callback_query:data", async (ctx) => {
    await ctx.answerCallbackQuery({
      text: ctx.session.lang === "am" ? "ያልታወቀ ትዕዛዝ" : "Unknown action",
    });
  });

  bot.on("message:text", async (ctx) => {
    const lang = ctx.session.lang;
    const text = ctx.message.text.trim();

    if (text === getLanguageButtonLabel(lang)) {
      const prompt = await getText("language_prompt", lang);
      const settings = await getTelegramSettings();
      await ctx.reply(prompt, { reply_markup: buildLanguageKeyboard(settings.supportedLanguages) });
      return;
    }

    const menuItems = await prisma.botMenu.findMany({
      where: { parentKey: null, enabled: true },
      orderBy: { sortOrder: "asc" },
    });

    for (const item of menuItems) {
      const label = resolveI18n(item.label, item.labelI18n, lang);
      const buttonText = item.icon ? `${item.icon} ${label}` : label;

      if (text === buttonText || text === label) {
        switch (item.action) {
          case "services": {
            const header = await getText("select_service", lang);
            const keyboard = await buildServiceKeyboard(lang);
            await ctx.reply(header, { reply_markup: keyboard, parse_mode: "HTML" });
            return;
          }

          case "faq": {
            const faqs = await prisma.faq.findMany({
              where: { published: true },
              orderBy: { sortOrder: "asc" },
            });

            if (faqs.length === 0) {
              await ctx.reply(lang === "am" ? "ምንም FAQ የለም።" : "No FAQs available.");
              return;
            }

            const { InlineKeyboard } = await import("grammy");
            const kb = new InlineKeyboard();
            const faqHeader = await getText("faq_header", lang);

            for (const faq of faqs) {
              const question = resolveI18n(faq.question, faq.questionI18n, lang);
              const short = question.length > 60 ? question.slice(0, 57) + "..." : question;
              kb.text(`❓ ${short}`, `faq:${faq.id}`).row();
            }

            kb.text(lang === "am" ? "↩️ ተመለስ" : "↩️ Back", "menu:back:main").row();
            await ctx.reply(faqHeader, { reply_markup: kb, parse_mode: "HTML" });
            return;
          }

          case "contact": {
            const contactHeader = await getText("contact_header", lang);
            const parts = formatBotContact(await getBotContactDetails(lang));
            const contactText =
              parts.length > 0 ? `${contactHeader}\n\n${parts.join("\n")}` : contactHeader;
            await ctx.reply(contactText, { parse_mode: "HTML" });
            return;
          }

          case "about": {
            const aboutHeader = await getText("about_header", lang);
            const aboutContent = await getText("about_content", lang);
            const aboutText =
              aboutContent && aboutContent !== "about_content"
                ? `${aboutHeader}\n\n${aboutContent}`
                : aboutHeader;
            await ctx.reply(aboutText, { parse_mode: "HTML" });
            return;
          }

          case "location": {
            await replyWithBotLocations(ctx, lang);
            return;
          }

          case "webapp": {
            const settings = await getTelegramSettings();
            const webAppBaseUrl = resolveWebAppBaseUrl(settings);
            const servicePath = item.actionData;
            if (!servicePath) {
              await ctx.reply(
                lang === "am"
                  ? "የዚህ አማራጭ ገጽ ገና አልተዘጋጀም።"
                  : "This option does not have a WebApp page configured yet.",
              );
              return;
            }
            const fullUrl = buildWebAppUrl(webAppBaseUrl, servicePath, lang);
            const isHttps = webAppBaseUrl.startsWith("https://");
            const wLabel = resolveI18n(item.label, item.labelI18n, lang);
            const buttonLabel = lang === "am" ? `${wLabel} ክፈት ➤` : `Open ${wLabel} ➤`;

            const { InlineKeyboard: WK } = await import("grammy");
            const keyboard = new WK();
            if (isHttps) {
              keyboard.webApp(buttonLabel, fullUrl).row();
            } else {
              keyboard.url(`🌐 ${buttonLabel}`, fullUrl).row();
            }

            const openPrompt = await getText("open_webapp", lang);
            await ctx.reply(openPrompt, { reply_markup: keyboard, parse_mode: "HTML" });
            return;
          }

          default: {
            const { buildMenuKeyboard } = await import("./helpers/keyboard.js");
            const header = await getText("select_option", lang);
            const keyboard = await buildMenuKeyboard(item.key, lang);
            await ctx.reply(header, { reply_markup: keyboard, parse_mode: "HTML" });
            return;
          }
        }
      }
    }

    const welcome = await getText("welcome", lang);
    const replyKb = await buildReplyKeyboard(lang);
    await ctx.reply(welcome, {
      reply_markup: replyKb,
      parse_mode: "HTML",
    });
  });

  bot.catch((err) => {
    console.error("[Bot Error]", err.message);
    console.error(err.stack);
  });
}
