import { createClerkClient, verifyToken } from "@clerk/backend";
import { prisma } from "./prisma.js";
import { signAdminToken, type AuthAdmin } from "./auth.js";

export function getClerkPublishableKey(): string | null {
  return process.env.CLERK_PUBLISHABLE_KEY?.trim() || null;
}

export function getClerkSecretKey(): string | null {
  return process.env.CLERK_SECRET_KEY?.trim() || null;
}

export function isClerkConfigured(): boolean {
  return Boolean(getClerkPublishableKey() && getClerkSecretKey());
}

async function toAuthProfile(adminId: string): Promise<AuthAdmin> {
  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    include: {
      role: { include: { permissions: { include: { permission: true } } } },
    },
  });
  if (!admin || admin.status !== "ACTIVE") {
    throw new Error("Admin account is not active");
  }
  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role.name,
    permissions: admin.role.permissions.map((rp) => rp.permission.code),
  };
}

/**
 * Verify a Clerk session JWT, ensure the email exists as an ACTIVE admin in the DB,
 * and return the app JWT + profile. No emails are auto-created here.
 */
export async function exchangeClerkSession(sessionToken: string): Promise<{
  token: string;
  admin: AuthAdmin;
}> {
  const secretKey = getClerkSecretKey();
  if (!secretKey) {
    throw new Error("Clerk is not configured");
  }

  const payload = await verifyToken(sessionToken, { secretKey });
  const userId = typeof payload.sub === "string" ? payload.sub : null;
  if (!userId) {
    throw new Error("Invalid Clerk session");
  }

  const clerk = createClerkClient({ secretKey });
  const user = await clerk.users.getUser(userId);

  const primaryId = user.primaryEmailAddressId;
  const primary =
    user.emailAddresses.find((e) => e.id === primaryId) ??
    user.emailAddresses[0];
  const email = primary?.emailAddress?.trim().toLowerCase();
  if (!email) {
    throw new Error("Clerk account has no email address");
  }

  const clerkName =
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || null;

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) {
    throw new Error(
      "This Google account is not authorized. Ask a Super Admin to add your email under System → Admins.",
    );
  }
  if (admin.status !== "ACTIVE") {
    throw new Error("This admin account is suspended");
  }

  await prisma.admin.update({
    where: { id: admin.id },
    data: {
      name: admin.name?.trim() ? admin.name : clerkName || admin.name,
      avatar: user.imageUrl || admin.avatar,
      lastLoginAt: new Date(),
    },
  });

  const profile = await toAuthProfile(admin.id);
  const token = await signAdminToken(profile);
  return { token, admin: profile };
}
