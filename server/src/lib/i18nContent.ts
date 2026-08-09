export const SUPPORTED_LOCALES = ["en", "am"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export type LocaleCode = SupportedLocale | (string & {});

export type LocalizedText = Partial<Record<LocaleCode, string>>;

const LOCALE_KEY_RE = /^[a-z]{2}(?:-[a-z]{2})?$/i;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isLocaleKey(key: string): boolean {
  return LOCALE_KEY_RE.test(key);
}

const NON_LOCALIZED_STRING_KEYS = new Set([
  "src",
  "url",
  "href",
  "slug",
  "id",
  "key",
  "image",
  "icon",
  "emoji",
  "category",
  "type",
  "status",
  "color",
  "email",
  "phone",
  "videoUrl",
  "videoId",
  "platform",
  "location",
  "ctaHref",
  "buttonHref",
  "buttonLink",
  "link",
  "variant",
  "year",
  "mapUrl",
]);

function shouldResolvePlainString(key?: string): boolean {
  if (!key) return false;
  return !NON_LOCALIZED_STRING_KEYS.has(key);
}

function getFirstNonEmpty(values: Array<unknown>): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

export function normalizeLocale(input: string | null | undefined): SupportedLocale {
  const next = (input ?? "").toLowerCase();
  if (next === "am") return "am";
  return "en";
}

export function isLocalizedText(value: unknown): value is LocalizedText {
  if (!isPlainObject(value)) return false;

  const keys = Object.keys(value);
  if (!keys.length) return false;
  if (!keys.some((key) => key === "en" || key === "am")) return false;
  if (!keys.every((key) => isLocaleKey(key))) return false;

  return keys.every((key) => {
    const entry = value[key];
    return typeof entry === "string" || entry == null;
  });
}

export function toLocalizedText(
  value: unknown,
  fallbackLocale: LocaleCode = "en",
): LocalizedText {
  if (isLocalizedText(value)) {
    const next: LocalizedText = {};
    for (const [key, entry] of Object.entries(value)) {
      if (typeof entry === "string") next[key] = entry;
    }
    return next;
  }

  if (typeof value === "string") {
    return { [fallbackLocale]: value };
  }

  return {};
}

export function resolveLocalizedText(
  value: unknown,
  locale: LocaleCode = "en",
  fallbackLocale: LocaleCode = "en",
): string {
  if (typeof value === "string") {
    return normalizeLocale(locale) === "en" ? value : "";
  }
  if (!isLocalizedText(value)) return "";

  const normalizedLocale = normalizeLocale(locale);
  const direct = value[normalizedLocale];
  if (typeof direct === "string" && direct.trim()) return direct;
  if (normalizedLocale === "en") {
    const normalizedFallback = normalizeLocale(fallbackLocale);
    const fallback = value[normalizedFallback];
    if (typeof fallback === "string" && fallback.trim()) return fallback;
  }
  return "";
}

export function deepNormalizeLocalizedTree(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => deepNormalizeLocalizedTree(entry));
  }
  if (!isPlainObject(value)) return value;
  if (isLocalizedText(value)) return toLocalizedText(value);

  const next: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    next[key] = deepNormalizeLocalizedTree(entry);
  }
  return next;
}

export function deepResolveLocalizedTree(
  value: unknown,
  locale: LocaleCode = "en",
  fallbackLocale: LocaleCode = "en",
  key?: string,
): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) =>
      deepResolveLocalizedTree(entry, locale, fallbackLocale, key),
    );
  }
  if (typeof value === "string") {
    if (shouldResolvePlainString(key)) {
      return resolveLocalizedText(value, locale, fallbackLocale);
    }
    return value;
  }
  if (!isPlainObject(value)) return value;
  if (isLocalizedText(value)) {
    return resolveLocalizedText(value, locale, fallbackLocale);
  }

  const next: Record<string, unknown> = {};
  for (const [entryKey, entry] of Object.entries(value)) {
    next[entryKey] = deepResolveLocalizedTree(
      entry,
      locale,
      fallbackLocale,
      entryKey,
    );
  }
  return next;
}

/**
 * Blog-safe resolver:
 * - Legacy plain strings stay visible in every locale (until bilingual maps exist)
 * - `{ en, am }` maps resolve to the requested locale, falling back to EN when AM is empty
 * - List item arrays of LocalizedText maps resolve item-by-item
 */
export function resolveLocalizedTextWithFallback(
  value: unknown,
  locale: LocaleCode = "en",
  fallbackLocale: LocaleCode = "en",
): string {
  if (typeof value === "string") return value;
  if (!isLocalizedText(value)) return "";

  const normalizedLocale = normalizeLocale(locale);
  const direct = value[normalizedLocale];
  if (typeof direct === "string" && direct.trim()) return direct;

  const normalizedFallback = normalizeLocale(fallbackLocale);
  const fallback = value[normalizedFallback] ?? value.en;
  if (typeof fallback === "string" && fallback.trim()) return fallback;
  return "";
}

export function deepResolveBlogContent(
  value: unknown,
  locale: LocaleCode = "en",
  fallbackLocale: LocaleCode = "en",
  key?: string,
): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) =>
      deepResolveBlogContent(entry, locale, fallbackLocale),
    );
  }
  if (typeof value === "string") {
    // Legacy plain body/caption text remains readable in AM until translated.
    if (shouldResolvePlainString(key)) return value;
    return value;
  }
  if (!isPlainObject(value)) return value;
  if (isLocalizedText(value)) {
    return resolveLocalizedTextWithFallback(value, locale, fallbackLocale);
  }

  const next: Record<string, unknown> = {};
  for (const [entryKey, entry] of Object.entries(value)) {
    next[entryKey] = deepResolveBlogContent(
      entry,
      locale,
      fallbackLocale,
      entryKey,
    );
  }
  return next;
}

export function localizeStringField(
  value: string | null | undefined,
  localeMap: unknown,
): string | null | undefined {
  if (isLocalizedText(localeMap)) {
    const resolved = resolveLocalizedText(localeMap, "en", "en");
    return resolved || value || "";
  }
  return value;
}
