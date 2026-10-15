import { InlineKeyboard } from "grammy";
import { prisma } from "../../lib/prisma.js";
import {
  deepResolveLocalizedTree,
  normalizeLocale,
} from "../../lib/i18nContent.js";
import { escapeHtml, safeHttpUrl } from "./html.js";
import { getText, resolveI18n } from "./localize.js";
import type { BotContext } from "../middleware/user.js";

export type BotContactDetails = {
  phone?: string;
  email?: string;
};

export type BotLocationBranch = {
  id: string;
  name: string;
  area: string;
  mapUrl: string;
};

export type BotLocations = {
  title: string;
  description: string;
  branches: BotLocationBranch[];
};

function stringValue(value: unknown, lang: string): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value && typeof value === "object") {
    const localized = resolveI18n("", value, lang).trim();
    if (localized) return localized;
  }
  return undefined;
}

/**
 * Phone and email come from the Contact Us CMS (`page:contact`) — the same
 * source as the website. Restaurant / legacy settings are fallbacks only.
 * Do not use restaurant.address here: that was a leftover Bole pin that is
 * not on the Contact Us page. Branches live under Locations / /location.
 */
export async function getBotContactDetails(lang: string): Promise<BotContactDetails> {
  const [pageSetting, restaurantSetting, legacySetting] = await Promise.all([
    prisma.siteSetting.findUnique({ where: { key: "page:contact" } }),
    prisma.siteSetting.findUnique({ where: { key: "restaurant" } }),
    prisma.siteSetting.findUnique({ where: { key: "contact" } }),
  ]);

  const page = (pageSetting?.value && typeof pageSetting.value === "object"
    ? pageSetting.value
    : {}) as Record<string, unknown>;
  const restaurant = (restaurantSetting?.value && typeof restaurantSetting.value === "object"
    ? restaurantSetting.value
    : {}) as Record<string, unknown>;
  const legacy = (legacySetting?.value && typeof legacySetting.value === "object"
    ? legacySetting.value
    : {}) as Record<string, unknown>;

  const value = (key: string) =>
    stringValue(page[key], lang)
    ?? stringValue(restaurant[key], lang)
    ?? stringValue(legacy[key], lang);

  return {
    phone: value("phone"),
    email: value("email"),
  };
}

export function formatBotContact(details: BotContactDetails, lang: string): string[] {
  const parts: string[] = [];
  if (details.phone) parts.push(`📞 ${details.phone}`);
  if (details.email) parts.push(`📧 ${details.email}`);
  parts.push(
    lang === "am"
      ? "📍 ቅርንጫፍ ቦታዎችን ለማየት /location ይጠቀሙ ወይም ከታች ያለውን ቁልፍ ይጫኑ።"
      : "📍 For branch locations, use /location or tap Locations below.",
  );
  return parts;
}

export function buildBotContactKeyboard(lang: string): InlineKeyboard {
  return new InlineKeyboard()
    .text(lang === "am" ? "📍 ቦታዎች" : "📍 Locations", "menu:location")
    .row()
    .text(lang === "am" ? "↩️ ተመለስ" : "↩️ Back", "menu:back:main");
}

export async function replyWithBotContact(ctx: BotContext, lang: string): Promise<void> {
  const fallbackHeader = lang === "am" ? "📞 አግኙን" : "📞 Contact Us";
  const headerRaw = await getText("contact_header", lang);
  const header = headerRaw && headerRaw !== "contact_header" ? headerRaw : fallbackHeader;
  const parts = formatBotContact(await getBotContactDetails(lang), lang);
  const text = parts.length > 0 ? `${header}\n\n${parts.join("\n")}` : header;
  const keyboard = buildBotContactKeyboard(lang);

  try {
    if (ctx.callbackQuery) {
      await ctx.editMessageText(text, { reply_markup: keyboard, parse_mode: "HTML" });
      return;
    }
  } catch {
    // Fall through to a new message if the previous one cannot be edited.
  }
  await ctx.reply(text, { reply_markup: keyboard, parse_mode: "HTML" });
}

/**
 * Branch locations from Contact page CMS (`page:contact` setting).
 * Uses the same Locations section as the website — EN/AM names, areas, map URLs (no images).
 */
export async function getBotLocations(lang: string): Promise<BotLocations | null> {
  const row = await prisma.siteSetting.findUnique({ where: { key: "page:contact" } });
  if (!row?.value || typeof row.value !== "object") return null;

  const locale = normalizeLocale(lang);
  const resolved = deepResolveLocalizedTree(row.value, locale, "en") as Record<
    string,
    unknown
  >;

  const branchesRaw = resolved.branches;
  if (!Array.isArray(branchesRaw) || branchesRaw.length === 0) return null;

  const branches: BotLocationBranch[] = [];
  for (const entry of branchesRaw) {
    if (!entry || typeof entry !== "object") continue;
    const branch = entry as Record<string, unknown>;
    const name = typeof branch.name === "string" ? branch.name.trim() : "";
    const area = typeof branch.area === "string" ? branch.area.trim() : "";
    const mapUrl = typeof branch.mapUrl === "string" ? branch.mapUrl.trim() : "";
    const id =
      typeof branch.id === "string" && branch.id.trim()
        ? branch.id.trim()
        : name.toLowerCase().replace(/\s+/g, "-");
    if (!name && !mapUrl) continue;
    branches.push({ id, name, area, mapUrl });
  }

  if (branches.length === 0) return null;

  const title =
    typeof resolved.locationsTitle === "string" && resolved.locationsTitle.trim()
      ? resolved.locationsTitle.trim()
      : locale === "am"
        ? "ቦታዎች"
        : "Locations";

  const description =
    typeof resolved.locationsDescription === "string"
      ? resolved.locationsDescription.trim()
      : "";

  return { title, description, branches };
}

export function formatBotLocationsMessage(loc: BotLocations, lang: string): string {
  const openMap =
    lang === "am" ? "በ Google Maps ይክፈቱ" : "Open in Google Maps";
  const lines: string[] = [`📍 <b>${escapeHtml(loc.title)}</b>`];

  if (loc.description) {
    lines.push("", escapeHtml(loc.description));
  }

  for (const branch of loc.branches) {
    lines.push("");
    if (branch.name) lines.push(`<b>${escapeHtml(branch.name)}</b>`);
    if (branch.area) lines.push(escapeHtml(branch.area));
    const mapUrl = safeHttpUrl(branch.mapUrl);
    if (mapUrl) {
      lines.push(`🗺 <a href="${escapeHtml(mapUrl)}">${openMap}</a>`);
    }
  }

  return lines.join("\n");
}

export function buildBotLocationsKeyboard(
  loc: BotLocations,
  lang: string,
): InlineKeyboard {
  const kb = new InlineKeyboard();
  for (const branch of loc.branches) {
    const mapUrl = safeHttpUrl(branch.mapUrl);
    if (!mapUrl) continue;
    const label =
      branch.name.length > 36 ? `${branch.name.slice(0, 33)}…` : branch.name;
    kb.url(`📍 ${label}`, mapUrl).row();
  }
  kb.text(lang === "am" ? "↩️ ተመለስ" : "↩️ Back", "menu:back:main").row();
  return kb;
}

/** Send branch locations from the Contact Us page CMS. */
export async function replyWithBotLocations(ctx: BotContext, lang: string): Promise<void> {
  const locations = await getBotLocations(lang);
  if (locations) {
    const text = formatBotLocationsMessage(locations, lang);
    const keyboard = buildBotLocationsKeyboard(locations, lang);
    try {
      if (ctx.callbackQuery) {
        await ctx.editMessageText(text, {
          reply_markup: keyboard,
          parse_mode: "HTML",
        });
      } else {
        await ctx.reply(text, { reply_markup: keyboard, parse_mode: "HTML" });
      }
    } catch {
      await ctx.reply(text, { reply_markup: keyboard, parse_mode: "HTML" });
    }
    return;
  }

  await ctx.reply(
    lang === "am"
      ? "📍 ቅርንጫፍ ቦታዎች ገና አልተቀመጡም። በ Contact Us ገጽ ላይ ይጨምሩ።"
      : "📍 Branch locations are not configured yet. Add them on the Contact Us page.",
  );
}
