import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../lib/auth.js";
import type { PageStatus, NavigationLocation, CategoryType } from "@prisma/client";
import { deepNormalizeLocalizedTree, isLocalizedText, resolveLocalizedText } from "../lib/i18nContent.js";
export const contentRoutes = new Hono();
contentRoutes.use("/*", requireAuth);

function normalizeBaseAndI18n(
  baseValue: string | null | undefined,
  i18nValue: unknown,
) {
  if (isLocalizedText(i18nValue)) {
    const resolved = resolveLocalizedText(i18nValue, "en", "en");
    return {
      base: resolved || baseValue || "",
      i18n: i18nValue as Record<string, string>,
    };
  }
  return { base: baseValue, i18n: undefined };
}
// ── Pages ─────────────────────────────────────────────────────────────────────
const pageSchema = z.object({
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "slug must be lowercase letters, numbers, and dashes"),
    title: z.string().min(1).max(120),
    titleI18n: z.record(z.string(), z.string()).optional(),
    description: z.string().optional(),
    descriptionI18n: z.record(z.string(), z.string()).optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
    isHome: z.boolean().default(false),
    coverMediaId: z.string().optional().nullable(),
});
const pageStatusQuerySchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
const listLimitQuerySchema = z.coerce.number().int().min(1).max(100);

function parseListLimit(raw: string | undefined, defaultLimit: number): number | null {
    if (!raw) return defaultLimit;
    const parsed = listLimitQuerySchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
}

contentRoutes.get("/pages", async (c) => {
    const q = c.req.query("q")?.trim();
    const statusRaw = c.req.query("status");
    let status: PageStatus | undefined;
    if (statusRaw) {
        const parsed = pageStatusQuerySchema.safeParse(statusRaw);
        if (!parsed.success) return c.json({ error: "Invalid status" }, 400);
        status = parsed.data;
    }
    const cursor = c.req.query("cursor");
    const limit = parseListLimit(c.req.query("limit"), 24);
    if (limit === null) return c.json({ error: "Invalid limit" }, 400);
    const items = await prisma.page.findMany({
        where: {
            ...(status ? { status } : {}),
            ...(q
                ? {
                    OR: [
                        { slug: { contains: q, mode: "insensitive" } },
                        { title: { contains: q, mode: "insensitive" } },
                    ],
                }
                : {}),
        },
        include: { coverMedia: { select: { id: true, url: true, alt: true } }, blocks: { orderBy: { order: "asc" } } },
        orderBy: { updatedAt: "desc" },
        take: limit + 1,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
    const hasMore = items.length > limit;
    if (hasMore)
        items.pop();
    return c.json({
        data: items,
        meta: { hasMore, nextCursor: hasMore ? items[items.length - 1]?.id : null },
    });
});
contentRoutes.get("/pages/:id", async (c) => {
    const id = c.req.param("id");
    const page = await prisma.page.findUnique({
        where: { id },
        include: {
            coverMedia: { select: { id: true, url: true, alt: true } },
            blocks: { orderBy: { order: "asc" }, include: { media: { select: { id: true, url: true, alt: true } } } },
            seo: true,
        },
    });
    if (!page)
        return c.json({ error: "Not found" }, 404);
    return c.json({ data: page });
});
contentRoutes.post("/pages", async (c) => {
    const body = pageSchema.safeParse(await c.req.json());
    if (!body.success)
        return c.json({ error: body.error.format() }, 400);
    if (body.data.isHome) {
        await prisma.page.updateMany({ where: { isHome: true }, data: { isHome: false } });
    }
    const localizedTitle = normalizeBaseAndI18n(body.data.title, body.data.titleI18n);
    const localizedDescription = normalizeBaseAndI18n(
        body.data.description,
        body.data.descriptionI18n,
    );
    const page = await prisma.page.create({
        data: {
            ...body.data,
            title: localizedTitle.base ?? body.data.title,
            titleI18n: localizedTitle.i18n,
            description: localizedDescription.base ?? body.data.description,
            descriptionI18n: localizedDescription.i18n,
        },
        include: { coverMedia: true, blocks: true },
    });
    return c.json({ data: page }, 201);
});
contentRoutes.put("/pages/:id", async (c) => {
    const id = c.req.param("id");
    const body = pageSchema.partial().safeParse(await c.req.json());
    if (!body.success)
        return c.json({ error: body.error.format() }, 400);
    const existing = await prisma.page.findUnique({ where: { id } });
    if (!existing)
        return c.json({ error: "Not found" }, 404);
    if (body.data.isHome) {
        await prisma.page.updateMany({ where: { isHome: true, id: { not: id } }, data: { isHome: false } });
    }
    const localizedTitle = normalizeBaseAndI18n(body.data.title, body.data.titleI18n);
    const localizedDescription = normalizeBaseAndI18n(
        body.data.description,
        body.data.descriptionI18n,
    );
    const page = await prisma.page.update({
        where: { id },
        data: {
            ...body.data,
            title: localizedTitle.base ?? body.data.title,
            titleI18n: localizedTitle.i18n,
            description: localizedDescription.base ?? body.data.description,
            descriptionI18n: localizedDescription.i18n,
        },
        include: { coverMedia: true, blocks: true },
    });
    return c.json({ data: page });
});
contentRoutes.delete("/pages/:id", async (c) => {
    const id = c.req.param("id");
    await prisma.page.delete({ where: { id } });
    return c.json({ data: { id } });
});
// ── Page Blocks ───────────────────────────────────────────────────────────────
const blockSchema = z.object({
    pageId: z.string().optional(),
    type: z.string().min(1),
    name: z.string().optional(),
    order: z.number().int().default(0),
    content: z.record(z.string(), z.any()).default({}),
    mediaId: z.string().optional().nullable(),
});
contentRoutes.get("/pages/:pageId/blocks", async (c) => {
    const pageId = c.req.param("pageId");
    const blocks = await prisma.pageBlock.findMany({
        where: { pageId },
        orderBy: { order: "asc" },
        include: { media: { select: { id: true, url: true, alt: true } } },
    });
    return c.json({ data: blocks });
});
contentRoutes.post("/pages/:pageId/blocks", async (c) => {
    const pageId = c.req.param("pageId");
    const body = blockSchema.safeParse(await c.req.json());
    if (!body.success)
        return c.json({ error: body.error.format() }, 400);
    const block = await prisma.pageBlock.create({
        data: {
            ...body.data,
            pageId,
            content: deepNormalizeLocalizedTree(body.data.content) as any,
        },
        include: { media: { select: { id: true, url: true, alt: true } } },
    });
    return c.json({ data: block }, 201);
});
contentRoutes.put("/blocks/:id", async (c) => {
    const id = c.req.param("id");
    const body = blockSchema.partial().safeParse(await c.req.json());
    if (!body.success)
        return c.json({ error: body.error.format() }, 400);
    const block = await prisma.pageBlock.update({
        where: { id },
        data: {
            ...body.data,
            content: body.data.content
                ? (deepNormalizeLocalizedTree(body.data.content) as any)
                : body.data.content,
        },
        include: { media: { select: { id: true, url: true, alt: true } } },
    });
    return c.json({ data: block });
});
contentRoutes.delete("/blocks/:id", async (c) => {
    const id = c.req.param("id");
    await prisma.pageBlock.delete({ where: { id } });
    return c.json({ data: { id } });
});
// ── Homepage Sections ─────────────────────────────────────────────────────────
const sectionSchema = z.object({
    key: z.string().min(1).regex(/^[a-z0-9-]+$/, "key must be lowercase letters, numbers, and dashes"),
    label: z.string().min(1),
    order: z.number().int().default(0),
    enabled: z.boolean().default(true),
    content: z.record(z.string(), z.any()).default({}),
    mediaId: z.string().optional().nullable(),
});
contentRoutes.get("/home-sections", async (c) => {
    const sections = await prisma.homeSection.findMany({
        orderBy: { order: "asc" },
        include: { media: { select: { id: true, url: true, alt: true } } },
    });
    return c.json({ data: sections });
});
contentRoutes.get("/home-sections/:id", async (c) => {
    const id = c.req.param("id");
    const section = await prisma.homeSection.findUnique({
        where: { id },
        include: { media: { select: { id: true, url: true, alt: true } } },
    });
    if (!section)
        return c.json({ error: "Not found" }, 404);
    return c.json({ data: section });
});
contentRoutes.post("/home-sections", async (c) => {
    const body = sectionSchema.safeParse(await c.req.json());
    if (!body.success)
        return c.json({ error: body.error.format() }, 400);
    const section = await prisma.homeSection.create({
        data: {
            ...body.data,
            content: deepNormalizeLocalizedTree(body.data.content) as any,
        },
        include: { media: { select: { id: true, url: true, alt: true } } },
    });
    return c.json({ data: section }, 201);
});
contentRoutes.put("/home-sections/:id", async (c) => {
    const id = c.req.param("id");
    const body = sectionSchema.partial().safeParse(await c.req.json());
    if (!body.success)
        return c.json({ error: body.error.format() }, 400);
    const section = await prisma.homeSection.update({
        where: { id },
        data: {
            ...body.data,
            content: body.data.content
                ? (deepNormalizeLocalizedTree(body.data.content) as any)
                : body.data.content,
        },
        include: { media: { select: { id: true, url: true, alt: true } } },
    });
    return c.json({ data: section });
});
contentRoutes.delete("/home-sections/:id", async (c) => {
    const id = c.req.param("id");
    await prisma.homeSection.delete({ where: { id } });
    return c.json({ data: { id } });
});
// ── Navigation ──────────────────────────────────────────────────────────────────
const navigationSchema = z.object({
    location: z.enum(["PRIMARY", "FOOTER", "MOBILE"]).default("PRIMARY"),
    label: z.string().min(1),
    labelI18n: z.record(z.string(), z.string()).optional(),
    href: z.string().min(1),
    icon: z.string().optional(),
    order: z.number().int().default(0),
    enabled: z.boolean().default(true),
    parentId: z.string().optional().nullable(),
});
contentRoutes.get("/navigation", async (c) => {
    const location = c.req.query("location");
    const items = await prisma.navigation.findMany({
        where: { ...(location ? { location: location as NavigationLocation } : {}) },
        orderBy: [{ location: "asc" }, { order: "asc" }],
        include: { children: true },
    });
    return c.json({ data: items });
});
contentRoutes.post("/navigation", async (c) => {
    const body = navigationSchema.safeParse(await c.req.json());
    if (!body.success)
        return c.json({ error: body.error.format() }, 400);
    const localized = normalizeBaseAndI18n(body.data.label, body.data.labelI18n);
    const item = await prisma.navigation.create({
        data: {
            ...body.data,
            label: localized.base ?? body.data.label,
            labelI18n: localized.i18n,
        },
        include: { children: true },
    });
    return c.json({ data: item }, 201);
});
contentRoutes.put("/navigation/:id", async (c) => {
    const id = c.req.param("id");
    const body = navigationSchema.partial().safeParse(await c.req.json());
    if (!body.success)
        return c.json({ error: body.error.format() }, 400);
    const localized = normalizeBaseAndI18n(body.data.label, body.data.labelI18n);
    const item = await prisma.navigation.update({
        where: { id },
        data: {
            ...body.data,
            label: localized.base ?? body.data.label,
            labelI18n: localized.i18n,
        },
        include: { children: true },
    });
    return c.json({ data: item });
});
contentRoutes.delete("/navigation/:id", async (c) => {
    const id = c.req.param("id");
    await prisma.navigation.delete({ where: { id } });
    return c.json({ data: { id } });
});
// ── Footer ──────────────────────────────────────────────────────────────────────
const footerSchema = z.object({
    column: z.string().min(1),
    title: z.string().optional(),
    order: z.number().int().default(0),
    content: z.record(z.string(), z.any()).default({}),
});
contentRoutes.get("/footer", async (c) => {
    const items = await prisma.footer.findMany({ orderBy: { order: "asc" } });
    return c.json({ data: items });
});
contentRoutes.put("/footer/:id", async (c) => {
    const id = c.req.param("id");
    const body = footerSchema.partial().safeParse(await c.req.json());
    if (!body.success)
        return c.json({ error: body.error.format() }, 400);
    const item = await prisma.footer.update({
        where: { id },
        data: {
            ...body.data,
            content: body.data.content
                ? (deepNormalizeLocalizedTree(body.data.content) as any)
                : body.data.content,
        },
    });
    return c.json({ data: item });
});
contentRoutes.post("/footer", async (c) => {
    const body = footerSchema.safeParse(await c.req.json());
    if (!body.success)
        return c.json({ error: body.error.format() }, 400);
    const item = await prisma.footer.create({
        data: {
            ...body.data,
            content: deepNormalizeLocalizedTree(body.data.content) as any,
        },
    });
    return c.json({ data: item }, 201);
});
contentRoutes.delete("/footer/:id", async (c) => {
    const id = c.req.param("id");
    await prisma.footer.delete({ where: { id } });
    return c.json({ data: { id } });
});
// ── Announcements ───────────────────────────────────────────────────────────────
const announcementSchema = z.object({
    message: z.string().min(1),
    messageI18n: z.record(z.string(), z.string()).optional(),
    link: z.string().optional().nullable(),
    active: z.boolean().default(true),
    startDate: z.string().datetime().optional().nullable(),
    endDate: z.string().datetime().optional().nullable(),
    background: z.string().optional().nullable(),
    mediaId: z.string().optional().nullable(),
});
contentRoutes.get("/announcements", async (c) => {
    const active = c.req.query("active");
    const now = new Date();
    const items = await prisma.announcement.findMany({
        where: {
            ...(active === "true"
                ? {
                    active: true,
                    AND: [
                        { OR: [{ startDate: { lte: now } }, { startDate: null }] },
                        { OR: [{ endDate: { gte: now } }, { endDate: null }] },
                    ],
                }
                : {}),
        },
        orderBy: { createdAt: "desc" },
        include: { media: { select: { id: true, url: true, alt: true } } },
    });
    return c.json({ data: items });
});
contentRoutes.post("/announcements", async (c) => {
    const body = announcementSchema.safeParse(await c.req.json());
    if (!body.success)
        return c.json({ error: body.error.format() }, 400);
    const localizedMessage = normalizeBaseAndI18n(
        body.data.message,
        body.data.messageI18n,
    );
    const data = {
        ...body.data,
        message: localizedMessage.base ?? body.data.message,
        messageI18n: localizedMessage.i18n,
        startDate: body.data.startDate ? new Date(body.data.startDate) : null,
        endDate: body.data.endDate ? new Date(body.data.endDate) : null,
    };
    const item = await prisma.announcement.create({ data, include: { media: true } });
    return c.json({ data: item }, 201);
});
contentRoutes.put("/announcements/:id", async (c) => {
    const id = c.req.param("id");
    const body = announcementSchema.partial().safeParse(await c.req.json());
    if (!body.success)
        return c.json({ error: body.error.format() }, 400);
    const localizedMessage = normalizeBaseAndI18n(
        body.data.message,
        body.data.messageI18n,
    );
    const data = {
        ...body.data,
        message: localizedMessage.base ?? body.data.message,
        messageI18n: localizedMessage.i18n,
        startDate: body.data.startDate ? new Date(body.data.startDate) : null,
        endDate: body.data.endDate ? new Date(body.data.endDate) : null,
    };
    const item = await prisma.announcement.update({ where: { id }, data, include: { media: true } });
    return c.json({ data: item });
});
contentRoutes.delete("/announcements/:id", async (c) => {
    const id = c.req.param("id");
    await prisma.announcement.delete({ where: { id } });
    return c.json({ data: { id } });
});
// ── SEO Settings ──────────────────────────────────────────────────────────────
const seoSchema = z.object({ key: z.string().min(1), value: z.record(z.string(), z.any()) });
contentRoutes.get("/seo", async (c) => {
    const items = await prisma.seoSetting.findMany({ orderBy: { key: "asc" } });
    return c.json({ data: items });
});
contentRoutes.put("/seo/:key", async (c) => {
    const key = c.req.param("key");
    const body = seoSchema.partial().safeParse(await c.req.json());
    if (!body.success)
        return c.json({ error: body.error.format() }, 400);
    const item = await prisma.seoSetting.upsert({
        where: { key },
        create: { key, value: deepNormalizeLocalizedTree(body.data.value ?? {}) as any },
        update: { value: deepNormalizeLocalizedTree(body.data.value ?? {}) as any },
    });
    return c.json({ data: item });
});
