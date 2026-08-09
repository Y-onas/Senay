/**
 * User tracking & language middleware.
 * On every incoming update:
 *   1. Upsert TelegramUser record
 *   2. Set session language for downstream handlers
 *   3. Trigger language selection if first interaction
 */
import type { Context, NextFunction } from "grammy";
import { prisma } from "../../lib/prisma.js";
import { getTelegramSettings } from "../../lib/botConfig.js";

export interface SessionData {
  lang: string;
  telegramUserId: string; // internal DB id (cuid)
  isNewUser: boolean;
  isBlocked: boolean;
}

export type BotContext = Context & { session: SessionData };

/**
 * Middleware: track Telegram user and populate session.
 */
export async function userTrackingMiddleware(
  ctx: BotContext,
  next: NextFunction,
): Promise<void> {
  const from = ctx.from;
  if (!from) {
    await next();
    return;
  }

  const telegramId = BigInt(from.id);
  const settings = await getTelegramSettings();

  // Upsert user record
  const user = await prisma.telegramUser.upsert({
    where: { telegramId },
    create: {
      telegramId,
      username: from.username ?? null,
      firstName: from.first_name,
      lastName: from.last_name ?? null,
      languageCode: settings.defaultLanguage,
    },
    update: {
      username: from.username ?? null,
      firstName: from.first_name,
      lastName: from.last_name ?? null,
      lastInteractAt: new Date(),
    },
  });

  // Populate session data for downstream handlers
  ctx.session = {
    lang: user.languageCode,
    telegramUserId: user.id,
    isBlocked: user.isBlocked,
    isNewUser:
      user.firstSeenAt.getTime() === user.lastInteractAt.getTime() ||
      Date.now() - user.firstSeenAt.getTime() < 5000, // within 5s of creation
  };

  await next();
}
