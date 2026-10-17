import type { Context } from "hono";
import { prisma } from "../lib/prisma.js";

const CANONICAL_ORIGIN = "https://senaycatering.com";

const STATIC_PATHS = ["/", "/menu", "/blog", "/about", "/contact"] as const;

const SERVICE_PATHS: Record<string, string> = {
  agelgil: "/agelgil",
  baltina: "/baltina",
  festival: "/festival-package",
  drinks: "/traditional-drinks",
  catering: "/catering",
};

export type SitemapEntry = {
  path: string;
  lastModified?: Date;
};

function escapeXml(value: string): string {
  return value.replace(/[<>&'\"]/g, (character) => {
    switch (character) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return character;
    }
  });
}

function absoluteUrl(path: string): string {
  return new URL(path, CANONICAL_ORIGIN).toString();
}

export function buildSitemapXml(entries: SitemapEntry[]): string {
  const urls = entries
    .map(({ path, lastModified }) => {
      const lastmod = lastModified
        ? `\n    <lastmod>${lastModified.toISOString()}</lastmod>`
        : "";
      return `  <url>\n    <loc>${escapeXml(absoluteUrl(path))}</loc>${lastmod}\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/**
 * A database-backed sitemap keeps published blog URLs and enabled service pages
 * in sync without requiring a rebuild or exposing any non-public content.
 */
export async function sitemapHandler(c: Context) {
  try {
    const [services, posts] = await Promise.all([
      prisma.service.findMany({
        where: { enabled: true },
        select: { slug: true },
      }),
      prisma.blogPost.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
        orderBy: { publishedAt: "desc" },
      }),
    ]);

    const serviceEntries = services.flatMap((service) => {
      const path = SERVICE_PATHS[service.slug];
      return path ? [{ path }] : [];
    });

    const postEntries = posts.map((post) => ({
      path: `/blog/${encodeURIComponent(post.slug)}`,
      lastModified: post.updatedAt,
    }));

    return c.body(
      buildSitemapXml([...STATIC_PATHS.map((path) => ({ path })), ...serviceEntries, ...postEntries]),
      200,
      {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=0, must-revalidate",
      },
    );
  } catch (error) {
    console.error("Unable to generate sitemap", error);
    return c.text("Sitemap unavailable", 500);
  }
}
