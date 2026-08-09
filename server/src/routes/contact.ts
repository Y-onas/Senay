import { Hono } from "hono";
import type { Context } from "hono";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../lib/auth.js";

export const contactRoutes = new Hono();

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Valid email is required").max(200),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().min(1, "Message is required").max(5000),
});

async function createContactMessage(c: Context) {
  const body = await c.req.json();
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      400,
    );
  }

  const { name, email, phone, message } = parsed.data;
  const row = await prisma.contactMessage.create({
    data: {
      name,
      email,
      phone: phone || null,
      message,
    },
  });

  await prisma.notification.create({
    data: {
      kind: "REQUEST",
      title: "New contact message",
      body: `${name} — ${message.slice(0, 80)}${message.length > 80 ? "…" : ""}`,
      meta: { contactMessageId: row.id, email },
    },
  });

  return c.json({ data: { ok: true, id: row.id } }, 201);
}

/** Public submit — frontend tries both paths. */
contactRoutes.post("/", createContactMessage);
contactRoutes.post("/messages", createContactMessage);

/** Admin inbox (bundle uses /contact/admin/messages). */
contactRoutes.get("/admin/messages", requireAuth, async (c) => {
  const unread = c.req.query("unread");
  const messages = await prisma.contactMessage.findMany({
    where: unread === "true" ? { read: false } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return c.json({ data: messages });
});

contactRoutes.patch("/admin/messages/:id/read", requireAuth, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  const read =
    typeof body === "object" && body && "read" in body
      ? Boolean((body as { read: unknown }).read)
      : true;

  const existing = await prisma.contactMessage.findUnique({ where: { id } });
  if (!existing) return c.json({ error: "Message not found" }, 404);

  const updated = await prisma.contactMessage.update({
    where: { id },
    data: { read },
  });
  return c.json({ data: updated });
});

contactRoutes.delete("/admin/messages/:id", requireAuth, async (c) => {
  const id = c.req.param("id");
  const existing = await prisma.contactMessage.findUnique({ where: { id } });
  if (!existing) return c.json({ error: "Message not found" }, 404);
  await prisma.contactMessage.delete({ where: { id } });
  return c.json({ ok: true });
});
