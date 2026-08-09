import { prisma } from "./prisma.js";
import { isLocalizedText, type LocalizedText } from "./i18nContent.js";
import {
  hrefForServiceSlug,
  isServiceHref,
  slugForServiceHref,
} from "./serviceRoutes.js";

type FooterLink = { label: string | LocalizedText; href: string };

function serviceFooterLinkLabel(name: string, nameI18n: unknown): LocalizedText {
  if (isLocalizedText(nameI18n)) {
    return {
      en: nameI18n.en?.trim() || name,
      am: nameI18n.am?.trim() || nameI18n.en?.trim() || name,
    };
  }
  return { en: name, am: name };
}

export async function getEnabledServiceHrefs(): Promise<Set<string>> {
  const services = await prisma.service.findMany({
    where: { enabled: true },
    select: { slug: true },
  });

  return new Set(
    services
      .map((service) => hrefForServiceSlug(service.slug))
      .filter((href): href is string => Boolean(href)),
  );
}

export function filterLinksForEnabledServices<T extends { href: string }>(
  links: T[],
  enabledHrefs: Set<string>,
): T[] {
  return links.filter((link) => !isServiceHref(link.href) || enabledHrefs.has(link.href));
}

/** Keep navigation + footer in sync when a service is enabled or disabled. */
export async function syncServiceVisibility(slug: string, enabled: boolean) {
  const href = hrefForServiceSlug(slug);
  if (!href) return;

  await prisma.navigation.updateMany({
    where: { href },
    data: { enabled },
  });

  const exploreFooter = await prisma.footer.findFirst({
    where: { column: "explore" },
  });
  if (!exploreFooter) return;

  const content = (exploreFooter.content ?? {}) as { links?: FooterLink[] };
  const links = Array.isArray(content.links) ? [...content.links] : [];

  if (!enabled) {
    const filtered = links.filter((link) => link.href !== href);
    if (filtered.length === links.length) return;

    await prisma.footer.update({
      where: { id: exploreFooter.id },
      data: { content: { ...content, links: filtered } },
    });
    return;
  }

  const service = await prisma.service.findUnique({
    where: { slug },
    select: { name: true, nameI18n: true },
  });
  if (!service) return;

  const hasLink = links.some((link) => link.href === href);
  if (hasLink) return;

  const blogIndex = links.findIndex((link) => link.href === "/blog");
  const nextLink = {
    label: serviceFooterLinkLabel(service.name, service.nameI18n),
    href,
  };
  const nextLinks =
    blogIndex >= 0
      ? [...links.slice(0, blogIndex), nextLink, ...links.slice(blogIndex)]
      : [...links, nextLink];

  await prisma.footer.update({
    where: { id: exploreFooter.id },
    data: { content: { ...content, links: nextLinks } },
  });
}

export async function filterFooterRowsForEnabledServices<
  T extends { column: string; content?: unknown },
>(rows: T[]): Promise<T[]> {
  const enabledHrefs = await getEnabledServiceHrefs();

  return rows.map((row) => {
    if (row.column !== "explore" && row.column !== "company") return row;

    const content = (row.content ?? {}) as { links?: FooterLink[] };
    if (!Array.isArray(content.links)) return row;

    return {
      ...row,
      content: {
        ...content,
        links: filterLinksForEnabledServices(content.links, enabledHrefs),
      },
    };
  });
}

export { slugForServiceHref };
