import { InlineKeyboard } from "grammy";
import { prisma } from "../../lib/prisma.js";
import {
  deepResolveLocalizedTree,
  normalizeLocale,
} from "../../lib/i18nContent.js";
import { resolveI18n } from "./localize.js";
import type { BotContext } from "../middleware/user.js";

export type BotContactDetails = {
  phone?: string;
  email?: string;
  address?: string;
  mapUrl?: string;
  latitude?: number;
  longitude?: number;
  social?: Record<string, string>;
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stringValue(value: unknown, lang: string): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value && typeof value === "object") {
    const localized = resolveI18n("", value, lang).trim();
    if (localized) return localized;
  }
  return undefined;
}

/**
 * Read the same dashboard-managed restaurant settings used by the site.
 * The legacy `contact` record remains a fallback for existing installations.
 */
export async function getBotContactDetails(lang: string): Promise<BotContactDetails> {
  const [restaurantSetting, legacySetting] = await Promise.all([
    prisma.siteSetting.findUnique({ where: { key: "restaurant" } }),
    prisma.siteSetting.findUnique({ where: { key: "contact" } }),
  ]);

  const restaurant = (restaurantSetting?.value && typeof restaurantSetting.value === "object"
    ? restaurantSetting.value
    : {}) as Record<string, unknown>;
  const legacy = (legacySetting?.value && typeof legacySetting.value === "object"
    ? legacySetting.value
    : {}) as Record<string, unknown>;
  const value = (key: string) => stringValue(restaurant[key], lang) ?? stringValue(legacy[key], lang);

  const latitude = Number(restaurant.latitude ?? legacy.latitude);
  const longitude = Number(restaurant.longitude ?? legacy.longitude);
  const socialSource = restaurant.social ?? legacy.social;
  const social = socialSource && typeof socialSource === "object"
    ? Object.fromEntries(
      Object.entries(socialSource as Record<string, unknown>)
        .map(([key, item]) => [key, stringValue(item, lang)])
        .filter((entry): entry is [string, string] => Boolean(entry[1])),
    )
    : undefined;

  return {
    phone: value("phone"),
    email: value("email"),
    address: value("address"),
    mapUrl: value("mapUrl"),
    latitude: Number.isFinite(latitude) ? latitude : undefined,
    longitude: Number.isFinite(longitude) ? longitude : undefined,
    social,
  };
}

export function formatBotContact(details: BotContactDetails): string[] {
  const parts: string[] = [];
  if (details.phone) parts.push(`📞 ${details.phone}`);
  if (details.email) parts.push(`📧 ${details.email}`);
  if (details.address) parts.push(`📍 ${details.address}`);
  if (details.social?.telegram) parts.push(`💬 Telegram: ${details.social.telegram}`);
  if (details.social?.instagram) parts.push(`📸 Instagram: ${details.social.instagram}`);
  if (details.social?.facebook) parts.push(`👥 Facebook: ${details.social.facebook}`);
  if (details.social?.tiktok) parts.push(`🎵 TikTok: ${details.social.tiktok}`);
  return parts;
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
    if (branch.mapUrl) {
      lines.push(`🗺 <a href="${branch.mapUrl}">${openMap}</a>`);
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
    if (!branch.mapUrl) continue;
    const label =
      branch.name.length > 36 ? `${branch.name.slice(0, 33)}…` : branch.name;
    kb.url(`📍 ${label}`, branch.mapUrl).row();
  }
  kb.text(lang === "am" ? "↩️ ተመለስ" : "↩️ Back", "menu:back:main").row();
  return kb;
}

/** Send branch locations from Contact page CMS, with legacy single-pin fallback. */
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

  const contact = await getBotContactDetails(lang);
  if (contact.latitude !== undefined && contact.longitude !== undefined) {
    await ctx.replyWithLocation(contact.latitude, contact.longitude);
    return;
  }
  if (contact.mapUrl) {
    await ctx.reply(`📍 ${contact.mapUrl}`);
    return;
  }
  if (contact.address) {
    await ctx.reply(`📍 ${contact.address}`);
    return;
  }
  await ctx.reply(
    lang === "am" ? "📍 አድራሻ ገና አልተቀመጠም።" : "📍 Location not yet configured.",
  );
}
