import { Hono } from "hono";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { Prisma, type RequestStatus } from "@prisma/client";
import { requireAuth, requirePermission, requirePermissionForMethod, requireReadOrManage, signAdminToken } from "../lib/auth.js";
import {
  exchangeClerkSession,
  getClerkPublishableKey,
  isClerkConfigured,
} from "../lib/clerkAuth.js";
import { blocksFromLegacyContent, blogBlockSchema, normalizeBlocks, paragraphTextsForContent } from "../lib/blogBlocks.js";
import { mediaRoutes } from "./media.js";
import { contentRoutes } from "./content.js";
import { menuRoutes } from "./menu.js";
import { botAdminRoutes } from "./bot-admin.js";
import { syncServiceVisibility } from "../lib/syncServiceVisibility.js";
import {
  deepNormalizeLocalizedTree,
  isLocalizedText,
  resolveLocalizedText,
  toLocalizedText,
} from "../lib/i18nContent.js";
import {
  invalidateTelegramSettingsCache,
  pickTelegramSettingsForDb,
  sanitizeTelegramSettingsForAdmin,
} from "../lib/botConfig.js";
import { resetBotInstance } from "../bot/singleton.js";

function isPrismaNotFound(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
}

export const adminRoutes = new Hono();

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

// ── Auth ─────────────────────────────────────────────────────────────────────

/** Public: Clerk publishable key for the admin login page. */
adminRoutes.get("/auth/clerk-config", async (c) => {
  if (!isClerkConfigured()) {
    return c.json({ error: "Clerk is not configured" }, 503);
  }
  return c.json({
    data: {
      publishableKey: getClerkPublishableKey(),
      configured: true,
    },
  });
});

/**
 * Exchange a Clerk session token for the CMS JWT.
 * Access is granted only if the Clerk email already exists as an ACTIVE admin in the DB.
 */
adminRoutes.post("/auth/clerk", async (c) => {
  if (!isClerkConfigured()) {
    return c.json({ error: "Clerk is not configured" }, 503);
  }

  const body = z
    .object({
      sessionToken: z.string().min(10).optional(),
      token: z.string().min(10).optional(),
    })
    .safeParse(await c.req.json().catch(() => ({})));

  const header = c.req.header("Authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
  const sessionToken =
    body.success
      ? body.data.sessionToken || body.data.token || bearer
      : bearer;

  if (!sessionToken) {
    return c.json({ error: "Missing Clerk session token" }, 400);
  }

  try {
    const result = await exchangeClerkSession(sessionToken);
    return c.json({ data: result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Clerk authentication failed";
    const status =
      message.includes("not authorized") || message.includes("suspended")
        ? 403
        : message.includes("Invalid") || message.includes("no email")
          ? 401
          : 400;
    return c.json({ error: message }, status);
  }
});

adminRoutes.post("/auth/login", async (c) => {
  const body = z
    .object({ email: z.string().email(), password: z.string().min(1) })
    .safeParse(await c.req.json());
  if (!body.success) return c.json({ error: "Invalid credentials payload" }, 400);

  const email = body.data.email.trim().toLowerCase();
  const admin = await prisma.admin.findUnique({
    where: { email },
    include: {
      role: { include: { permissions: { include: { permission: true } } } },
    },
  });

  if (!admin || admin.status !== "ACTIVE") {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  const ok = await bcrypt.compare(body.data.password, admin.passwordHash);
  if (!ok) return c.json({ error: "Invalid email or password" }, 401);

  await prisma.admin.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

  const permissions = admin.role.permissions.map((rp) => rp.permission.code);
  const profile = {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role.name,
    permissions,
  };

  const token = await signAdminToken(profile);

  return c.json({ data: { token, admin: profile } });
});

adminRoutes.get("/auth/me", requireAuth, async (c) => {
  return c.json({ data: c.get("admin") });
});

/** All routes below require authentication */
adminRoutes.use("/*", requireAuth);

/** Content / site editors */
adminRoutes.use("/media", requireReadOrManage("content.read", "content.manage"));
adminRoutes.use("/media/*", requireReadOrManage("content.read", "content.manage"));
adminRoutes.use("/content", requireReadOrManage("content.read", "content.manage"));
adminRoutes.use("/content/*", requireReadOrManage("content.read", "content.manage"));
adminRoutes.use("/menu", requireReadOrManage("content.read", "content.manage"));
adminRoutes.use("/menu/*", requireReadOrManage("content.read", "content.manage"));

/** Catalog */
adminRoutes.use(
  "/services",
  requirePermissionForMethod(["services.read", "packages.read"], ["services.manage"]),
);
adminRoutes.use(
  "/services/*",
  requirePermissionForMethod(["services.read", "packages.read"], ["services.manage"]),
);
adminRoutes.use("/catalog", requireReadOrManage("packages.read", "packages.manage"));
adminRoutes.use("/catalog/*", requireReadOrManage("packages.read", "packages.manage"));

/** Telegram */
adminRoutes.use("/bot", requirePermission("telegram.manage"));
adminRoutes.use("/bot/*", requirePermission("telegram.manage"));

/** Site content modules (not under /content) */
adminRoutes.use("/faqs", requireReadOrManage("content.read", "content.manage"));
adminRoutes.use("/faqs/*", requireReadOrManage("content.read", "content.manage"));
adminRoutes.use("/gallery", requireReadOrManage("content.read", "content.manage"));
adminRoutes.use("/gallery/*", requireReadOrManage("content.read", "content.manage"));
adminRoutes.use("/testimonials", requireReadOrManage("content.read", "content.manage"));
adminRoutes.use("/testimonials/*", requireReadOrManage("content.read", "content.manage"));
adminRoutes.use("/blog", requireReadOrManage("content.read", "content.manage"));
adminRoutes.use("/blog/*", requireReadOrManage("content.read", "content.manage"));

/** System */
adminRoutes.use("/overview", requirePermission("overview.read", "requests.read", "admins.read"));
adminRoutes.use(
  "/requests",
  requirePermissionForMethod(["requests.read"], ["requests.update", "requests.assign"]),
);
adminRoutes.use(
  "/requests/*",
  requirePermissionForMethod(["requests.read"], ["requests.update", "requests.assign"]),
);
adminRoutes.use("/settings", requirePermission("settings.manage"));
adminRoutes.use("/settings/*", requirePermission("settings.manage"));
adminRoutes.use(
  "/notifications",
  requirePermissionForMethod(["notifications.read"], ["admins.manage"]),
);
adminRoutes.use(
  "/notifications/*",
  requirePermissionForMethod(["notifications.read"], ["admins.manage"]),
);

adminRoutes.route("/media", mediaRoutes);
adminRoutes.route("/content", contentRoutes);
adminRoutes.route("/menu", menuRoutes);
adminRoutes.route("/bot", botAdminRoutes);

adminRoutes.get("/overview", async (c) => {
  const [total, newCount, inProgress, completed, cancelled, services, recent] =
    await Promise.all([
      prisma.serviceRequest.count(),
      prisma.serviceRequest.count({ where: { status: "NEW" } }),
      prisma.serviceRequest.count({ where: { status: "IN_PROGRESS" } }),
      prisma.serviceRequest.count({ where: { status: "COMPLETED" } }),
      prisma.serviceRequest.count({ where: { status: "CANCELLED" } }),
      prisma.service.findMany({ select: { id: true, name: true, slug: true } }),
      prisma.serviceRequest.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: { service: true },
      }),
    ]);

  const serviceCounts = await prisma.serviceRequest.groupBy({
    by: ["serviceId"],
    _count: { _all: true },
  });
  const countByServiceId = new Map(
    serviceCounts.map((row) => [row.serviceId, row._count._all]),
  );
  const byService = services.map((s) => ({
    service: s.name,
    slug: s.slug,
    count: countByServiceId.get(s.id) ?? 0,
  }));

  return c.json({
    data: {
      total,
      newCount,
      inProgress,
      completed,
      cancelled,
      byService,
      recent,
    },
  });
});

// ── Requests ─────────────────────────────────────────────────────────────────

adminRoutes.get("/requests", async (c) => {
  const q = c.req.query("q")?.trim();
  const status = c.req.query("status") as RequestStatus | undefined;
  const serviceSlug = c.req.query("service") || undefined;

  const service = serviceSlug
    ? await prisma.service.findUnique({ where: { slug: serviceSlug } })
    : null;

  const requests = await prisma.serviceRequest.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(service ? { serviceId: service.id } : {}),
      ...(q
        ? {
            OR: [
              { customerName: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
              { reference: { contains: q, mode: "insensitive" } },
              { packageSummary: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { service: true, assignedTo: { select: { id: true, name: true } } },
  });

  return c.json({ data: requests });
});

adminRoutes.get("/requests/:id", async (c) => {
  const request = await prisma.serviceRequest.findUnique({
    where: { id: c.req.param("id") },
    include: {
      service: true,
      assignedTo: { select: { id: true, name: true, email: true } },
      history: {
        orderBy: { createdAt: "asc" },
        include: { byAdmin: { select: { id: true, name: true } } },
      },
    },
  });
  if (!request) return c.json({ error: "Not found" }, 404);
  return c.json({ data: request });
});

adminRoutes.patch("/requests/:id/status", async (c) => {
  const body = z
    .object({
      status: z.enum([
        "NEW",
        "CONFIRMED",
        "IN_PROGRESS",
        "READY",
        "COMPLETED",
        "CANCELLED",
      ]),
      note: z.string().optional(),
      adminId: z.string().optional(),
    })
    .safeParse(await c.req.json());

  if (!body.success) return c.json({ error: "Invalid body" }, 400);

  const id = c.req.param("id");
  const existing = await prisma.serviceRequest.findUnique({ where: { id } });
  if (!existing) return c.json({ error: "Not found" }, 404);

  const updated = await prisma.serviceRequest.update({
    where: { id },
    data: {
      status: body.data.status,
      history: {
        create: {
          status: body.data.status,
          note: body.data.note,
          byAdminId: body.data.adminId,
        },
      },
    },
    include: { history: true, service: true },
  });

  await prisma.notification.create({
    data: {
      kind: "STATUS",
      title: `Request ${updated.reference} → ${body.data.status}`,
      body: body.data.note ?? `Status updated`,
      meta: { requestId: updated.id },
    },
  });

  return c.json({ data: updated });
});

adminRoutes.patch("/requests/:id/follow-up", async (c) => {
  const body = z
    .object({
      followUpStatus: z.enum([
        "NONE",
        "SATISFIED",
        "WAITING_FEEDBACK",
        "FOLLOW_UP_REQUIRED",
        "ISSUE_REPORTED",
      ]),
      followUpNote: z.string().optional().nullable(),
    })
    .safeParse(await c.req.json());
  if (!body.success) return c.json({ error: "Invalid body" }, 400);

  const id = c.req.param("id");
  try {
    const updated = await prisma.serviceRequest.update({
      where: { id },
      data: {
        followUpStatus: body.data.followUpStatus,
        followUpNote: body.data.followUpNote ?? null,
      },
      include: { service: true },
    });
    return c.json({ data: updated });
  } catch (error) {
    if (isPrismaNotFound(error)) return c.json({ error: "Not found" }, 404);
    throw error;
  }
});

// ── Services ─────────────────────────────────────────────────────────────────

adminRoutes.get(
  "/services",
  requirePermission("services.read", "services.manage"),
  async (c) => {
    const services = await prisma.service.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { catalogItems: true, requests: true } } },
    });
    return c.json({ data: services });
  },
);

adminRoutes.get(
  "/services/:id",
  requirePermission("services.read", "services.manage"),
  async (c) => {
    const service = await prisma.service.findUnique({
      where: { id: c.req.param("id") },
      include: {
        catalogItems: { orderBy: { sortOrder: "asc" } },
        _count: { select: { catalogItems: true, requests: true } },
      },
    });
    if (!service) return c.json({ error: "Not found" }, 404);
    return c.json({ data: service });
  },
);

adminRoutes.post(
  "/services",
  requirePermission("services.manage"),
  async (c) => {
    const body = z
      .object({
        slug: z
          .string()
          .min(2)
          .regex(/^[a-z0-9-]+$/, "slug must be lowercase letters, numbers, dashes"),
        name: z.string().min(1),
        nameI18n: z.record(z.string(), z.string()).optional(),
        description: z.string().default(""),
        descriptionI18n: z.record(z.string(), z.string()).optional(),
        image: z.string().optional().nullable(),
        webAppPath: z.string().regex(/^\/[a-zA-Z0-9/_-]*$/, "Path must start with /").optional().nullable(),
        enabled: z.boolean().optional(),
        sortOrder: z.number().int().optional(),
      })
      .safeParse(await c.req.json());
    if (!body.success)
      return c.json({ error: "Invalid body", details: body.error.flatten() }, 400);

    const maxOrder = await prisma.service.aggregate({ _max: { sortOrder: true } });
    const localizedName = syncLocalizedField(body.data.name, body.data.nameI18n);
    const localizedDescription = syncLocalizedField(
      body.data.description,
      body.data.descriptionI18n,
    );
    const service = await prisma.service.create({
      data: {
        ...body.data,
        name: localizedName.base ?? body.data.name,
        nameI18n: localizedName.i18n,
        description: localizedDescription.base ?? body.data.description,
        descriptionI18n: localizedDescription.i18n,
        image: body.data.image ?? undefined,
        webAppPath: body.data.webAppPath ?? undefined,
        sortOrder: body.data.sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 1,
      },
    });
    return c.json({ data: service }, 201);
  },
);

adminRoutes.patch(
  "/services/:id",
  requirePermission("services.manage"),
  async (c) => {
    const body = z
      .object({
        name: z.string().optional(),
        nameI18n: z.record(z.string(), z.string()).optional(),
        description: z.string().optional(),
        descriptionI18n: z.record(z.string(), z.string()).optional(),
        image: z.string().nullable().optional(),
        webAppPath: z.string().regex(/^\/[a-zA-Z0-9/_-]*$/).nullable().optional(),
        enabled: z.boolean().optional(),
        sortOrder: z.number().int().optional(),
        slug: z
          .string()
          .regex(/^[a-z0-9-]+$/)
          .optional(),
      })
      .safeParse(await c.req.json());
    if (!body.success) return c.json({ error: "Invalid body" }, 400);

    const existing = await prisma.service.findUnique({
      where: { id: c.req.param("id") },
    });
    if (!existing) return c.json({ error: "Not found" }, 404);

    const localizedName = syncLocalizedField(body.data.name, body.data.nameI18n);
    const localizedDescription = syncLocalizedField(
      body.data.description,
      body.data.descriptionI18n,
    );

    const service = await prisma.service.update({
      where: { id: existing.id },
      data: {
        ...body.data,
        name:
          localizedName.base ??
          body.data.name ??
          undefined,
        nameI18n: localizedName.i18n,
        description:
          localizedDescription.base ??
          body.data.description ??
          undefined,
        descriptionI18n: localizedDescription.i18n,
      },
    });

    if (typeof body.data.enabled === "boolean" && body.data.enabled !== existing.enabled) {
      await syncServiceVisibility(service.slug, service.enabled);
    }

    return c.json({ data: service });
  },
);

adminRoutes.delete(
  "/services/:id",
  requirePermission("services.manage"),
  async (c) => {
    const id = c.req.param("id");
    const count = await prisma.serviceRequest.count({ where: { serviceId: id } });
    if (count > 0) {
      // Soft-hide instead of destroying request history
      const service = await prisma.service.update({
        where: { id },
        data: { enabled: false },
      });
      await syncServiceVisibility(service.slug, false);
      return c.json({
        data: service,
        message: "Service disabled (has existing requests). Not deleted.",
      });
    }
    await prisma.catalogItem.deleteMany({ where: { serviceId: id } });
    await prisma.service.delete({ where: { id } });
    return c.json({ ok: true });
  },
);

adminRoutes.post(
  "/services/reorder",
  requirePermission("services.manage"),
  async (c) => {
    const body = z
      .object({ orderedIds: z.array(z.string()).min(1) })
      .safeParse(await c.req.json());
    if (!body.success) return c.json({ error: "Invalid body" }, 400);

    await prisma.$transaction(
      body.data.orderedIds.map((id, index) =>
        prisma.service.update({ where: { id }, data: { sortOrder: index + 1 } }),
      ),
    );

    const services = await prisma.service.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return c.json({ data: services });
  },
);

// ── Catalog / packages ───────────────────────────────────────────────────────

adminRoutes.get("/catalog", async (c) => {
  const serviceSlug = c.req.query("service") || undefined;
  const service = serviceSlug
    ? await prisma.service.findUnique({ where: { slug: serviceSlug } })
    : null;

  const items = await prisma.catalogItem.findMany({
    where: service ? { serviceId: service.id } : undefined,
    orderBy: [{ serviceId: "asc" }, { sortOrder: "asc" }],
    include: { service: { select: { id: true, slug: true, name: true } } },
  });
  return c.json({ data: items });
});

adminRoutes.post("/catalog", async (c) => {
  const body = z
    .object({
      serviceId: z.string(),
      kind: z.enum(["PRODUCT", "PACKAGE", "CONFIG"]),
      slug: z.string().min(1),
      name: z.string().min(1),
      nameI18n: z.record(z.string(), z.string()).optional(),
      description: z.string().optional(),
      descriptionI18n: z.record(z.string(), z.string()).optional(),
      price: z.number().optional().nullable(),
      image: z.string().optional().nullable(),
      images: z.array(z.string()).optional(),
      available: z.boolean().optional(),
      sortOrder: z.number().int().optional(),
      metadata: z.record(z.unknown()).optional(),
    })
    .safeParse(await c.req.json());
  if (!body.success) return c.json({ error: "Invalid body", details: body.error.flatten() }, 400);

  const localizedName = syncLocalizedField(body.data.name, body.data.nameI18n);
  const localizedDescription = syncLocalizedField(
    body.data.description ?? "",
    body.data.descriptionI18n,
  );
  const item = await prisma.catalogItem.create({
    data: {
      ...body.data,
      name: localizedName.base ?? body.data.name,
      nameI18n: localizedName.i18n,
      description: localizedDescription.base ?? body.data.description ?? "",
      descriptionI18n: localizedDescription.i18n,
      metadata: body.data.metadata as Prisma.InputJsonValue | undefined,
    },
  });
  return c.json({ data: item }, 201);
});

adminRoutes.patch("/catalog/:id", async (c) => {
  const body = z
    .object({
      name: z.string().optional(),
      nameI18n: z.record(z.string(), z.string()).optional(),
      description: z.string().optional(),
      descriptionI18n: z.record(z.string(), z.string()).optional(),
      price: z.number().optional().nullable(),
      image: z.string().optional().nullable(),
      images: z.array(z.string()).optional(),
      available: z.boolean().optional(),
      sortOrder: z.number().int().optional(),
      metadata: z.record(z.unknown()).optional(),
    })
    .safeParse(await c.req.json());
  if (!body.success) return c.json({ error: "Invalid body" }, 400);

  const localizedName = syncLocalizedField(body.data.name, body.data.nameI18n);
  const localizedDescription = syncLocalizedField(
    body.data.description,
    body.data.descriptionI18n,
  );

  try {
    const item = await prisma.catalogItem.update({
      where: { id: c.req.param("id") },
      data: {
        ...body.data,
        name: localizedName.base ?? body.data.name ?? undefined,
        nameI18n: localizedName.i18n,
        description:
          localizedDescription.base ??
          body.data.description ??
          undefined,
        descriptionI18n: localizedDescription.i18n,
        metadata: body.data.metadata as Prisma.InputJsonValue | undefined,
      },
    });
    return c.json({ data: item });
  } catch (error) {
    if (isPrismaNotFound(error)) return c.json({ error: "Not found" }, 404);
    throw error;
  }
});

adminRoutes.delete("/catalog/:id", async (c) => {
  try {
    await prisma.catalogItem.delete({ where: { id: c.req.param("id") } });
    return c.json({ ok: true });
  } catch (error) {
    if (isPrismaNotFound(error)) return c.json({ error: "Not found" }, 404);
    throw error;
  }
});

// ── Content ──────────────────────────────────────────────────────────────────

const faqBodySchema = z.object({
  question: z.string(),
  questionI18n: z.record(z.string(), z.string()).optional(),
  answer: z.string(),
  answerI18n: z.record(z.string(), z.string()).optional(),
  language: z.enum(["EN", "AM"]).optional(),
  sortOrder: z.number().int().optional(),
  published: z.boolean().optional(),
});

const faqUpdateBodySchema = faqBodySchema.partial();

function faqCreateData(data: z.infer<typeof faqBodySchema>) {
  const localizedQuestion = syncLocalizedField(data.question, data.questionI18n);
  const localizedAnswer = syncLocalizedField(data.answer, data.answerI18n);
  return {
    question: localizedQuestion.base ?? data.question,
    questionI18n: localizedQuestion.i18n,
    answer: localizedAnswer.base ?? data.answer,
    answerI18n: localizedAnswer.i18n,
    language: data.language,
    sortOrder: data.sortOrder,
    published: data.published,
  };
}

function faqUpdateData(data: z.infer<typeof faqUpdateBodySchema>) {
  const localizedQuestion = syncLocalizedField(data.question, data.questionI18n);
  const localizedAnswer = syncLocalizedField(data.answer, data.answerI18n);
  return {
    ...(data.language !== undefined ? { language: data.language } : {}),
    ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
    ...(data.published !== undefined ? { published: data.published } : {}),
    ...(data.question !== undefined || data.questionI18n !== undefined
      ? {
          question: localizedQuestion.base ?? data.question,
          questionI18n: localizedQuestion.i18n,
        }
      : {}),
    ...(data.answer !== undefined || data.answerI18n !== undefined
      ? {
          answer: localizedAnswer.base ?? data.answer,
          answerI18n: localizedAnswer.i18n,
        }
      : {}),
  };
}

adminRoutes.get("/faqs", async (c) => {
  return c.json({ data: await prisma.faq.findMany({ orderBy: { sortOrder: "asc" } }) });
});

adminRoutes.post("/faqs", async (c) => {
  const body = faqBodySchema.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: "Invalid body" }, 400);
  return c.json(
    {
      data: await prisma.faq.create({
        data: faqCreateData(body.data),
      }),
    },
    201,
  );
});

adminRoutes.patch("/faqs/:id", async (c) => {
  const body = faqUpdateBodySchema.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: "Invalid body" }, 400);
  try {
    const data = await prisma.faq.update({
      where: { id: c.req.param("id") },
      data: faqUpdateData(body.data),
    });
    return c.json({ data });
  } catch (error) {
    if (isPrismaNotFound(error)) return c.json({ error: "Not found" }, 404);
    throw error;
  }
});

adminRoutes.put("/faqs/:id", async (c) => {
  const body = faqUpdateBodySchema.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: "Invalid body" }, 400);
  try {
    const data = await prisma.faq.update({
      where: { id: c.req.param("id") },
      data: faqUpdateData(body.data),
    });
    return c.json({ data });
  } catch (error) {
    if (isPrismaNotFound(error)) return c.json({ error: "Not found" }, 404);
    throw error;
  }
});

adminRoutes.post("/faqs/reorder", async (c) => {
  const body = z.object({ ids: z.array(z.string()) }).safeParse(await c.req.json());
  if (!body.success) return c.json({ error: "Invalid body" }, 400);
  await Promise.all(
    body.data.ids.map((id, index) =>
      prisma.faq.update({ where: { id }, data: { sortOrder: index + 1 } }),
    ),
  );
  return c.json({ ok: true });
});

adminRoutes.delete("/faqs/:id", async (c) => {
  try {
    await prisma.faq.delete({ where: { id: c.req.param("id") } });
    return c.json({ ok: true });
  } catch (error) {
    if (isPrismaNotFound(error)) return c.json({ error: "Not found" }, 404);
    throw error;
  }
});

adminRoutes.get("/gallery", async (c) => {
  return c.json({
    data: await prisma.galleryImage.findMany({ orderBy: { sortOrder: "asc" } }),
  });
});

const galleryBodySchema = z.object({
  url: z.string().min(1),
  name: z.string().optional().nullable(),
  nameI18n: z.record(z.string(), z.string()).optional(),
  category: z.string().min(1),
  caption: z.string().optional().nullable(),
  captionI18n: z.record(z.string(), z.string()).optional(),
  tall: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  published: z.boolean().optional(),
});

const galleryUpdateBodySchema = galleryBodySchema.partial();

function galleryCreateData(data: z.infer<typeof galleryBodySchema>) {
  const localizedName = syncLocalizedField(data.name, data.nameI18n);
  const localizedCaption = syncLocalizedField(data.caption, data.captionI18n);
  return {
    url: data.url,
    category: data.category,
    name: localizedName.base ?? data.name,
    nameI18n: localizedName.i18n,
    caption: localizedCaption.base ?? data.caption,
    captionI18n: localizedCaption.i18n,
    tall: data.tall,
    sortOrder: data.sortOrder,
    published: data.published,
  };
}

function galleryUpdateData(data: z.infer<typeof galleryUpdateBodySchema>) {
  const localizedName = syncLocalizedField(data.name, data.nameI18n);
  const localizedCaption = syncLocalizedField(data.caption, data.captionI18n);
  return {
    ...(data.url !== undefined ? { url: data.url } : {}),
    ...(data.category !== undefined ? { category: data.category } : {}),
    ...(data.tall !== undefined ? { tall: data.tall } : {}),
    ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
    ...(data.published !== undefined ? { published: data.published } : {}),
    ...(data.name !== undefined || data.nameI18n !== undefined
      ? {
          name: localizedName.base ?? data.name,
          nameI18n: localizedName.i18n,
        }
      : {}),
    ...(data.caption !== undefined || data.captionI18n !== undefined
      ? {
          caption: localizedCaption.base ?? data.caption,
          captionI18n: localizedCaption.i18n,
        }
      : {}),
  };
}

adminRoutes.post("/gallery", async (c) => {
  const body = galleryBodySchema.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: "Invalid body" }, 400);
  return c.json(
    {
      data: await prisma.galleryImage.create({
        data: galleryCreateData(body.data),
      }),
    },
    201,
  );
});

adminRoutes.patch("/gallery/:id", async (c) => {
  const body = galleryUpdateBodySchema.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: "Invalid body" }, 400);
  try {
    const data = await prisma.galleryImage.update({
      where: { id: c.req.param("id") },
      data: galleryUpdateData(body.data),
    });
    return c.json({ data });
  } catch (error) {
    if (isPrismaNotFound(error)) return c.json({ error: "Not found" }, 404);
    throw error;
  }
});

adminRoutes.put("/gallery/:id", async (c) => {
  const body = galleryUpdateBodySchema.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: "Invalid body" }, 400);
  try {
    const data = await prisma.galleryImage.update({
      where: { id: c.req.param("id") },
      data: galleryUpdateData(body.data),
    });
    return c.json({ data });
  } catch (error) {
    if (isPrismaNotFound(error)) return c.json({ error: "Not found" }, 404);
    throw error;
  }
});

adminRoutes.post("/gallery/reorder", async (c) => {
  const body = z.object({ ids: z.array(z.string()) }).safeParse(await c.req.json());
  if (!body.success) return c.json({ error: "Invalid body" }, 400);
  await Promise.all(
    body.data.ids.map((id, index) =>
      prisma.galleryImage.update({ where: { id }, data: { sortOrder: index + 1 } }),
    ),
  );
  return c.json({ ok: true });
});

adminRoutes.delete("/gallery/:id", async (c) => {
  try {
    await prisma.galleryImage.delete({ where: { id: c.req.param("id") } });
    return c.json({ ok: true });
  } catch (error) {
    if (isPrismaNotFound(error)) return c.json({ error: "Not found" }, 404);
    throw error;
  }
});

adminRoutes.get("/testimonials", async (c) => {
  return c.json({
    data: await prisma.testimonial.findMany({ orderBy: { sortOrder: "asc" } }),
  });
});

const testimonialBodySchema = z.object({
  name: z.string().min(1),
  nameI18n: z.record(z.string(), z.string()).optional(),
  quote: z.string().min(1),
  quoteI18n: z.record(z.string(), z.string()).optional(),
  role: z.string().optional().nullable(),
  roleI18n: z.record(z.string(), z.string()).optional(),
  dish: z.string().optional().nullable(),
  dishI18n: z.record(z.string(), z.string()).optional(),
  dishCategory: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  rating: z.number().int().min(1).max(5).optional(),
  sortOrder: z.number().int().optional(),
  published: z.boolean().optional(),
});

const testimonialUpdateBodySchema = testimonialBodySchema.partial();

function testimonialCreateData(data: z.infer<typeof testimonialBodySchema>) {
  const localizedName = syncLocalizedField(data.name, data.nameI18n);
  const localizedQuote = syncLocalizedField(data.quote, data.quoteI18n);
  const localizedRole = syncLocalizedField(data.role, data.roleI18n);
  const localizedDish = syncLocalizedField(data.dish, data.dishI18n);
  return {
    name: localizedName.base ?? data.name,
    nameI18n: localizedName.i18n,
    quote: localizedQuote.base ?? data.quote,
    quoteI18n: localizedQuote.i18n,
    role: localizedRole.base ?? data.role,
    roleI18n: localizedRole.i18n,
    dish: localizedDish.base ?? data.dish,
    dishI18n: localizedDish.i18n,
    dishCategory: data.dishCategory,
    imageUrl: data.imageUrl,
    rating: data.rating,
    sortOrder: data.sortOrder,
    published: data.published,
  };
}

function testimonialUpdateData(data: z.infer<typeof testimonialUpdateBodySchema>) {
  const localizedName = syncLocalizedField(data.name, data.nameI18n);
  const localizedQuote = syncLocalizedField(data.quote, data.quoteI18n);
  const localizedRole = syncLocalizedField(data.role, data.roleI18n);
  const localizedDish = syncLocalizedField(data.dish, data.dishI18n);
  return {
    ...(data.dishCategory !== undefined ? { dishCategory: data.dishCategory } : {}),
    ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
    ...(data.rating !== undefined ? { rating: data.rating } : {}),
    ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
    ...(data.published !== undefined ? { published: data.published } : {}),
    ...(data.name !== undefined || data.nameI18n !== undefined
      ? {
          name: localizedName.base ?? data.name,
          nameI18n: localizedName.i18n,
        }
      : {}),
    ...(data.quote !== undefined || data.quoteI18n !== undefined
      ? {
          quote: localizedQuote.base ?? data.quote,
          quoteI18n: localizedQuote.i18n,
        }
      : {}),
    ...(data.role !== undefined || data.roleI18n !== undefined
      ? {
          role: localizedRole.base ?? data.role,
          roleI18n: localizedRole.i18n,
        }
      : {}),
    ...(data.dish !== undefined || data.dishI18n !== undefined
      ? {
          dish: localizedDish.base ?? data.dish,
          dishI18n: localizedDish.i18n,
        }
      : {}),
  };
}

adminRoutes.post("/testimonials", async (c) => {
  const body = testimonialBodySchema.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: "Invalid body" }, 400);
  return c.json(
    {
      data: await prisma.testimonial.create({
        data: testimonialCreateData(body.data),
      }),
    },
    201,
  );
});

adminRoutes.patch("/testimonials/:id", async (c) => {
  const body = testimonialUpdateBodySchema.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: "Invalid body" }, 400);
  try {
    const data = await prisma.testimonial.update({
      where: { id: c.req.param("id") },
      data: testimonialUpdateData(body.data),
    });
    return c.json({ data });
  } catch (error) {
    if (isPrismaNotFound(error)) return c.json({ error: "Not found" }, 404);
    throw error;
  }
});

adminRoutes.put("/testimonials/:id", async (c) => {
  const body = testimonialUpdateBodySchema.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: "Invalid body" }, 400);
  try {
    const data = await prisma.testimonial.update({
      where: { id: c.req.param("id") },
      data: testimonialUpdateData(body.data),
    });
    return c.json({ data });
  } catch (error) {
    if (isPrismaNotFound(error)) return c.json({ error: "Not found" }, 404);
    throw error;
  }
});

adminRoutes.post("/testimonials/reorder", async (c) => {
  const body = z.object({ ids: z.array(z.string()) }).safeParse(await c.req.json());
  if (!body.success) return c.json({ error: "Invalid body" }, 400);
  await Promise.all(
    body.data.ids.map((id, index) =>
      prisma.testimonial.update({ where: { id }, data: { sortOrder: index + 1 } }),
    ),
  );
  return c.json({ ok: true });
});

adminRoutes.delete("/testimonials/:id", async (c) => {
  try {
    await prisma.testimonial.delete({ where: { id: c.req.param("id") } });
    return c.json({ ok: true });
  } catch (error) {
    if (isPrismaNotFound(error)) return c.json({ error: "Not found" }, 404);
    throw error;
  }
});

adminRoutes.get("/blog", async (c) => {
  const posts = await prisma.blogPost.findMany({ orderBy: { publishedAt: "desc" } });
  return c.json({
    data: posts.map((post) => ({
      ...post,
      blocks: normalizeBlocks(post.blocks, post.content),
    })),
  });
});

const blogBodySchema = z.object({
  slug: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  titleI18n: z.record(z.string(), z.string()).optional(),
  excerpt: z.string().optional(),
  excerptI18n: z.record(z.string(), z.string()).optional(),
  content: z.array(z.string()).optional(),
  blocks: z.array(blogBlockSchema).optional(),
  image: z.string().nullable().optional(),
  author: z.string().optional(),
  authorI18n: z.record(z.string(), z.string()).optional(),
  publishedAt: z.string().optional(),
  readTime: z.string().optional(),
  readTimeI18n: z.record(z.string(), z.string()).optional(),
  tags: z.array(z.string()).optional(),
  seoTitle: z.string().nullable().optional(),
  seoTitleI18n: z.record(z.string(), z.string()).optional(),
  seoDescription: z.string().nullable().optional(),
  seoDescriptionI18n: z.record(z.string(), z.string()).optional(),
  published: z.boolean().optional(),
});

function serializeBlogInput(data: z.infer<typeof blogBodySchema>) {
  const next: Record<string, unknown> = {};
  if (data.slug !== undefined) next.slug = data.slug;
  const localizedTitle = syncLocalizedField(data.title, data.titleI18n);
  const localizedExcerpt = syncLocalizedField(data.excerpt, data.excerptI18n);
  const localizedAuthor = syncLocalizedField(data.author, data.authorI18n);
  const localizedReadTime = syncLocalizedField(data.readTime, data.readTimeI18n);
  const localizedSeoTitle = syncLocalizedField(data.seoTitle, data.seoTitleI18n);
  const localizedSeoDescription = syncLocalizedField(
    data.seoDescription,
    data.seoDescriptionI18n,
  );
  if (data.title !== undefined || data.titleI18n !== undefined) {
    next.title = localizedTitle.base ?? data.title;
    next.titleI18n = localizedTitle.i18n;
  }
  if (data.excerpt !== undefined || data.excerptI18n !== undefined) {
    next.excerpt = localizedExcerpt.base ?? data.excerpt;
    next.excerptI18n = localizedExcerpt.i18n;
  }
  if (data.image !== undefined) next.image = data.image;
  if (data.author !== undefined || data.authorI18n !== undefined) {
    next.author = localizedAuthor.base ?? data.author;
    next.authorI18n = localizedAuthor.i18n;
  }
  if (data.readTime !== undefined || data.readTimeI18n !== undefined) {
    next.readTime = localizedReadTime.base ?? data.readTime;
    next.readTimeI18n = localizedReadTime.i18n;
  }
  if (data.tags !== undefined) next.tags = data.tags;
  if (data.seoTitle !== undefined || data.seoTitleI18n !== undefined) {
    next.seoTitle = localizedSeoTitle.base ?? data.seoTitle;
    next.seoTitleI18n = localizedSeoTitle.i18n;
  }
  if (
    data.seoDescription !== undefined ||
    data.seoDescriptionI18n !== undefined
  ) {
    next.seoDescription = localizedSeoDescription.base ?? data.seoDescription;
    next.seoDescriptionI18n = localizedSeoDescription.i18n;
  }
  if (data.published !== undefined) next.published = data.published;
  if (data.publishedAt) next.publishedAt = new Date(data.publishedAt);
  if (data.blocks) {
    next.blocks = data.blocks;
    next.content = paragraphTextsForContent(data.blocks);
  } else if (data.content) {
    next.content = data.content;
  }
  return next;
}

adminRoutes.post("/blog", async (c) => {
  const body = blogBodySchema
    .extend({
      slug: z.string().min(1),
      title: z.string().min(1),
    })
    .safeParse(await c.req.json());
  if (!body.success) return c.json({ error: "Invalid body", details: body.error.flatten() }, 400);

  const blocks =
    body.data.blocks ??
    blocksFromLegacyContent(body.data.content ?? []);

  const post = await prisma.blogPost.create({
    data: {
      slug: body.data.slug,
      title: syncLocalizedField(body.data.title, body.data.titleI18n).base ?? body.data.title,
      titleI18n: syncLocalizedField(body.data.title, body.data.titleI18n).i18n,
      excerpt:
        syncLocalizedField(body.data.excerpt ?? "", body.data.excerptI18n).base ??
        body.data.excerpt ??
        "",
      excerptI18n: syncLocalizedField(body.data.excerpt ?? "", body.data.excerptI18n).i18n,
      content: paragraphTextsForContent(blocks),
      blocks,
      author:
        syncLocalizedField(
          body.data.author ?? "Senay Kitchen",
          body.data.authorI18n,
        ).base ??
        body.data.author ??
        "Senay Kitchen",
      authorI18n: syncLocalizedField(
        body.data.author ?? "Senay Kitchen",
        body.data.authorI18n,
      ).i18n,
      publishedAt: body.data.publishedAt ? new Date(body.data.publishedAt) : new Date(),
      readTime:
        syncLocalizedField(body.data.readTime ?? "3 min", body.data.readTimeI18n)
          .base ??
        body.data.readTime ??
        "3 min",
      readTimeI18n: syncLocalizedField(
        body.data.readTime ?? "3 min",
        body.data.readTimeI18n,
      ).i18n,
      tags: body.data.tags ?? [],
      seoTitle:
        syncLocalizedField(body.data.seoTitle, body.data.seoTitleI18n).base ??
        body.data.seoTitle ??
        undefined,
      seoTitleI18n: syncLocalizedField(body.data.seoTitle, body.data.seoTitleI18n)
        .i18n,
      seoDescription:
        syncLocalizedField(body.data.seoDescription, body.data.seoDescriptionI18n)
          .base ??
        body.data.seoDescription ??
        undefined,
      seoDescriptionI18n: syncLocalizedField(
        body.data.seoDescription,
        body.data.seoDescriptionI18n,
      ).i18n,
      published: body.data.published ?? false,
      image: body.data.image ?? undefined,
    },
  });
  return c.json({ data: { ...post, blocks: normalizeBlocks(post.blocks, post.content) } }, 201);
});

adminRoutes.patch("/blog/:id", async (c) => {
  const body = blogBodySchema.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: "Invalid body" }, 400);

  try {
    const post = await prisma.blogPost.update({
      where: { id: c.req.param("id") },
      data: serializeBlogInput(body.data),
    });
    return c.json({ data: { ...post, blocks: normalizeBlocks(post.blocks, post.content) } });
  } catch (error) {
    if (isPrismaNotFound(error)) return c.json({ error: "Not found" }, 404);
    throw error;
  }
});

adminRoutes.put("/blog/:id", async (c) => {
  const body = blogBodySchema.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: "Invalid body" }, 400);

  try {
    const post = await prisma.blogPost.update({
      where: { id: c.req.param("id") },
      data: serializeBlogInput(body.data),
    });
    return c.json({ data: { ...post, blocks: normalizeBlocks(post.blocks, post.content) } });
  } catch (error) {
    if (isPrismaNotFound(error)) return c.json({ error: "Not found" }, 404);
    throw error;
  }
});

adminRoutes.delete("/blog/:id", async (c) => {
  try {
    await prisma.blogPost.delete({ where: { id: c.req.param("id") } });
    return c.json({ ok: true });
  } catch (error) {
    if (isPrismaNotFound(error)) return c.json({ error: "Not found" }, 404);
    throw error;
  }
});

adminRoutes.get("/settings/:key", async (c) => {
  const row = await prisma.siteSetting.findUnique({
    where: { key: c.req.param("key") },
  });
  if (!row) return c.json({ data: {} });
  const value =
    c.req.param("key") === "telegram"
      ? sanitizeTelegramSettingsForAdmin((row.value ?? {}) as Record<string, unknown>)
      : row.value;
  return c.json({ data: value });
});

adminRoutes.get("/settings", async (c) => {
  const rows = await prisma.siteSetting.findMany();
  return c.json({
    data: Object.fromEntries(
      rows.map((r) => [
        r.key,
        r.key === "telegram"
          ? sanitizeTelegramSettingsForAdmin((r.value ?? {}) as Record<string, unknown>)
          : r.value,
      ]),
    ),
  });
});

adminRoutes.put("/settings/:key", async (c) => {
  const raw = await c.req.json();
  const value =
    raw && typeof raw === "object" && "value" in raw && !Array.isArray(raw)
      ? (raw as { value: unknown }).value
      : raw;
  const normalizedValue = deepNormalizeLocalizedTree(value);
  const storedValue =
    c.req.param("key") === "telegram"
      ? pickTelegramSettingsForDb(normalizedValue as Record<string, unknown>)
      : (normalizedValue as Prisma.InputJsonValue);
  const row = await prisma.siteSetting.upsert({
    where: { key: c.req.param("key") },
    create: {
      key: c.req.param("key"),
      value: storedValue,
    },
    update: { value: storedValue },
  });
  if (c.req.param("key") === "telegram") {
    invalidateTelegramSettingsCache();
    resetBotInstance();
  }
  const responseValue =
    c.req.param("key") === "telegram"
      ? sanitizeTelegramSettingsForAdmin((row.value ?? {}) as Record<string, unknown>)
      : row.value;
  return c.json({ data: responseValue });
});

// ── Admins ───────────────────────────────────────────────────────────────────

function normalizeAdminEmail(email: string) {
  return email.trim().toLowerCase();
}

async function defaultStaffRoleId(): Promise<string> {
  const preferred = await prisma.role.findFirst({
    where: { name: "Content Management" },
  });
  if (preferred) return preferred.id;
  const any = await prisma.role.findFirst({
    where: { name: { not: "Super Admin" } },
    orderBy: { createdAt: "asc" },
  });
  if (!any) throw new Error("No roles found — run db seed");
  return any.id;
}

async function countActiveSuperAdmins(excludeId?: string) {
  return prisma.admin.count({
    where: {
      status: "ACTIVE",
      role: { name: "Super Admin" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
}

const adminSelect = {
  id: true,
  name: true,
  email: true,
  status: true,
  avatar: true,
  telegramChatId: true,
  lastLoginAt: true,
  createdAt: true,
  role: { select: { id: true, name: true } },
} as const;

adminRoutes.get("/admins", requirePermission("admins.read", "admins.manage"), async (c) => {
  const admins = await prisma.admin.findMany({
    orderBy: { createdAt: "desc" },
    select: adminSelect,
  });
  return c.json({ data: admins });
});

adminRoutes.post("/admins", requirePermission("admins.manage"), async (c) => {
  const body = z
    .object({
      name: z.string().trim().min(1).max(120),
      email: z.string().trim().email().max(200),
      /** Optional — Clerk Google login does not use this. */
      password: z.string().min(8).optional(),
      roleId: z.string().optional(),
      status: z.enum(["ACTIVE", "INVITED", "SUSPENDED"]).optional(),
    })
    .safeParse(await c.req.json());
  if (!body.success) {
    return c.json({ error: "Invalid body", details: body.error.flatten() }, 400);
  }

  const email = normalizeAdminEmail(body.data.email);
  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) {
    return c.json({ error: "An admin with this email already exists" }, 409);
  }

  const roleId = body.data.roleId || (await defaultStaffRoleId());
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) return c.json({ error: "Role not found" }, 400);

  const inviteRoles = new Set(["Super Admin", "Content Management"]);
  if (!inviteRoles.has(role.name)) {
    return c.json(
      { error: "Role must be Super Admin or Content Management" },
      400,
    );
  }

  const actor = c.get("admin");
  if (role.name === "Super Admin" && actor.role !== "Super Admin") {
    return c.json({ error: "Only a Super Admin can assign Super Admin" }, 403);
  }

  // Never invent a usable password for Clerk-only invites.
  const passwordHash = await bcrypt.hash(
    body.data.password ?? `clerk-invite:${email}:${crypto.randomUUID()}`,
    12,
  );

  const admin = await prisma.admin.create({
    data: {
      name: body.data.name.trim(),
      email,
      passwordHash,
      roleId,
      status: body.data.status ?? "ACTIVE",
    },
    select: adminSelect,
  });
  return c.json({ data: admin }, 201);
});

adminRoutes.patch("/admins/:id", requirePermission("admins.manage"), async (c) => {
  const id = c.req.param("id");
  const actor = c.get("admin");
  const body = z
    .object({
      name: z.string().trim().min(1).max(120).optional(),
      email: z.string().trim().email().max(200).optional(),
      roleId: z.string().optional(),
      status: z.enum(["ACTIVE", "INVITED", "SUSPENDED"]).optional(),
      avatar: z.string().nullable().optional(),
      telegramChatId: z.string().nullable().optional(),
    })
    .safeParse(await c.req.json());
  if (!body.success) return c.json({ error: "Invalid body" }, 400);

  const current = await prisma.admin.findUnique({
    where: { id },
    include: { role: true },
  });
  if (!current) return c.json({ error: "Not found" }, 404);

  if (body.data.email) {
    const email = normalizeAdminEmail(body.data.email);
    if (email !== current.email) {
      const clash = await prisma.admin.findUnique({ where: { email } });
      if (clash) return c.json({ error: "An admin with this email already exists" }, 409);
    }
    body.data.email = email;
  }

  const nextRoleId = body.data.roleId ?? current.roleId;
  const nextStatus = body.data.status ?? current.status;
  const nextRole =
    nextRoleId === current.roleId
      ? current.role
      : await prisma.role.findUnique({ where: { id: nextRoleId } });
  if (!nextRole) return c.json({ error: "Role not found" }, 400);

  if (body.data.roleId !== undefined) {
    const inviteRoles = new Set(["Super Admin", "Content Management"]);
    if (!inviteRoles.has(nextRole.name)) {
      return c.json(
        { error: "Role must be Super Admin or Content Management" },
        400,
      );
    }
    if (nextRole.name === "Super Admin" && actor.role !== "Super Admin") {
      return c.json({ error: "Only a Super Admin can assign Super Admin" }, 403);
    }
  }

  const wasSuper = current.role.name === "Super Admin" && current.status === "ACTIVE";
  const staysSuper = nextRole.name === "Super Admin" && nextStatus === "ACTIVE";
  if (wasSuper && !staysSuper) {
    const remaining = await countActiveSuperAdmins(id);
    if (remaining < 1) {
      return c.json(
        { error: "Cannot remove or suspend the last active Super Admin" },
        400,
      );
    }
  }

  if (actor.id === id && body.data.status === "SUSPENDED") {
    return c.json({ error: "You cannot suspend your own account" }, 400);
  }

  const admin = await prisma.admin.update({
    where: { id },
    data: {
      ...(body.data.name !== undefined ? { name: body.data.name } : {}),
      ...(body.data.email !== undefined ? { email: body.data.email } : {}),
      ...(body.data.roleId !== undefined ? { roleId: body.data.roleId } : {}),
      ...(body.data.status !== undefined ? { status: body.data.status } : {}),
      ...(body.data.avatar !== undefined ? { avatar: body.data.avatar } : {}),
      ...(body.data.telegramChatId !== undefined
        ? { telegramChatId: body.data.telegramChatId }
        : {}),
    },
    select: adminSelect,
  });
  return c.json({ data: admin });
});

adminRoutes.post(
  "/admins/:id/reset-password",
  requirePermission("admins.manage"),
  async (c) => {
    const body = z.object({ password: z.string().min(8) }).safeParse(await c.req.json());
    if (!body.success) return c.json({ error: "Invalid body" }, 400);

    const passwordHash = await bcrypt.hash(body.data.password, 12);
    await prisma.admin.update({
      where: { id: c.req.param("id") },
      data: { passwordHash },
    });
    return c.json({ ok: true });
  },
);

adminRoutes.delete("/admins/:id", requirePermission("admins.manage"), async (c) => {
  const id = c.req.param("id");
  const actor = c.get("admin");
  if (actor.id === id) {
    return c.json({ error: "You cannot delete your own account" }, 400);
  }

  const current = await prisma.admin.findUnique({
    where: { id },
    include: { role: true },
  });
  if (!current) return c.json({ error: "Not found" }, 404);

  if (current.role.name === "Super Admin" && current.status === "ACTIVE") {
    const remaining = await countActiveSuperAdmins(id);
    if (remaining < 1) {
      return c.json({ error: "Cannot delete the last active Super Admin" }, 400);
    }
  }

  await prisma.admin.delete({ where: { id } });
  return c.json({ ok: true });
});

adminRoutes.get("/roles", requirePermission("admins.read", "admins.manage", "roles.manage"), async (c) => {
  const inviteOnly = c.req.query("invite") === "1";
  const roles = await prisma.role.findMany({
    where: inviteOnly
      ? { name: { in: ["Super Admin", "Content Management"] } }
      : undefined,
    include: { permissions: { include: { permission: true } } },
    orderBy: { name: "asc" },
  });
  return c.json({ data: roles });
});

adminRoutes.get("/notifications", async (c) => {
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return c.json({ data: notifications });
});
