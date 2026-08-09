import { SignJWT, jwtVerify } from "jose";
import type { Context, Next } from "hono";
import { prisma } from "./prisma.js";

const secret = () =>
  new TextEncoder().encode(
    process.env.JWT_SECRET || "dev-only-change-me-senay-tela",
  );

export type AuthAdmin = {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
};

export async function signAdminToken(admin: AuthAdmin): Promise<string> {
  return new SignJWT({
    sub: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    permissions: admin.permissions,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret());
}

export async function verifyAdminToken(token: string): Promise<AuthAdmin | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub || typeof payload.email !== "string") return null;
    return {
      id: payload.sub,
      email: payload.email,
      name: String(payload.name ?? ""),
      role: String(payload.role ?? ""),
      permissions: Array.isArray(payload.permissions)
        ? (payload.permissions as string[])
        : [],
    };
  } catch {
    return null;
  }
}

declare module "hono" {
  interface ContextVariableMap {
    admin: AuthAdmin;
  }
}

/** Require valid JWT + ACTIVE admin in DB. */
export async function requireAuth(c: Context, next: Next) {
  const header = c.req.header("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return c.json({ error: "Unauthorized" }, 401);

  const payload = await verifyAdminToken(token);
  if (!payload) return c.json({ error: "Unauthorized" }, 401);

  const admin = await prisma.admin.findUnique({
    where: { id: payload.id },
    include: {
      role: { include: { permissions: { include: { permission: true } } } },
    },
  });

  if (!admin || admin.status !== "ACTIVE") {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const permissions = admin.role.permissions.map((rp) => rp.permission.code);
  c.set("admin", {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role.name,
    permissions,
  });

  await next();
}

/** Require one of the given permission codes (Super Admin bypass via all perms). */
export function requirePermission(...codes: string[]) {
  return async (c: Context, next: Next) => {
    const admin = c.get("admin");
    if (!admin) return c.json({ error: "Unauthorized" }, 401);
    const ok = codes.some((code) => admin.permissions.includes(code));
    if (!ok) return c.json({ error: "Forbidden" }, 403);
    await next();
  };
}
