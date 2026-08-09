import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../lib/auth.js";
import type { CategoryType } from "@prisma/client";
import { isLocalizedText, resolveLocalizedText } from "../lib/i18nContent.js";
export const menuRoutes = new Hono();
menuRoutes.use("/*", requireAuth);

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
// ── Categories ─────────────────────────────────────────────────────────────────
const categorySchema = z.object({
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/i),
    name: z.string().min(1).max(100),
    nameI18n: z.record(z.string(), z.string()).optional(),
    description: z.string().optional().nullable(),
    descriptionI18n: z.record(z.string(), z.string()).optional(),
    type: z.enum(["PRODUCT", "MENU"]).default("MENU"),
    image: z.string().optional().nullable(),
    mediaId: z.string().optional().nullable(),
    order: z.number().int().default(0),
    published: z.boolean().default(true),
});
menuRoutes.get("/categories", async (c) => {
    const type = c.req.query("type");
    const q = c.req.query("q")?.trim();
    const items = await prisma.category.findMany({
        where: {
            ...(type ? { type: type as CategoryType } : {}),
            ...(q
                ? {
                    OR: [
                        { name: { contains: q, mode: "insensitive" } },
                        { slug: { contains: q, mode: "insensitive" } },
                    ],
                }
                : {}),
        },
        orderBy: { order: "asc" },
        include: { media: { select: { id: true, url: true, alt: true } } },
    });
    return c.json({ data: items });
});
menuRoutes.get("/categories/:id", async (c) => {
    const id = c.req.param("id");
    const item = await prisma.category.findUnique({
        where: { id },
        include: { media: { select: { id: true, url: true, alt: true } } },
    });
    if (!item)
        return c.json({ error: "Not found" }, 404);
    return c.json({ data: item });
});
menuRoutes.post("/categories", async (c) => {
    const body = categorySchema.safeParse(await c.req.json());
    if (!body.success)
        return c.json({ error: body.error.format() }, 400);
    const localizedName = normalizeBaseAndI18n(body.data.name, body.data.nameI18n);
    const localizedDescription = normalizeBaseAndI18n(
        body.data.description,
        body.data.descriptionI18n,
    );
    const item = await prisma.category.create({
        data: {
            ...body.data,
            name: localizedName.base ?? body.data.name,
            nameI18n: localizedName.i18n,
            description: localizedDescription.base ?? body.data.description,
            descriptionI18n: localizedDescription.i18n,
        },
        include: { media: { select: { id: true, url: true, alt: true } } },
    });
    return c.json({ data: item }, 201);
});
menuRoutes.put("/categories/:id", async (c) => {
    const id = c.req.param("id");
    const body = categorySchema.partial().safeParse(await c.req.json());
    if (!body.success)
        return c.json({ error: body.error.format() }, 400);
    const localizedName = normalizeBaseAndI18n(body.data.name, body.data.nameI18n);
    const localizedDescription = normalizeBaseAndI18n(
        body.data.description,
        body.data.descriptionI18n,
    );
    const item = await prisma.category.update({
        where: { id },
        data: {
            ...body.data,
            name: localizedName.base ?? body.data.name,
            nameI18n: localizedName.i18n,
            description: localizedDescription.base ?? body.data.description,
            descriptionI18n: localizedDescription.i18n,
        },
        include: { media: { select: { id: true, url: true, alt: true } } },
    });
    return c.json({ data: item });
});
menuRoutes.delete("/categories/:id", async (c) => {
    const id = c.req.param("id");
    await prisma.category.delete({ where: { id } });
    return c.json({ data: { id } });
});
// ── Menu Items ─────────────────────────────────────────────────────────────────
const menuItemSchema = z.object({
    name: z.string().min(1).max(120),
    nameI18n: z.record(z.string(), z.string()).optional(),
    description: z.string().min(1),
    descriptionI18n: z.record(z.string(), z.string()).optional(),
    price: z.number().nonnegative().optional().nullable(),
    categoryId: z.string(),
    image: z.string().optional().nullable(),
    mediaId: z.string().optional().nullable(),
    tags: z.array(z.string()).default([]),
    spicy: z.boolean().default(false),
    vegetarian: z.boolean().default(false),
    featured: z.boolean().default(false),
    published: z.boolean().default(true),
    order: z.number().int().default(0),
});
menuRoutes.get("/items", async (c) => {
    const categoryId = c.req.query("categoryId");
    const featured = c.req.query("featured");
    const q = c.req.query("q")?.trim();
    const cursor = c.req.query("cursor");
    const limit = Math.min(Number(c.req.query("limit") || 48), 100);
    const items = await prisma.menuItem.findMany({
        where: {
            ...(categoryId ? { categoryId } : {}),
            ...(featured === "true" ? { featured: true } : {}),
            ...(q
                ? {
                    OR: [
                        { name: { contains: q, mode: "insensitive" } },
                        { description: { contains: q, mode: "insensitive" } },
                        { tags: { has: q } },
                    ],
                }
                : {}),
        },
        orderBy: { order: "asc" },
        take: limit + 1,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        include: {
            category: { select: { id: true, name: true, slug: true } },
            media: { select: { id: true, url: true, alt: true } },
        },
    });
    const hasMore = items.length > limit;
    if (hasMore)
        items.pop();
    return c.json({
        data: items,
        meta: { hasMore, nextCursor: hasMore ? items[items.length - 1]?.id : null },
    });
});
menuRoutes.get("/items/:id", async (c) => {
    const id = c.req.param("id");
    const item = await prisma.menuItem.findUnique({
        where: { id },
        include: {
            category: { select: { id: true, name: true, slug: true } },
            media: { select: { id: true, url: true, alt: true } },
        },
    });
    if (!item)
        return c.json({ error: "Not found" }, 404);
    return c.json({ data: item });
});
menuRoutes.post("/items", async (c) => {
    const body = menuItemSchema.safeParse(await c.req.json());
    if (!body.success)
        return c.json({ error: body.error.format() }, 400);
    const localizedName = normalizeBaseAndI18n(body.data.name, body.data.nameI18n);
    const localizedDescription = normalizeBaseAndI18n(
        body.data.description,
        body.data.descriptionI18n,
    );
    const item = await prisma.menuItem.create({
        data: {
            ...body.data,
            name: localizedName.base ?? body.data.name,
            nameI18n: localizedName.i18n,
            description: localizedDescription.base ?? body.data.description,
            descriptionI18n: localizedDescription.i18n,
        },
        include: {
            category: { select: { id: true, name: true, slug: true } },
            media: { select: { id: true, url: true, alt: true } },
        },
    });
    return c.json({ data: item }, 201);
});
menuRoutes.put("/items/:id", async (c) => {
    const id = c.req.param("id");
    const body = menuItemSchema.partial().safeParse(await c.req.json());
    if (!body.success)
        return c.json({ error: body.error.format() }, 400);
    const localizedName = normalizeBaseAndI18n(body.data.name, body.data.nameI18n);
    const localizedDescription = normalizeBaseAndI18n(
        body.data.description,
        body.data.descriptionI18n,
    );
    const item = await prisma.menuItem.update({
        where: { id },
        data: {
            ...body.data,
            name: localizedName.base ?? body.data.name,
            nameI18n: localizedName.i18n,
            description: localizedDescription.base ?? body.data.description,
            descriptionI18n: localizedDescription.i18n,
        },
        include: {
            category: { select: { id: true, name: true, slug: true } },
            media: { select: { id: true, url: true, alt: true } },
        },
    });
    return c.json({ data: item });
});
menuRoutes.delete("/items/:id", async (c) => {
    const id = c.req.param("id");
    await prisma.menuItem.delete({ where: { id } });
    return c.json({ data: { id } });
});
