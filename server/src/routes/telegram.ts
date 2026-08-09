/**
 * Telegram-specific API routes.
 * These endpoints support the bot and WebApp integration.
 */
import { Hono } from "hono";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../lib/auth.js";
import { validateWebAppData, WEBAPP_AUTH_CLIENT_ERROR } from "../bot/helpers/webapp-auth.js";
import { resolveLocalizedText, isLocalizedText } from "../lib/i18nContent.js";
import { resolveBotToken } from "../lib/botConfig.js";
import { getWebhookHandler } from "../bot/singleton.js";

export const telegramRoutes = new Hono();

function resolveI18n(base: string | null | undefined, i18nMap: unknown, lang: string): string {
  if (isLocalizedText(i18nMap)) {
    const resolved = resolveLocalizedText(i18nMap, lang, "en");
    if (resolved && resolved.trim()) return resolved;
  }
  return base ?? "";
}

// ── Public endpoints (used by bot & WebApp) ──────────────────────────────────

/** Telegram webhook receiver (used when BOT_MODE=webhook). */
telegramRoutes.post("/webhook", async (c) => {
  try {
    const handler = await getWebhookHandler();
    return await handler(c);
  } catch (error) {
    console.error("[Telegram Webhook]", error);
    return c.json({ error: "Bot is not configured" }, 503);
  }
});

/** Verify WebApp initData — call this from the WebApp frontend before trusting user identity. */
telegramRoutes.post("/verify-webapp", async (c) => {
  const body = await c.req.json();
  const { initData } = body as { initData?: string };

  if (!initData) {
    return c.json({ error: "Missing initData" }, 400);
  }

  const botToken = resolveBotToken();
  const result = validateWebAppData(initData, botToken);

  if (!result.valid) {
    console.warn("[Telegram WebApp] verify-webapp failed:", result.error);
    return c.json({ error: WEBAPP_AUTH_CLIENT_ERROR, valid: false }, 401);
  }

  // If valid, also return the linked TelegramUser from our DB
  let telegramUser = null;
  if (result.user) {
    telegramUser = await prisma.telegramUser.findUnique({
      where: { telegramId: BigInt(result.user.id) },
      select: {
        id: true,
        telegramId: true,
        username: true,
        firstName: true,
        lastName: true,
        languageCode: true,
      },
    });
  }

  return c.json({
    valid: true,
    user: result.user,
    telegramUser: telegramUser
      ? { ...telegramUser, telegramId: telegramUser.telegramId.toString() }
      : null,
  });
});

/** Get bot menus for a given parent key. */
telegramRoutes.get("/menus", async (c) => {
  const parentKey = c.req.query("parentKey") ?? null;
  const lang = c.req.query("lang") ?? "en";

  const items = await prisma.botMenu.findMany({
    where: { parentKey: parentKey || null, enabled: true },
    orderBy: { sortOrder: "asc" },
  });

  return c.json({
    data: items.map((item) => ({
      ...item,
      label: resolveI18n(item.label, item.labelI18n, lang),
    })),
  });
});

/** Get a bot message by key. */
telegramRoutes.get("/messages/:key", async (c) => {
  const lang = c.req.query("lang") ?? "en";
  const row = await prisma.botMessage.findUnique({
    where: { key: c.req.param("key") },
  });

  if (!row) return c.json({ error: "Not found" }, 404);

  return c.json({
    data: {
      key: row.key,
      text: resolveI18n(row.text, row.textI18n, lang),
    },
  });
});

/** Get Telegram user profile. */
telegramRoutes.get("/user/:telegramId", requireAuth, async (c) => {
  const telegramIdParam = c.req.param("telegramId");
  if (!telegramIdParam) return c.json({ error: "Telegram user ID is required" }, 400);

  let telegramId: bigint;
  try {
    telegramId = BigInt(telegramIdParam);
  } catch {
    return c.json({ error: "Invalid Telegram user ID" }, 400);
  }
  const user = await prisma.telegramUser.findUnique({
    where: { telegramId },
    include: {
      requests: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { service: { select: { name: true, slug: true } } },
      },
    },
  });

  if (!user) return c.json({ error: "User not found" }, 404);

  return c.json({
    data: {
      ...user,
      telegramId: user.telegramId.toString(),
      requests: user.requests.map((r) => ({
        ...r,
        totalAmount: r.totalAmount ? Number(r.totalAmount) : null,
      })),
    },
  });
});
