/**
 * Upsert Super Admin + Content Management permissions without a full seed.
 * Run: node --import tsx server/scripts/sync-admin-roles.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PERMISSIONS = [
  { code: "overview.read", description: "View dashboard overview" },
  { code: "requests.read", description: "View service requests" },
  { code: "requests.update", description: "Update request status and notes" },
  { code: "requests.assign", description: "Assign requests to staff" },
  { code: "services.read", description: "View services" },
  { code: "services.manage", description: "Create, edit, enable, reorder services" },
  { code: "packages.read", description: "View packages and products" },
  { code: "packages.manage", description: "Manage catalog items" },
  { code: "content.read", description: "View CMS content" },
  { code: "content.manage", description: "Edit site pages, media, FAQs, gallery, blog" },
  { code: "telegram.manage", description: "Manage Telegram bot, menus, and users" },
  { code: "admins.read", description: "View administrators" },
  { code: "admins.manage", description: "Create, edit, disable admins and reset passwords" },
  { code: "roles.manage", description: "Manage roles and permissions" },
  { code: "notifications.read", description: "View notifications" },
  { code: "settings.manage", description: "Edit system settings" },
] as const;

async function main() {
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: p.code },
      create: { ...p },
      update: { description: p.description },
    });
  }

  const perms = await prisma.permission.findMany();
  const byCode = Object.fromEntries(perms.map((p) => [p.code, p.id]));

  const superAdmin = await prisma.role.upsert({
    where: { name: "Super Admin" },
    create: {
      name: "Super Admin",
      description: "Full access to System, Telegram, Catalog, and content",
      isSystem: true,
    },
    update: {
      description: "Full access to System, Telegram, Catalog, and content",
    },
  });

  const contentManagement = await prisma.role.upsert({
    where: { name: "Content Management" },
    create: {
      name: "Content Management",
      description: "Edit site and content only — no System, Telegram, or Catalog",
      isSystem: true,
    },
    update: {
      description: "Edit site and content only — no System, Telegram, or Catalog",
    },
  });

  for (const permissionId of perms.map((p) => p.id)) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: superAdmin.id, permissionId },
      },
      create: { roleId: superAdmin.id, permissionId },
      update: {},
    });
  }

  const contentCodes = ["overview.read", "content.read", "content.manage"];
  await prisma.rolePermission.deleteMany({
    where: {
      roleId: contentManagement.id,
      permissionId: {
        notIn: contentCodes.map((c) => byCode[c]).filter(Boolean),
      },
    },
  });
  for (const code of contentCodes) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: contentManagement.id,
          permissionId: byCode[code],
        },
      },
      create: {
        roleId: contentManagement.id,
        permissionId: byCode[code],
      },
      update: {},
    });
  }

  console.log("Synced roles:");
  console.log("- Super Admin: all permissions");
  console.log("- Content Management:", contentCodes.join(", "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
