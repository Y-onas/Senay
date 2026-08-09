/**
 * Bot localization helpers.
 * Reads translatable text from the BotMessage table so admins can edit
 * every string the bot sends — without touching code.
 */
import { prisma } from "../../lib/prisma.js";
import {
  resolveLocalizedText,
  isLocalizedText,
  type LocalizedText,
} from "../../lib/i18nContent.js";

// ── In-memory cache (invalidated every 60 s) ────────────────────────────────

const CACHE_TTL_MS = 60_000;
let messageCache: Map<string, { text: string; textI18n: unknown }> = new Map();
let cacheLoadedAt = 0;

async function ensureCache() {
  if (Date.now() - cacheLoadedAt < CACHE_TTL_MS && messageCache.size > 0) return;
  const rows = await prisma.botMessage.findMany();
  messageCache = new Map(rows.map((r) => [r.key, { text: r.text, textI18n: r.textI18n }]));
  cacheLoadedAt = Date.now();
}

/** Force-reload message cache (call after admin edits). */
export function invalidateMessageCache() {
  cacheLoadedAt = 0;
}

// ── Public helpers ───────────────────────────────────────────────────────────

/**
 * Get a bot message by key, resolved to the user's language.
 * Supports `{placeholder}` interpolation.
 */
export async function getText(
  key: string,
  lang: string = "en",
  vars?: Record<string, string>,
): Promise<string> {
  await ensureCache();
  const row = messageCache.get(key);
  if (!row) return key; // fallback: return the key itself

  let resolved: string;
  if (isLocalizedText(row.textI18n)) {
    resolved = resolveLocalizedText(row.textI18n as LocalizedText, lang, "en");
  }
  // If i18n resolution returned empty, use base text
  if (!resolved! || !resolved.trim()) {
    resolved = row.text;
  }

  // Interpolate variables like {reference}, {name}, etc.
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      resolved = resolved.replaceAll(`{${k}}`, v);
    }
  }

  return resolved;
}

/**
 * Resolve an i18n JSON field (e.g. from Service, BotMenu) to a string.
 */
export function resolveI18n(
  base: string | null | undefined,
  i18nMap: unknown,
  lang: string = "en",
): string {
  if (isLocalizedText(i18nMap)) {
    const resolved = resolveLocalizedText(i18nMap as LocalizedText, lang, "en");
    if (resolved && resolved.trim()) return resolved;
  }
  return base ?? "";
}
