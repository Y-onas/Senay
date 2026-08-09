/**
 * Keyboard builder utilities.
 * Builds Telegram inline keyboards from database-driven menus and services.
 */
import { InlineKeyboard } from "grammy";
import { prisma } from "../../lib/prisma.js";
import { resolveI18n } from "./localize.js";

/**
 * Build an inline keyboard from BotMenu items for a given parentKey.
 * Items with parentKey === null are root (main menu) items.
 */
export async function buildMenuKeyboard(
  parentKey: string | null,
  lang: string,
): Promise<InlineKeyboard> {
  const items = await prisma.botMenu.findMany({
    where: { parentKey, enabled: true },
    orderBy: { sortOrder: "asc" },
  });

  const kb = new InlineKeyboard();

  for (const item of items) {
    const label = resolveI18n(item.label, item.labelI18n, lang);
    const buttonText = item.icon ? `${item.icon} ${label}` : label;

    if (item.action === "webapp" && item.actionData) {
      // WebApp buttons need special handling — added by the handler
      kb.text(buttonText, `menu:${item.key}`).row();
    } else {
      kb.text(buttonText, `menu:${item.key}`).row();
    }
  }

  // Add back button if we're in a submenu
  if (parentKey !== null) {
    const backLabel = lang === "am" ? "↩️ ተመለስ" : "↩️ Back";
    // Navigate to parent's parent — or main menu
    kb.text(backLabel, `menu:back:${parentKey}`).row();
  }

  return kb;
}

/**
 * Build inline keyboard from enabled services for the Order flow.
 */
export async function buildServiceKeyboard(lang: string): Promise<InlineKeyboard> {
  const services = await prisma.service.findMany({
    where: { enabled: true },
    orderBy: { sortOrder: "asc" },
  });

  const kb = new InlineKeyboard();

  for (const service of services) {
    const name = resolveI18n(service.name, service.nameI18n, lang);
    kb.text(name, `service:${service.slug}`).row();
  }

  const backLabel = lang === "am" ? "↩️ ተመለስ" : "↩️ Back";
  kb.text(backLabel, "menu:back:main").row();

  return kb;
}

/**
 * Build a WebApp launch button.
 * The URL is hidden from the user — they only see a native Telegram button.
 */
export function buildWebAppButton(
  webAppUrl: string,
  label: string,
): InlineKeyboard {
  return new InlineKeyboard().webApp(label, webAppUrl);
}

/**
 * Build the language selection keyboard from dashboard-supported languages.
 */
export function buildLanguageKeyboard(
  supportedLanguages: ReadonlyArray<"en" | "am"> = ["en", "am"],
): InlineKeyboard {
  const kb = new InlineKeyboard();
  const langs = supportedLanguages.length ? supportedLanguages : (["en", "am"] as const);

  if (langs.includes("en")) kb.text("🇬🇧 English", "lang:en");
  if (langs.includes("am")) kb.text("🇪🇹 አማርኛ", "lang:am");
  kb.row();

  return kb;
}
