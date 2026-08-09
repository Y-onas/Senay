/**
 * Dynamic menu navigation handler.
 * All menu items come from the BotMenu table — no hardcoded menus.
 * Handles callbacks like "menu:order", "menu:faq", "menu:back:main", etc.
 */
import { prisma } from "../../lib/prisma.js";
import type { BotContext } from "../middleware/user.js";
import { getText, resolveI18n } from "../helpers/localize.js";
import { buildMenuKeyboard, buildServiceKeyboard, buildWebAppButton } from "../helpers/keyboard.js";
import { buildWebAppUrl } from "../helpers/webapp-url.js";
import { formatBotContact, getBotContactDetails, replyWithBotLocations } from "../helpers/contact.js";

/**
 * Handle all menu:* callback queries.
 */
export async function handleMenuCallback(ctx: BotContext): Promise<void> {
  const data = ctx.callbackQuery?.data;
  if (!data?.startsWith("menu:")) return;

  const lang = ctx.session.lang;
  await ctx.answerCallbackQuery();

  // Handle back navigation
  if (data.startsWith("menu:back:")) {
    const backTarget = data.replace("menu:back:", "");
    if (backTarget === "main") {
      // Go to main menu
      const welcome = await getText("welcome", lang);
      const mainMenu = await buildMenuKeyboard(null, lang);
      try {
        await ctx.editMessageText(welcome, {
          reply_markup: mainMenu,
          parse_mode: "HTML",
        });
      } catch {
        await ctx.reply(welcome, { reply_markup: mainMenu, parse_mode: "HTML" });
      }
      return;
    }

    // Navigate to the parent of the back target
    const targetMenu = await prisma.botMenu.findUnique({ where: { key: backTarget } });
    const parentKey = targetMenu?.parentKey ?? null;
    const header = parentKey
      ? await getText("select_option", lang)
      : await getText("welcome", lang);
    const keyboard = await buildMenuKeyboard(parentKey, lang);

    try {
      await ctx.editMessageText(header, { reply_markup: keyboard, parse_mode: "HTML" });
    } catch {
      await ctx.reply(header, { reply_markup: keyboard, parse_mode: "HTML" });
    }
    return;
  }

  // Get the menu item that was clicked
  const menuKey = data.replace("menu:", "");
  const menuItem = await prisma.botMenu.findUnique({ where: { key: menuKey } });

  if (!menuItem || !menuItem.enabled) {
    await ctx.reply(lang === "am" ? "ይህ አማራጭ አሁን አይገኝም።" : "This option is currently unavailable.");
    return;
  }

  // Route based on action type
  switch (menuItem.action) {
    case "submenu": {
      // Show child menu items
      const children = await prisma.botMenu.findMany({
        where: { parentKey: menuItem.key, enabled: true },
        orderBy: { sortOrder: "asc" },
      });

      if (children.length === 0) {
        await ctx.reply(lang === "am" ? "ምንም አማራጭ የለም።" : "No options available.");
        return;
      }

      const header = await getText("select_option", lang);
      const keyboard = await buildMenuKeyboard(menuItem.key, lang);

      try {
        await ctx.editMessageText(header, { reply_markup: keyboard, parse_mode: "HTML" });
      } catch {
        await ctx.reply(header, { reply_markup: keyboard, parse_mode: "HTML" });
      }
      break;
    }

    case "services": {
      // Show dynamic services list from Service table
      const header = await getText("select_service", lang);
      const keyboard = await buildServiceKeyboard(lang);

      try {
        await ctx.editMessageText(header, { reply_markup: keyboard, parse_mode: "HTML" });
      } catch {
        await ctx.reply(header, { reply_markup: keyboard, parse_mode: "HTML" });
      }
      break;
    }

    case "faq": {
      // Delegate to FAQ handler — handled in faq.ts via separate import
      // Send a signal callback that faq.ts picks up
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
        // Truncate long questions for button text
        const short = question.length > 60 ? question.slice(0, 57) + "..." : question;
        kb.text(`❓ ${short}`, `faq:${faq.id}`).row();
      }

      kb.text(lang === "am" ? "↩️ ተመለስ" : "↩️ Back", "menu:back:main").row();

      try {
        await ctx.editMessageText(faqHeader, { reply_markup: kb, parse_mode: "HTML" });
      } catch {
        await ctx.reply(faqHeader, { reply_markup: kb, parse_mode: "HTML" });
      }
      break;
    }

    case "contact": {
      // Fetch contact info from site settings
      const contactHeader = await getText("contact_header", lang);
      const contactParts = formatBotContact(await getBotContactDetails(lang));
      const contactText = contactParts.length > 0
        ? `${contactHeader}\n\n${contactParts.join("\n")}`
        : contactHeader;

      const { InlineKeyboard: IK } = await import("grammy");
      const backKb = new IK().text(
        lang === "am" ? "↩️ ተመለስ" : "↩️ Back",
        "menu:back:main",
      );

      try {
        await ctx.editMessageText(contactText, { reply_markup: backKb, parse_mode: "HTML" });
      } catch {
        await ctx.reply(contactText, { reply_markup: backKb, parse_mode: "HTML" });
      }
      break;
    }

    case "about": {
      // Fetch about info from pages or settings
      const aboutHeader = await getText("about_header", lang);
      const aboutContent = await getText("about_content", lang);

      const text = aboutContent && aboutContent !== "about_content"
        ? `${aboutHeader}\n\n${aboutContent}`
        : aboutHeader;

      const { InlineKeyboard: IK2 } = await import("grammy");
      const backKb2 = new IK2().text(
        lang === "am" ? "↩️ ተመለስ" : "↩️ Back",
        "menu:back:main",
      );

      try {
        await ctx.editMessageText(text, { reply_markup: backKb2, parse_mode: "HTML" });
      } catch {
        await ctx.reply(text, { reply_markup: backKb2, parse_mode: "HTML" });
      }
      break;
    }

    case "location": {
      await replyWithBotLocations(ctx, lang);
      break;
    }

    case "webapp": {
      // Open website as Telegram WebApp — user sees native UI, no URL exposed
      const webAppBaseUrl = process.env.WEBAPP_URL || "http://localhost:5173";
      const servicePath = menuItem.actionData;
      if (!servicePath) {
        await ctx.reply(
          lang === "am"
            ? "የዚህ አማራጭ ገጽ ገና አልተዘጋጀም።"
            : "This option does not have a WebApp page configured yet.",
        );
        break;
      }
      const fullUrl = buildWebAppUrl(webAppBaseUrl, servicePath, lang);
      const isHttps = webAppBaseUrl.startsWith("https://");

      const label = resolveI18n(menuItem.label, menuItem.labelI18n, lang);
      const buttonLabel = lang === "am" ? `${label} ክፈት ➤` : `Open ${label} ➤`;

      const { InlineKeyboard: WK } = await import("grammy");
      const keyboard = new WK();

      if (isHttps) {
        keyboard.webApp(buttonLabel, fullUrl).row();
      } else {
        keyboard.url(`🌐 ${buttonLabel}`, fullUrl).row();
      }

      keyboard.text(lang === "am" ? "↩️ ተመለስ" : "↩️ Back", "menu:back:main").row();

      const openPrompt = await getText("open_webapp", lang);

      try {
        await ctx.editMessageText(openPrompt, { reply_markup: keyboard, parse_mode: "HTML" });
      } catch {
        await ctx.reply(openPrompt, { reply_markup: keyboard, parse_mode: "HTML" });
      }
      break;
    }

    default: {
      await ctx.reply(lang === "am" ? "ይህ ትዕዛዝ ገና አልተገነባም።" : "This feature is coming soon.");
    }
  }
}
