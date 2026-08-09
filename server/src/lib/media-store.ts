import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

export type MediaType = "IMAGE" | "VIDEO" | "DOCUMENT";

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

const DATA_DIR = join(process.cwd(), "data");
const STORE_PATH = join(DATA_DIR, "media.json");

function mediaTypeFromMime(mime: string): MediaType {
  if (mime.startsWith("image/")) return "IMAGE";
  if (mime.startsWith("video/")) return "VIDEO";
  return "DOCUMENT";
}

async function ensureStore(): Promise<MediaRecord[]> {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await readFile(STORE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as MediaRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveStore(items: MediaRecord[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(items, null, 2), "utf-8");
}

export async function listMedia(): Promise<MediaRecord[]> {
  const items = await ensureStore();
  return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
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
  const items = await ensureStore();
  const now = new Date().toISOString();
  const record: MediaRecord = {
    id: randomUUID(),
    url: input.url,
    publicId: input.publicId,
    originalName: input.originalName,
    mimeType: input.mimeType,
    type: mediaTypeFromMime(input.mimeType),
    alt: input.alt ?? null,
    caption: input.caption ?? null,
    sizeBytes: input.sizeBytes,
    createdAt: now,
    updatedAt: now,
  };
  items.unshift(record);
  await saveStore(items);
  return record;
}

export async function updateMedia(
  id: string,
  patch: {
    alt?: string | null;
    caption?: string | null;
    url?: string;
    mimeType?: string;
    sizeBytes?: number;
  },
): Promise<MediaRecord | null> {
  const items = await ensureStore();
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return null;

  items[index] = {
    ...items[index],
    alt: patch.alt ?? items[index].alt ?? null,
    caption: patch.caption ?? items[index].caption ?? null,
    url: patch.url ?? items[index].url,
    mimeType: patch.mimeType ?? items[index].mimeType,
    sizeBytes: patch.sizeBytes ?? items[index].sizeBytes,
    updatedAt: new Date().toISOString(),
  };
  await saveStore(items);
  return items[index];
}

export async function deleteMedia(id: string): Promise<MediaRecord | null> {
  const items = await ensureStore();
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return null;
  const [removed] = items.splice(index, 1);
  await saveStore(items);
  return removed;
}

export async function findMediaByOriginalName(name: string): Promise<MediaRecord | undefined> {
  const items = await ensureStore();
  return items.find((item) => item.originalName === name);
}
