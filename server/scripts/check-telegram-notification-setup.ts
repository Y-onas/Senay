import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.admin.findMany({
    where: { status: "ACTIVE" },
    select: { name: true, telegramChatId: true },
  });

  const recipients = admins.filter((admin) => Boolean(admin.telegramChatId?.trim()));
  console.log(JSON.stringify({
    botTokenConfigured: Boolean(process.env.BOT_TOKEN || process.env.Bot_token),
    activeAdmins: admins.length,
    configuredRecipients: recipients.map((admin) => admin.name),
    missingChatId: admins.filter((admin) => !admin.telegramChatId?.trim()).map((admin) => admin.name),
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
