import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Media as PrismaMedia, MediaType } from "@prisma/client";
import { prisma } from "./prisma.js";

export type { MediaType };

export interface MediaRecord {
  id: string;
  url: string;
  publicId?: string;
  originalName: string;
  mimeType: string;
  type: MediaType;
  alt?: string | null;
  caption?: string | null;
  sizeBytes?: number;
  createdAt: string;
  updatedAt: string;
}

const LEGACY_STORE_PATH = join(process.cwd(), "data", "media.json");

function mediaTypeFromMime(mime: string): MediaType {
  if (mime.startsWith("image/")) return "IMAGE";
  if (mime.startsWith("video/")) return "VIDEO";
  return "DOCUMENT";
}

function toRecord(row: PrismaMedia): MediaRecord {
  return {
    id: row.id,
    url: row.url,
    publicId: row.publicId ?? undefined,
    originalName: row.originalName,
    mimeType: row.mimeType,
    type: row.type,
    alt: row.alt,
    caption: row.caption,
    sizeBytes: row.size,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listMedia(): Promise<MediaRecord[]> {
  const rows = await prisma.media.findMany({ orderBy: { updatedAt: "desc" } });
  return rows.map(toRecord);
}

export async function addMedia(input: {
  url: string;
  publicId?: string;
  originalName: string;
  mimeType: string;
  sizeBytes?: number;
  alt?: string | null;
  caption?: string | null;
}): Promise<MediaRecord> {
  const row = await prisma.media.create({
    data: {
      url: input.url,
      publicId: input.publicId ?? null,
      originalName: input.originalName,
      filename: input.originalName,
      mimeType: input.mimeType,
      size: input.sizeBytes ?? 0,
      type: mediaTypeFromMime(input.mimeType),
      alt: input.alt ?? null,
      caption: input.caption ?? null,
    },
  });
  return toRecord(row);
}

export async function updateMedia(
  id: string,
  patch: {
    alt?: string | null;
    caption?: string | null;
    url?: string;
    mimeType?: string;
    sizeBytes?: number;
    publicId?: string | null;
  },
): Promise<MediaRecord | null> {
  try {
    const row = await prisma.media.update({
      where: { id },
      data: {
        alt: "alt" in patch ? (patch.alt ?? null) : undefined,
        caption: "caption" in patch ? (patch.caption ?? null) : undefined,
        url: patch.url,
        mimeType: patch.mimeType,
        size: patch.sizeBytes,
        publicId: "publicId" in patch ? (patch.publicId ?? null) : undefined,
      },
    });
    return toRecord(row);
  } catch {
    return null;
  }
}

export async function deleteMedia(id: string): Promise<MediaRecord | null> {
  try {
    const row = await prisma.media.delete({ where: { id } });
    return toRecord(row);
  } catch {
    return null;
  }
}

export async function findMediaByOriginalName(name: string): Promise<MediaRecord | undefined> {
  const row = await prisma.media.findFirst({ where: { originalName: name } });
  return row ? toRecord(row) : undefined;
}

/** One-time import from legacy data/media.json when the DB table is empty. */
export async function migrateLegacyMediaJsonIfNeeded(): Promise<number> {
  const count = await prisma.media.count();
  if (count > 0) return 0;

  let legacy: MediaRecord[];
  try {
    const raw = await readFile(LEGACY_STORE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as MediaRecord[];
    legacy = Array.isArray(parsed) ? parsed : [];
  } catch {
    return 0;
  }

  if (!legacy.length) return 0;

  let imported = 0;
  for (const item of legacy) {
    await prisma.media.create({
      data: {
        id: item.id,
        url: item.url,
        publicId: item.publicId ?? null,
        originalName: item.originalName,
        filename: item.originalName,
        mimeType: item.mimeType,
        size: item.sizeBytes ?? 0,
        type: item.type ?? mediaTypeFromMime(item.mimeType),
        alt: item.alt ?? null,
        caption: item.caption ?? null,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      },
    });
    imported += 1;
  }

  console.log(`Migrated ${imported} media record(s) from legacy media.json into the database`);
  return imported;
}
