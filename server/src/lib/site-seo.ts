const CANONICAL_ORIGIN = "https://senaycatering.com";

function normalizedPath(pathname: string): string {
  if (pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

/**
 * Keeps the canonical and Open Graph URL aligned with the requested public
 * route before the SPA HTML is returned. It intentionally does not alter any
 * public copy: title, description, og:title, and og:site_name remain exactly
 * as authored in app/index.html.
 */
export function renderSeoHtml(indexHtml: string, pathname: string): string {
  const canonicalUrl = new URL(normalizedPath(pathname), CANONICAL_ORIGIN).toString();

  return indexHtml
    .replace(
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/,
      `<link rel="canonical" href="${canonicalUrl}" />`,
    )
    .replace(
      /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/,
      `<meta property="og:url" content="${canonicalUrl}" />`,
    );
}
