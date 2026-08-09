import { z } from "zod";
import { isLocalizedText, type LocalizedText } from "./i18nContent.js";

/** Plain EN string (legacy) or `{ en, am }` map. */
export const localizedStringSchema = z.union([
  z.string(),
  z
    .object({
      en: z.string().optional(),
      am: z.string().optional(),
    })
    .passthrough()
    .refine((value) => isLocalizedText(value), {
      message: "Expected localized text map",
    }),
]);

export type LocalizedString = z.infer<typeof localizedStringSchema>;

const imageItemSchema = z.object({
  url: z.string(),
  caption: localizedStringSchema.optional(),
});

export const blogBlockSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string(),
    type: z.literal("paragraph"),
    text: localizedStringSchema,
  }),
  z.object({
    id: z.string(),
    type: z.literal("heading"),
    level: z.union([z.literal(2), z.literal(3)]).default(2),
    text: localizedStringSchema,
  }),
  z.object({
    id: z.string(),
    type: z.literal("quote"),
    text: localizedStringSchema,
    attribution: localizedStringSchema.optional(),
  }),
  z.object({
    id: z.string(),
    type: z.literal("list"),
    style: z.enum(["bullet", "numbered"]).default("bullet"),
    items: z.array(localizedStringSchema),
  }),
  z.object({
    id: z.string(),
    type: z.literal("image"),
    url: z.string(),
    caption: localizedStringSchema.optional(),
    layout: z.enum(["default", "wide", "full"]).default("default"),
  }),
  z.object({
    id: z.string(),
    type: z.literal("gallery"),
    images: z.array(imageItemSchema),
  }),
  z.object({
    id: z.string(),
    type: z.literal("columns"),
    images: z.array(imageItemSchema),
  }),
  z.object({
    id: z.string(),
    type: z.literal("cta"),
    text: localizedStringSchema,
    buttonText: localizedStringSchema,
    buttonLink: z.string(),
  }),
  z.object({ id: z.string(), type: z.literal("divider") }),
]);

export type BlogBlock = z.infer<typeof blogBlockSchema>;

/** EN (or first available) plain string for legacy `content[]` sync. */
export function plainFromLocalized(value: unknown): string {
  if (typeof value === "string") return value;
  if (isLocalizedText(value)) {
    const map = value as LocalizedText;
    if (typeof map.en === "string" && map.en.trim()) return map.en;
    if (typeof map.am === "string" && map.am.trim()) return map.am;
  }
  return "";
}

export function blocksFromLegacyContent(content: string[]): BlogBlock[] {
  return content
    .map((text) => text.trim())
    .filter(Boolean)
    .map((text, index) => ({
      id: `legacy-${index}`,
      type: "paragraph" as const,
      text,
    }));
}

export function normalizeBlocks(
  blocks: unknown,
  content: string[] = [],
): BlogBlock[] {
  const parsed = z.array(blogBlockSchema).safeParse(blocks);
  if (parsed.success && parsed.data.length > 0) return parsed.data;
  if (!parsed.success && Array.isArray(blocks) && blocks.length > 0) {
    console.warn("normalizeBlocks: invalid block payload", parsed.error.issues);
  }
  return blocksFromLegacyContent(content);
}

export function paragraphTextsForContent(blocks: BlogBlock[]): string[] {
  return blocks
    .filter((block) => block.type === "paragraph")
    .map((block) => plainFromLocalized(block.text));
}
