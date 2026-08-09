import { Hono } from "hono";
import type { Context } from "hono";
import { normalizeBlocks } from "../lib/blogBlocks.js";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { makeReference, SERVICE_REF_PREFIX } from "../lib/ref.js";
import { filterFooterRowsForEnabledServices } from "../lib/syncServiceVisibility.js";
import {
  deepResolveBlogContent,
  deepResolveLocalizedTree,
  isLocalizedText,
  normalizeLocale,
  resolveLocalizedText,
  resolveLocalizedTextWithFallback,
} from "../lib/i18nContent.js";
import type { DeliveryMethod, Prisma, RequestSource } from "@prisma/client";
import { getText } from "../bot/helpers/localize.js";
import { optimizedImageList, optimizedImageUrl, optimizeCloudinaryUrlsInJson } from "../lib/image-url.js";

export const publicRoutes = new Hono();

function requestLocale(c: Context) {
  const fromQuery = c.req.query("lang");
  const fromHeader = c.req.header("x-lang");
  return normalizeLocale(fromQuery ?? fromHeader ?? "en");
}

function localizedOrBase(
  base: string | null | undefined,
  map: unknown,
  locale: string,
): string {
  if (isLocalizedText(map)) {
    return resolveLocalizedText(map, locale, "en");
  }
  if (locale === "am") return "";
  return base ?? "";
}

/** Blog metadata: EN fallback when AM missing; legacy base visible in every locale. */
function localizedBlogField(
  base: string | null | undefined,
  map: unknown,
  locale: string,
): string {
  if (isLocalizedText(map)) {
    return resolveLocalizedTextWithFallback(map, locale, "en") || base || "";
  }
  return base ?? "";
}

/** Enabled services for any client (website / Telegram). Disabled = hidden everywhere. */
publicRoutes.get("/services", async (c) => {
  const locale = requestLocale(c);
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
      image: true,
      sortOrder: true,
    },
  });
  return c.json({
    data: services.map((service) => ({
      ...service,
      name: localizedOrBase(service.name, service.nameI18n, locale),
      description: localizedOrBase(
        service.description,
        service.descriptionI18n,
        locale,
      ),
      image: optimizedImageUrl(service.image),
    })),
  });
});

/** Catalog for one enabled service (packages / products / configs). */
publicRoutes.get("/services/:slug/catalog", async (c) => {
  const locale = requestLocale(c);
  const slug = c.req.param("slug");
  const service = await prisma.service.findUnique({ where: { slug } });
  if (!service || !service.enabled) {
    return c.json({ error: "Service not found" }, 404);
  }

  const items = await prisma.catalogItem.findMany({
    where: { serviceId: service.id, available: true },
    orderBy: { sortOrder: "asc" },
  });

  return c.json({
    data: {
      service: {
        ...service,
        name: localizedOrBase(service.name, service.nameI18n, locale),
        description: localizedOrBase(
          service.description,
          service.descriptionI18n,
          locale,
        ),
        image: optimizedImageUrl(service.image),
      },
      items: items.map((item) => ({
        ...item,
        name: localizedOrBase(item.name, item.nameI18n, locale),
        description: localizedOrBase(
          item.description,
          item.descriptionI18n,
          locale,
        ),
        image: optimizedImageUrl(item.image),
        images: optimizedImageList(item.images),
      })),
    },
  });
});

publicRoutes.get("/faqs", async (c) => {
  const locale = requestLocale(c);
  const faqs = await prisma.faq.findMany({
    where: { published: true },
    orderBy: { sortOrder: "asc" },
  });
  return c.json({
    data: faqs.map((faq) => ({
      ...faq,
      question: localizedOrBase(faq.question, faq.questionI18n, locale),
      answer: localizedOrBase(faq.answer, faq.answerI18n, locale),
    })),
  });
});

publicRoutes.get("/gallery", async (c) => {
  const locale = requestLocale(c);
  const images = await prisma.galleryImage.findMany({
    where: { published: true },
    orderBy: { sortOrder: "asc" },
  });
  return c.json({
    data: images.map((image) => ({
      ...image,
      url: optimizedImageUrl(image.url),
      name: image.name
        ? localizedOrBase(image.name, image.nameI18n, locale)
        : image.name,
      caption: image.caption
        ? localizedOrBase(image.caption, image.captionI18n, locale)
        : image.caption,
    })),
  });
});

publicRoutes.get("/testimonials", async (c) => {
  const locale = requestLocale(c);
  const items = await prisma.testimonial.findMany({
    where: { published: true },
    orderBy: { sortOrder: "asc" },
  });
  return c.json({
    data: items.map((item) => ({
      ...item,
      imageUrl: optimizedImageUrl(item.imageUrl),
      name: localizedOrBase(item.name, item.nameI18n, locale),
      quote: localizedOrBase(item.quote, item.quoteI18n, locale),
      role: item.role
        ? localizedOrBase(item.role, item.roleI18n, locale)
        : item.role,
      dish: item.dish
        ? localizedOrBase(item.dish, item.dishI18n, locale)
        : item.dish,
    })),
  });
});

/** Guest submission — always unpublished until an admin approves. */
publicRoutes.post("/testimonials", async (c) => {
  const body = z
    .object({
      name: z.string().trim().min(1).max(120),
      quote: z.string().trim().min(10).max(2000),
      role: z.string().trim().max(120).optional().nullable(),
      dish: z.string().trim().max(120).optional().nullable(),
      dishCategory: z.enum(["food", "drinks", "products"]).optional().nullable(),
      rating: z.number().int().min(1).max(5).optional(),
    })
    .safeParse(await c.req.json());
  if (!body.success) {
    return c.json({ error: "Invalid body", details: body.error.flatten() }, 400);
  }

  const maxSort = await prisma.testimonial.aggregate({ _max: { sortOrder: true } });
  const item = await prisma.testimonial.create({
    data: {
      name: body.data.name,
      quote: body.data.quote,
      role: body.data.role || null,
      dish: body.data.dish || null,
      dishCategory: body.data.dishCategory || null,
      rating: body.data.rating ?? 5,
      sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      published: false,
    },
  });

  return c.json({ data: { id: item.id, pending: true } }, 201);
});

publicRoutes.get("/blog", async (c) => {
  const locale = requestLocale(c);
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
  });
  return c.json({
    data: posts.map((post) => ({
      ...post,
      image: optimizedImageUrl(post.image),
      title: localizedBlogField(post.title, post.titleI18n, locale),
      excerpt: localizedBlogField(post.excerpt, post.excerptI18n, locale),
      author: localizedBlogField(post.author, post.authorI18n, locale),
      readTime: localizedBlogField(post.readTime, post.readTimeI18n, locale),
      seoTitle: post.seoTitle
        ? localizedBlogField(post.seoTitle, post.seoTitleI18n, locale)
        : post.seoTitle,
      seoDescription: post.seoDescription
        ? localizedBlogField(
            post.seoDescription,
            post.seoDescriptionI18n,
            locale,
          )
        : post.seoDescription,
      blocks: normalizeBlocks(
        deepResolveBlogContent(post.blocks, locale, "en"),
        post.content,
      ),
    })),
  });
});

publicRoutes.get("/blog/:slug", async (c) => {
  const locale = requestLocale(c);
  const post = await prisma.blogPost.findFirst({
    where: { slug: c.req.param("slug"), published: true },
  });
  if (!post) return c.json({ error: "Not found" }, 404);
  return c.json({
    data: {
      ...post,
      image: optimizedImageUrl(post.image),
      title: localizedBlogField(post.title, post.titleI18n, locale),
      excerpt: localizedBlogField(post.excerpt, post.excerptI18n, locale),
      author: localizedBlogField(post.author, post.authorI18n, locale),
      readTime: localizedBlogField(post.readTime, post.readTimeI18n, locale),
      seoTitle: post.seoTitle
        ? localizedBlogField(post.seoTitle, post.seoTitleI18n, locale)
        : post.seoTitle,
      seoDescription: post.seoDescription
        ? localizedBlogField(post.seoDescription, post.seoDescriptionI18n, locale)
        : post.seoDescription,
      blocks: normalizeBlocks(
        deepResolveBlogContent(post.blocks, locale, "en"),
        post.content,
      ),
    },
  });
});

publicRoutes.get("/settings/:key", async (c) => {
  const locale = requestLocale(c);
  const row = await prisma.siteSetting.findUnique({
    where: { key: c.req.param("key") },
  });
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json({
    data: optimizeCloudinaryUrlsInJson(deepResolveLocalizedTree(row.value, locale, "en")),
  });
});

const submitSchema = z.object({
  serviceSlug: z.enum(["catering", "baltina", "agelgil", "drinks", "festival"]),
  source: z.enum(["WEBSITE", "TELEGRAM"]).default("WEBSITE"),
  customerName: z.string().min(1),
  phone: z.string().min(3),
  email: z.string().email().optional().nullable(),
  telegram: z.string().optional().nullable(),
  deliveryMethod: z.enum(["PICKUP", "DELIVERY"]).optional().nullable(),
  location: z.string().optional().nullable(),
  preferredDate: z.string().optional().nullable(),
  preferredTime: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  guests: z.number().int().positive().optional().nullable(),
  packageSummary: z.string().optional().nullable(),
  totalAmount: z.number().nonnegative().optional().nullable(),
  /** Exact form fields from the frontend — no invented keys required. */
  payload: z.record(z.unknown()).default({}),
  /** Telegram WebApp initData for backend validation. */
  telegramInitData: z.string().optional(),
});

/**
 * Single intake endpoint for all service requests.
 * Website forms and Telegram bot both POST here.
 */
publicRoutes.post("/requests", async (c) => {
  const body = await c.req.json();
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  const input = parsed.data;
  const service = await prisma.service.findUnique({
    where: { slug: input.serviceSlug },
  });
  if (!service || !service.enabled) {
    return c.json({ error: "Service unavailable" }, 400);
  }

  // ── Telegram WebApp auth validation ──────────────────────────────────────
  let resolvedTelegramUserId: string | null = null;
  let telegramUsername: string | null = null;
  let telegramRecipient: { telegramId: bigint; languageCode: string } | null = null;

  if (input.source === "TELEGRAM") {
    if (!input.telegramInitData) {
      return c.json({ error: "Telegram WebApp authentication is required" }, 401);
    }

    const { validateWebAppData } = await import("../bot/helpers/webapp-auth.js");
    const botToken = process.env.BOT_TOKEN || process.env.Bot_token || "";
    const result = validateWebAppData(input.telegramInitData, botToken);

    if (!result.valid || !result.user) {
      return c.json({ error: result.error ?? "Invalid Telegram WebApp authentication" }, 401);
    }

    // Link requests only to the identity validated by Telegram. Upserting also
    // handles an interrupted earlier bot update without trusting browser data.
    const tgUser = await prisma.telegramUser.upsert({
      where: { telegramId: BigInt(result.user.id) },
      create: {
        telegramId: BigInt(result.user.id),
        username: result.user.username ?? null,
        firstName: result.user.first_name || "Telegram user",
        lastName: result.user.last_name ?? null,
        languageCode: result.user.language_code === "am" ? "am" : "en",
      },
      update: {
        username: result.user.username ?? null,
        firstName: result.user.first_name || "Telegram user",
        lastName: result.user.last_name ?? null,
        lastInteractAt: new Date(),
        isBlocked: false,
      },
    });

    resolvedTelegramUserId = tgUser.id;
    telegramUsername = tgUser.username;
    telegramRecipient = { telegramId: tgUser.telegramId, languageCode: tgUser.languageCode };
  }

  const prefix = SERVICE_REF_PREFIX[input.serviceSlug] ?? "REQ";
  const reference = makeReference(prefix);

  const request = await prisma.serviceRequest.create({
    data: {
      reference,
      serviceId: service.id,
      source: input.source as RequestSource,
      customerName: input.customerName,
      phone: input.phone,
      email: input.email ?? undefined,
      telegram: input.telegram ?? undefined,
      telegramUserId: resolvedTelegramUserId ?? undefined,
      deliveryMethod: (input.deliveryMethod as DeliveryMethod | null) ?? undefined,
      location: input.location ?? undefined,
      preferredDate: input.preferredDate ? new Date(input.preferredDate) : undefined,
      preferredTime: input.preferredTime ?? undefined,
      notes: input.notes ?? undefined,
      guests: input.guests ?? undefined,
      packageSummary: input.packageSummary ?? undefined,
      totalAmount: input.totalAmount ?? undefined,
      payload: input.payload as Prisma.InputJsonValue,
      history: {
        create: { status: "NEW", note: "Request received" },
      },
    },
    include: { service: true, history: true },
  });

  await prisma.notification.create({
    data: {
      kind: "REQUEST",
      title: `New ${service.name} request`,
      body: `${input.customerName} — ${input.packageSummary ?? reference}`,
      meta: { requestId: request.id, reference },
    },
  });

  // ── Send Telegram notification to admins ─────────────────────────────────
  try {
    const { notifyNewRequest, notifyTelegramUser } = await import("../bot/notifications.js");
    await notifyNewRequest({
      reference,
      customerName: input.customerName,
      phone: input.phone,
      serviceName: service.name,
      serviceSlug: service.slug,
      source: input.source,
      packageSummary: input.packageSummary,
      totalAmount: input.totalAmount,
      notes: input.notes,
      telegramUsername,
    });

    if (telegramRecipient) {
      const confirmation = await getText("request_received", telegramRecipient.languageCode, {
        reference,
      });
      await notifyTelegramUser(telegramRecipient.telegramId.toString(), confirmation);
    }
  } catch {
    // Don't fail the request if notification fails
  }

  return c.json({ data: request }, 201);
});

publicRoutes.get("/navigation", async (c) => {
  const locale = requestLocale(c);
  const location = c.req.query("location") || "PRIMARY";
  const items = await prisma.navigation.findMany({
    where: { location: location as any, enabled: true },
    orderBy: { order: "asc" },
    include: { children: { where: { enabled: true }, orderBy: { order: "asc" } } },
  });
  return c.json({
    data: items.map((item) => ({
      ...item,
      label: localizedOrBase(item.label, item.labelI18n, locale),
      children: item.children.map((child) => ({
        ...child,
        label: localizedOrBase(child.label, child.labelI18n, locale),
      })),
    })),
  });
});

publicRoutes.get("/footer", async (c) => {
  const locale = requestLocale(c);
  const items = await prisma.footer.findMany({ orderBy: { order: "asc" } });
  const filtered = await filterFooterRowsForEnabledServices(items);
  return c.json({
    data: optimizeCloudinaryUrlsInJson(
      deepResolveLocalizedTree(filtered, locale, "en"),
    ),
  });
});

publicRoutes.get("/home-sections", async (c) => {
  const sections = await prisma.homeSection.findMany({
    where: { enabled: true },
    orderBy: { order: "asc" },
    include: { media: { select: { id: true, url: true, alt: true } } },
  });
  return c.json({
    data: sections.map((section) => ({
      ...section,
      content: optimizeCloudinaryUrlsInJson(section.content),
      media: section.media
        ? { ...section.media, url: optimizedImageUrl(section.media.url) }
        : section.media,
    })),
  });
});

publicRoutes.get("/pages/:slug", async (c) => {
  const locale = requestLocale(c);
  const page = await prisma.page.findUnique({
    where: { slug: c.req.param("slug"), status: "PUBLISHED" },
    include: {
      coverMedia: { select: { id: true, url: true, alt: true } },
      blocks: { orderBy: { order: "asc" }, include: { media: { select: { id: true, url: true, alt: true } } } },
      seo: true,
    },
  });
  if (!page) return c.json({ error: "Not found" }, 404);
  return c.json({
    data: {
      ...page,
      title: localizedOrBase(page.title, page.titleI18n, locale),
      description: page.description
        ? localizedOrBase(page.description, page.descriptionI18n, locale)
        : page.description,
      blocks: page.blocks.map((block) => ({
        ...block,
        content: deepResolveLocalizedTree(block.content, locale, "en"),
      })),
      seo: page.seo
        ? {
            ...page.seo,
            title: page.seo.title
              ? localizedOrBase(page.seo.title, page.seo.titleI18n, locale)
              : page.seo.title,
            description: page.seo.description
              ? localizedOrBase(
                  page.seo.description,
                  page.seo.descriptionI18n,
                  locale,
                )
              : page.seo.description,
            keywords: page.seo.keywords
              ? localizedOrBase(page.seo.keywords, page.seo.keywordsI18n, locale)
              : page.seo.keywords,
          }
        : page.seo,
    },
  });
});

publicRoutes.get("/categories", async (c) => {
  const locale = requestLocale(c);
  const type = c.req.query("type") || "MENU";
  const items = await prisma.category.findMany({
    where: { type: type as any, published: true },
    orderBy: { order: "asc" },
    include: { media: { select: { id: true, url: true, alt: true } } },
  });
  return c.json({
    data: items.map((item) => ({
      ...item,
      name: localizedOrBase(item.name, item.nameI18n, locale),
      description: item.description
        ? localizedOrBase(item.description, item.descriptionI18n, locale)
        : item.description,
    })),
  });
});

publicRoutes.get("/menu-items", async (c) => {
  const locale = requestLocale(c);
  const categoryId = c.req.query("categoryId");
  const featured = c.req.query("featured") === "true";
  const items = await prisma.menuItem.findMany({
    where: { published: true, ...(categoryId ? { categoryId } : {}), ...(featured ? { featured: true } : {}) },
    orderBy: { order: "asc" },
    include: {
      category: { select: { id: true, name: true, nameI18n: true, slug: true } },
      media: { select: { id: true, url: true, alt: true } },
    },
  });
  return c.json({
    data: items.map((item) => ({
      ...item,
      name: localizedOrBase(item.name, item.nameI18n, locale),
      description: localizedOrBase(
        item.description,
        item.descriptionI18n,
        locale,
      ),
      category: {
        ...item.category,
        name: localizedOrBase(item.category.name, item.category.nameI18n, locale),
      },
    })),
  });
});

publicRoutes.get("/announcements", async (c) => {
  const locale = requestLocale(c);
  const now = new Date();
  const items = await prisma.announcement.findMany({
    where: {
      active: true,
      AND: [
        { OR: [{ startDate: { lte: now } }, { startDate: null }] },
        { OR: [{ endDate: { gte: now } }, { endDate: null }] },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: { media: { select: { id: true, url: true, alt: true } } },
  });
  return c.json({
    data: items.map((item) => ({
      ...item,
      message: localizedOrBase(item.message, item.messageI18n, locale),
    })),
  });
});

publicRoutes.get("/seo", async (c) => {
  const locale = requestLocale(c);
  const key = c.req.query("key") || "global";
  const item = await prisma.seoSetting.findUnique({ where: { key } });
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json({
    data: deepResolveLocalizedTree(item.value, locale, "en"),
  });
});
