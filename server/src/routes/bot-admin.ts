/**
 * Admin routes for Telegram Bot management.
 * CRUD for BotMenu, BotMessage, and TelegramUser viewing.
 */
import { Hono } from "hono";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../lib/auth.js";
import { invalidateMessageCache } from "../bot/helpers/localize.js";
import {
  isLocalizedText,
  resolveLocalizedText,
  toLocalizedText,
} from "../lib/i18nContent.js";
import {
  getBotHeartbeat,
  getTelegramEnvConfig,
  getTelegramSettings,
  resolveBotToken,
  resolveWebhookUrl,
  resolveWebsiteBaseUrl,
} from "../lib/botConfig.js";

export const botAdminRoutes = new Hono();

function syncLocalizedField(
  baseValue: string | null | undefined,
  i18nValue: unknown,
): { base: string | null | undefined; i18n: Prisma.InputJsonValue | undefined } {
  if (isLocalizedText(i18nValue)) {
    const map = toLocalizedText(i18nValue);
    const resolved = resolveLocalizedText(map, "en", "en");
    return {
      base: resolved || baseValue,
      i18n: map as Prisma.InputJsonValue,
    };
  }
  return { base: baseValue, i18n: undefined };
}

// All routes require admin authentication
botAdminRoutes.use("/*", requireAuth);

// ── Bot notification admins (telegramChatId recipients) ───────────────────────────────

/**
 * List active admins that can receive Telegram notifications.
 * Includes admins even if `telegramChatId` is currently not set so you can add a new recipient.
 */
botAdminRoutes.get("/admins", async (c) => {
  const admins = await prisma.admin.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, telegramChatId: true },
  });

  return c.json({ data: admins });
});

/**
 * Update an admin's Telegram notification chat id.
 * Rule: you must always keep at least ONE active admin with `telegramChatId` set.
 */
botAdminRoutes.patch("/admins/:id", async (c) => {
  const body = z
    .object({
      telegramChatId: z
        .string()
        .trim()
        .transform((s) => (s === "" ? null : s))
        .nullable()
        .refine((v) => v === null || /^-?\d+$/.test(v), {
          message: "telegramChatId must be a number (optionally with leading '-')",
        }),
    })
    .safeParse(await c.req.json());

  if (!body.success) return c.json({ error: "Invalid body", details: body.error.flatten() }, 400);

  const id = c.req.param("id");
  const current = await prisma.admin.findUnique({
    where: { id },
    select: { id: true, name: true, status: true, telegramChatId: true },
  });
  if (!current) return c.json({ error: "Admin not found" }, 404);
  if (current.status !== "ACTIVE") return c.json({ error: "Admin must be ACTIVE" }, 400);

  // If removing the last notification recipient, block the action.
  if (body.data.telegramChatId === null && current.telegramChatId !== null) {
    const remaining = await prisma.admin.count({
      where: { status: "ACTIVE", telegramChatId: { not: null }, id: { not: current.id } },
    });
    if (remaining < 1) {
      return c.json({ error: "Cannot remove the last bot notification admin" }, 400);
    }
  }

  const updated = await prisma.admin.update({
    where: { id: current.id },
    data: { telegramChatId: body.data.telegramChatId },
    select: { id: true, name: true, telegramChatId: true },
  });

  return c.json({ data: updated });
});

// ── Bot Menu CRUD ────────────────────────────────────────────────────────────

/** List all bot menus as a flat list (admin builds tree in UI). */
botAdminRoutes.get("/menus", async (c) => {
  const menus = await prisma.botMenu.findMany({
    orderBy: [{ parentKey: "asc" }, { sortOrder: "asc" }],
  });
  return c.json({ data: menus });
});

/** Create a new menu item. */
botAdminRoutes.post("/menus", async (c) => {
  const body = z
    .object({
      key: z.string().min(1).regex(/^[a-z0-9_]+$/, "Key must be lowercase letters, numbers, underscores"),
      parentKey: z.string().nullable().optional(),
      label: z.string().min(1),
      labelI18n: z.record(z.string(), z.string()).optional(),
      action: z.enum(["submenu", "services", "webapp", "faq", "contact", "about", "location", "callback"]).default("submenu"),
      actionData: z.string().nullable().optional(),
      icon: z.string().nullable().optional(),
      enabled: z.boolean().optional(),
      sortOrder: z.number().int().optional(),
    })
    .safeParse(await c.req.json());

  if (!body.success) return c.json({ error: "Invalid body", details: body.error.flatten() }, 400);

  const menu = await prisma.botMenu.create({
    data: {
      ...body.data,
      parentKey: body.data.parentKey ?? null,
    },
  });
  return c.json({ data: menu }, 201);
});

/** Update a menu item. */
botAdminRoutes.patch("/menus/:id", async (c) => {
  const body = z
    .object({
      label: z.string().optional(),
      labelI18n: z.record(z.string(), z.string()).optional(),
      action: z.string().optional(),
      actionData: z.string().nullable().optional(),
      icon: z.string().nullable().optional(),
      enabled: z.boolean().optional(),
      sortOrder: z.number().int().optional(),
      parentKey: z.string().nullable().optional(),
    })
    .safeParse(await c.req.json());

  if (!body.success) return c.json({ error: "Invalid body" }, 400);

  const menu = await prisma.botMenu.update({
    where: { id: c.req.param("id") },
    data: body.data,
  });
  return c.json({ data: menu });
});

/** Delete a menu item. */
botAdminRoutes.delete("/menus/:id", async (c) => {
  await prisma.botMenu.delete({ where: { id: c.req.param("id") } });
  return c.json({ ok: true });
});

/** Reorder menu items. */
botAdminRoutes.post("/menus/reorder", async (c) => {
  const body = z.object({ ids: z.array(z.string()) }).safeParse(await c.req.json());
  if (!body.success) return c.json({ error: "Invalid body" }, 400);

  await prisma.$transaction(
    body.data.ids.map((id, index) =>
      prisma.botMenu.update({ where: { id }, data: { sortOrder: index + 1 } }),
    ),
  );
  return c.json({ ok: true });
});

// ── Service order descriptions (shown when user picks a service in the bot) ──

/** List enabled services with localized descriptions for the Telegram admin UI. */
botAdminRoutes.get("/services", async (c) => {
  const services = await prisma.service.findMany({
    where: { enabled: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      nameI18n: true,
      description: true,
      descriptionI18n: true,
      sortOrder: true,
    },
  });
  return c.json({ data: services });
});

/** Update the description shown in the bot when a user opens a service. */
botAdminRoutes.patch("/services/:id", async (c) => {
  const body = z
    .object({
      description: z.string().optional(),
      descriptionI18n: z.record(z.string(), z.string()).optional(),
    })
    .safeParse(await c.req.json());

  if (!body.success) return c.json({ error: "Invalid body", details: body.error.flatten() }, 400);

  const existing = await prisma.service.findUnique({
    where: { id: c.req.param("id") },
  });
  if (!existing) return c.json({ error: "Not found" }, 404);

  const localizedDescription = syncLocalizedField(
    body.data.description ?? existing.description,
    body.data.descriptionI18n ?? existing.descriptionI18n,
  );

  const service = await prisma.service.update({
    where: { id: existing.id },
    data: {
      description:
        localizedDescription.base ??
        body.data.description ??
        undefined,
      descriptionI18n: localizedDescription.i18n,
    },
    select: {
      id: true,
      slug: true,
      name: true,
      nameI18n: true,
      description: true,
      descriptionI18n: true,
      sortOrder: true,
    },
  });

  return c.json({ data: service });
});

// ── Bot Messages CRUD ────────────────────────────────────────────────────────

/** List all bot messages. */
botAdminRoutes.get("/messages", async (c) => {
  const messages = await prisma.botMessage.findMany({
    orderBy: { key: "asc" },
  });
  return c.json({ data: messages });
});

/** Upsert a bot message (create or update by key). */
botAdminRoutes.put("/messages/:key", async (c) => {
  const body = z
    .object({
      text: z.string().min(1),
      textI18n: z.record(z.string(), z.string()).optional(),
    })
    .safeParse(await c.req.json());

  if (!body.success) return c.json({ error: "Invalid body" }, 400);

  const key = c.req.param("key");
  const message = await prisma.botMessage.upsert({
    where: { key },
    create: {
      key,
      text: body.data.text,
      textI18n: body.data.textI18n ?? undefined,
    },
    update: {
      text: body.data.text,
      textI18n: body.data.textI18n ?? undefined,
    },
  });

  // Invalidate cache so bot picks up changes immediately
  invalidateMessageCache();

  return c.json({ data: message });
});

// ── Telegram Users (read-only for admin) ─────────────────────────────────────

/** List Telegram users with pagination. */
botAdminRoutes.get("/users", async (c) => {
  const page = parseInt(c.req.query("page") ?? "1", 10);
  const limit = parseInt(c.req.query("limit") ?? "50", 10);
  const skip = (page - 1) * limit;
  const search = (c.req.query("search") ?? "").trim();
  const status = (c.req.query("status") ?? "").trim().toLowerCase();

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { username: { contains: search, mode: "insensitive" } },
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
    ];
  }
  if (status === "blocked") {
    where.isBlocked = true;
  } else if (status === "active") {
    where.isBlocked = false;
    where.lastInteractAt = { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
  } else if (status === "inactive") {
    where.isBlocked = false;
    where.lastInteractAt = { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
  }

  const [users, total] = await Promise.all([
    prisma.telegramUser.findMany({
      where,
      orderBy: { lastInteractAt: "desc" },
      skip,
      take: limit,
      include: {
        _count: { select: { requests: true } },
      },
    }),
    prisma.telegramUser.count({ where }),
  ]);

  return c.json({
    data: users.map((u) => ({
      ...u,
      telegramId: u.telegramId.toString(),
      status: u.isBlocked
        ? "blocked"
        : u.lastInteractAt.getTime() < Date.now() - 30 * 24 * 60 * 60 * 1000
          ? "inactive"
          : "active",
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    // `meta` prevents the admin client from unwrapping `data` and dropping pagination.
    meta: { total },
  });
});

/** Get a specific Telegram user with their request history. */
botAdminRoutes.get("/users/:id", async (c) => {
  const user = await prisma.telegramUser.findUnique({
    where: { id: c.req.param("id") },
    include: {
      requests: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { service: { select: { name: true, slug: true } } },
      },
    },
  });

  if (!user) return c.json({ error: "User not found" }, 404);

  return c.json({
    data: {
      ...user,
      telegramId: user.telegramId.toString(),
      status: user.isBlocked
        ? "blocked"
        : user.lastInteractAt.getTime() < Date.now() - 30 * 24 * 60 * 60 * 1000
          ? "inactive"
          : "active",
      requests: user.requests.map((r) => ({
        ...r,
        totalAmount: r.totalAmount ? Number(r.totalAmount) : null,
      })),
    },
  });
});

/** Update Telegram user status (block/unblock). */
botAdminRoutes.patch("/users/:id", async (c) => {
  const body = z
    .object({
      isBlocked: z.boolean().optional(),
      languageCode: z.enum(["en", "am"]).optional(),
    })
    .safeParse(await c.req.json());

  if (!body.success) return c.json({ error: "Invalid body" }, 400);

  const user = await prisma.telegramUser.update({
    where: { id: c.req.param("id") },
    data: body.data,
  });

  return c.json({
    data: {
      ...user,
      telegramId: user.telegramId.toString(),
    },
  });
});

// ── Bot Overview Stats ───────────────────────────────────────────────────────

botAdminRoutes.get("/stats", async (c) => {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const activeCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    activeUsers,
    newUsersToday,
    newUsersThisWeek,
    totalMenus,
    totalMessages,
    telegramRequests,
    topServices,
  ] = await Promise.all([
    prisma.telegramUser.count(),
    prisma.telegramUser.count({
      where: { lastInteractAt: { gte: activeCutoff }, isBlocked: false },
    }),
    prisma.telegramUser.count({ where: { firstSeenAt: { gte: todayStart } } }),
    prisma.telegramUser.count({ where: { firstSeenAt: { gte: weekStart } } }),
    prisma.botMenu.count({ where: { enabled: true } }),
    prisma.botMessage.count(),
    prisma.serviceRequest.count({ where: { source: "TELEGRAM" } }),
    prisma.serviceRequest.groupBy({
      by: ["serviceId"],
      where: { source: "TELEGRAM" },
      _count: { _all: true },
      orderBy: { _count: { serviceId: "desc" } },
      take: 5,
    }),
  ]);

  const serviceIds = topServices.map((entry) => entry.serviceId);
  const services = serviceIds.length
    ? await prisma.service.findMany({
        where: { id: { in: serviceIds } },
        select: { id: true, name: true, slug: true },
      })
    : [];

  const serviceNameById = new Map(services.map((service) => [service.id, service.name]));

  return c.json({
    data: {
      totalUsers,
      activeUsersLast7Days: activeUsers,
      newUsersToday,
      newUsersThisWeek,
      totalMenuItems: totalMenus,
      totalMessages,
      telegramRequests,
      topServices: topServices.map((entry) => ({
        serviceId: entry.serviceId,
        serviceName: serviceNameById.get(entry.serviceId) ?? "Unknown",
        count: entry._count._all,
      })),
    },
  });
});

/** Bot connection health for the admin dashboard. */
botAdminRoutes.get("/health", async (c) => {
  const settings = await getTelegramSettings();
  const token = resolveBotToken();
  const envConfig = getTelegramEnvConfig();
  const heartbeat = await getBotHeartbeat();
  const heartbeatFresh =
    heartbeat !== null && Date.now() - heartbeat.getTime() < 2 * 60 * 1000;

  let tokenValid = false;
  let botUsername: string | null = null;
  let botId: number | null = null;
  let webhookInfo: Record<string, unknown> | null = null;
  let apiError: string | null = null;

  if (token) {
    try {
      const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const meJson = (await meRes.json()) as {
        ok?: boolean;
        result?: { id: number; username?: string };
        description?: string;
      };
      tokenValid = Boolean(meJson.ok);
      botUsername = meJson.result?.username ?? null;
      botId = meJson.result?.id ?? null;
      if (!meJson.ok) apiError = meJson.description ?? "Invalid bot token";

      if (tokenValid) {
        const hookRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
        const hookJson = (await hookRes.json()) as { ok?: boolean; result?: Record<string, unknown> };
        if (hookJson.ok) webhookInfo = hookJson.result ?? null;
      }
    } catch (error) {
      apiError = error instanceof Error ? error.message : "Telegram API unreachable";
    }
  }

  const processOnline = heartbeatFresh;
  const operational = settings.enabled && tokenValid && (processOnline || Boolean(webhookInfo?.url));

  return c.json({
    data: {
      enabled: settings.enabled,
      tokenConfigured: Boolean(token),
      tokenValid,
      processOnline,
      operational,
      status: operational ? "online" : settings.enabled ? "degraded" : "offline",
      botUsername,
      botId,
      mode: process.env.BOT_MODE ?? "polling",
      webhook: webhookInfo,
      configuredWebhookUrl: resolveWebhookUrl() || null,
      webAppBaseUrl: resolveWebsiteBaseUrl(),
      env: envConfig,
      defaultLanguage: settings.defaultLanguage,
      supportedLanguages: settings.supportedLanguages,
      lastHeartbeat: heartbeat?.toISOString() ?? null,
      apiError,
    },
  });
});
