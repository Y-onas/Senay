import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";

/** Dashboard-managed settings (stored in DB). Secrets live in .env only. */
export type TelegramSettings = {
  enabled: boolean;
  webAppBaseUrl: string;
  notificationsEnabled: boolean;
  notifyOnNewRequest: boolean;
  defaultLanguage: "en" | "am";
  supportedLanguages: Array<"en" | "am">;
};

export type TelegramEnvConfig = {
  botTokenConfigured: boolean;
  botTokenPreview: string;
  webhookUrl: string | null;
  webhookSecretConfigured: boolean;
  websiteBaseUrl: string | null;
  adminIds: string[];
  botMode: string;
};

const DEFAULTS: TelegramSettings = {
  enabled: true,
  webAppBaseUrl: "",
  notificationsEnabled: true,
  notifyOnNewRequest: true,
  defaultLanguage: "en",
  supportedLanguages: ["en", "am"],
};

const DB_STRIPPED_KEYS = ["botToken", "webhookUrl", "websiteBaseUrl"] as const;

let cache: { value: TelegramSettings; expiresAt: number } | null = null;
let lastHeartbeatWarnAt = 0;

async function logHeartbeatFailure(error: unknown): Promise<void> {
  const now = Date.now();
  if (now - lastHeartbeatWarnAt < 5 * 60_000) return;
  lastHeartbeatWarnAt = now;
  const message = error instanceof Error ? error.message : String(error);
  console.warn(
    `[Bot Heartbeat] Could not reach the database (${message}). Bot keeps running; dashboard status may show offline until the DB is reachable again.`,
  );
}

function stripTelegramSecrets<T extends Record<string, unknown>>(value: T): T {
  const next = { ...value };
  for (const key of DB_STRIPPED_KEYS) delete next[key];
  return next;
}

export function maskBotToken(token: string): string {
  if (!token) return "";
  const [id, secret] = token.split(":");
  if (!secret) return "configured";
  return `${id}:${secret.slice(0, 3)}••••••`;
}

/** Secrets and infrastructure URLs — configured in server/.env only. */
export function resolveBotToken(): string {
  return (process.env.BOT_TOKEN || process.env.Bot_token || "").trim();
}

export function resolveWebhookUrl(): string {
  return process.env.BOT_WEBHOOK_URL?.trim() || "";
}

/** Secret sent by Telegram in X-Telegram-Bot-Api-Secret-Token — required in production webhook mode. */
export function resolveWebhookSecretToken(): string {
  return process.env.BOT_WEBHOOK_SECRET?.trim() || "";
}

export function resolveWebsiteBaseUrl(): string {
  return (
    process.env.WEBAPP_URL?.trim() ||
    process.env.WEBSITE_BASE_URL?.trim() ||
    "http://localhost:3000"
  );
}

export function getTelegramEnvConfig(): TelegramEnvConfig {
  const token = resolveBotToken();
  return {
    botTokenConfigured: Boolean(token),
    botTokenPreview: maskBotToken(token),
    webhookUrl: resolveWebhookUrl() || null,
    webhookSecretConfigured: Boolean(resolveWebhookSecretToken()),
    websiteBaseUrl: resolveWebsiteBaseUrl() || null,
    adminIds: (process.env.ADMIN_IDS || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
    botMode: process.env.BOT_MODE || "polling",
  };
}

export function sanitizeTelegramSettingsForAdmin(
  value: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...stripTelegramSecrets(value),
    env: getTelegramEnvConfig(),
  };
}

export function pickTelegramSettingsForDb(
  value: Record<string, unknown>,
): Prisma.InputJsonValue {
  return stripTelegramSecrets(value) as Prisma.InputJsonValue;
}

export async function getTelegramSettings(): Promise<TelegramSettings> {
  if (cache && cache.expiresAt > Date.now()) return cache.value;

  const row = await prisma.siteSetting.findUnique({ where: { key: "telegram" } });
  const raw = stripTelegramSecrets((row?.value ?? {}) as Record<string, unknown>);
  const merged: TelegramSettings = {
    ...DEFAULTS,
    ...(raw as Partial<TelegramSettings>),
    defaultLanguage: raw.defaultLanguage === "am" ? "am" : "en",
    supportedLanguages: Array.isArray(raw.supportedLanguages)
      ? raw.supportedLanguages.filter((lang): lang is "en" | "am" => lang === "en" || lang === "am")
      : DEFAULTS.supportedLanguages,
  };

  cache = { value: merged, expiresAt: Date.now() + 30_000 };
  return merged;
}

export function invalidateTelegramSettingsCache(): void {
  cache = null;
}

export async function isBotEnabled(): Promise<boolean> {
  const settings = await getTelegramSettings();
  return settings.enabled;
}

export async function shouldNotifyAdmins(): Promise<boolean> {
  const settings = await getTelegramSettings();
  return settings.notificationsEnabled && settings.notifyOnNewRequest;
}

export function resolveWebAppBaseUrl(settings?: TelegramSettings): string {
  const base = resolveWebsiteBaseUrl();
  const pathOverride = settings?.webAppBaseUrl?.trim();
  if (!pathOverride) return base;
  if (pathOverride.startsWith("http://") || pathOverride.startsWith("https://")) return pathOverride;
  return `${base.replace(/\/$/, "")}/${pathOverride.replace(/^\//, "")}`;
}

export async function touchBotHeartbeat(): Promise<void> {
  try {
    await prisma.siteSetting.upsert({
      where: { key: "bot:heartbeat" },
      create: { key: "bot:heartbeat", value: { lastSeenAt: new Date().toISOString() } },
      update: { value: { lastSeenAt: new Date().toISOString() } },
    });
  } catch (error) {
    await logHeartbeatFailure(error);
  }
}

export async function getBotHeartbeat(): Promise<Date | null> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: "bot:heartbeat" } });
    const lastSeenAt = (row?.value as { lastSeenAt?: string } | null)?.lastSeenAt;
    return lastSeenAt ? new Date(lastSeenAt) : null;
  } catch {
    return null;
  }
}

/** Apply webhook URL to Telegram when configured from the dashboard. */
export async function syncTelegramWebhook(token: string, webhookUrl: string): Promise<void> {
  const url = webhookUrl.trim();

  const call = async (path: string, init?: RequestInit) => {
    const res = await fetch(`https://api.telegram.org/bot${token}/${path}`, {
      ...init,
      signal: AbortSignal.timeout(10_000),
    });
    const text = await res.text();
    let json: { ok?: boolean; description?: string } = {};
    try {
      json = JSON.parse(text) as typeof json;
    } catch {
      throw new Error(
        `Telegram ${path} failed with status ${res.status}: ${text.slice(0, 200)}`,
      );
    }
    if (!json.ok) {
      throw new Error(json.description ?? `Telegram ${path} failed`);
    }
  };

  if (!url) {
    await call("deleteWebhook");
    return;
  }

  const secretToken = resolveWebhookSecretToken();
  if (!secretToken && process.env.NODE_ENV === "production") {
    throw new Error("BOT_WEBHOOK_SECRET must be set when registering a webhook in production");
  }

  await call("setWebhook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      ...(secretToken ? { secret_token: secretToken } : {}),
    }),
  });
}
