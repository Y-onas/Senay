/** Build a consistent, Telegram-only WebApp URL for every bot entry point. */
export function buildWebAppUrl(baseUrl: string, path: string, lang: string): string {
  const base = new URL(baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  const normalizedPath = `/${path.replace(/^\/+/, "")}`;
  const url = new URL(normalizedPath, base);
  if (url.origin !== base.origin) {
    throw new Error(`WebApp path resolves outside the base origin: ${path}`);
  }
  url.searchParams.set("lang", lang);
  url.searchParams.set("tg", "1");
  return url.toString();
}
