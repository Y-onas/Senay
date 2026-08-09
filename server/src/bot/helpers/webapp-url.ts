/** Build a consistent, Telegram-only WebApp URL for every bot entry point. */
export function buildWebAppUrl(baseUrl: string, path: string, lang: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(normalizedPath, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  url.searchParams.set("lang", lang);
  url.searchParams.set("tg", "1");
  return url.toString();
}
