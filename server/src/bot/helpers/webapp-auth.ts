/**
 * Telegram WebApp initData HMAC-SHA256 validation.
 * See: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *
 * Never trust frontend-only data. Always validate on the backend.
 */
import { createHmac } from "node:crypto";

export interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface WebAppValidationResult {
  valid: boolean;
  user?: TelegramWebAppUser;
  authDate?: number;
  /** Server-side detail for logs — do not expose to HTTP clients. */
  error?: string;
}

export const WEBAPP_AUTH_CLIENT_ERROR = "Invalid Telegram WebApp authentication";

/**
 * Validate Telegram WebApp initData string.
 * @param initData  Raw `initData` string from Telegram.WebApp.initData
 * @param botToken  Bot token used as HMAC key
 * @param maxAgeSeconds  Maximum allowed age of the auth_date (default: 1 hour)
 */
export function validateWebAppData(
  initData: string,
  botToken: string,
  maxAgeSeconds: number = 3600,
): WebAppValidationResult {
  if (!initData || !botToken) {
    return { valid: false, error: "Missing initData or botToken" };
  }

  try {
    // Parse the initData as URL-encoded params
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) {
      return { valid: false, error: "Missing hash in initData" };
    }

    // Build data-check-string: sort params (excluding hash), join with \n
    params.delete("hash");
    const entries = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
    const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join("\n");

    // HMAC-SHA256 validation
    // secret_key = HMAC-SHA256("WebAppData", bot_token)
    const secretKey = createHmac("sha256", "WebAppData")
      .update(botToken)
      .digest();

    const calculatedHash = createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    if (calculatedHash !== hash) {
      return { valid: false, error: "Invalid hash — data may be tampered" };
    }

    // Check auth_date freshness
    const authDate = parseInt(params.get("auth_date") ?? "0", 10);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > maxAgeSeconds) {
      return { valid: false, error: "Auth data expired" };
    }

    // Parse user object
    const userStr = params.get("user");
    let user: TelegramWebAppUser | undefined;
    if (userStr) {
      user = JSON.parse(userStr) as TelegramWebAppUser;
    }

    return { valid: true, user, authDate };
  } catch (err) {
    console.warn("[Telegram WebApp] validation error:", err);
    return { valid: false, error: WEBAPP_AUTH_CLIENT_ERROR };
  }
}
