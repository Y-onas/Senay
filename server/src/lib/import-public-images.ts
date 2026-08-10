import { access, readFile, readdir, stat } from "node:fs/promises";
import { extname, join } from "node:path";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";
import { isCloudinaryConfigured, uploadBufferToCloudinary } from "./cloudinary.js";
import { addMedia, findMediaByOriginalName, listMedia, type MediaRecord } from "./media-store.js";

const PUBLIC_IMAGES_DIR = join(process.cwd(), "..", "app", "public", "images");

function mimeFromExt(ext: string): string {
  switch (ext.toLowerCase()) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    default:
      return "application/octet-stream";
  }
}

function publicImagePathVariants(filename: string): string[] {
  return [`/images/${filename}`, `/images/${filename.replace(/ /g, "%20")}`];
}

async function replacePublicImageUrls(map: Map<string, string>): Promise<number> {
  let updated = 0;

  const replaceValue = (value: string | null | undefined) => {
    if (!value) return value;
    let next = value;
    for (const [from, to] of map.entries()) {
      if (next.includes(from)) next = next.split(from).join(to);
    }
    return next;
  };

  for (const service of await prisma.service.findMany()) {
    const next = replaceValue(service.image);
    if (next !== service.image) {
      updated += 1;
      await prisma.service.update({ where: { id: service.id }, data: { image: next ?? null } });
    }
  }

  for (const item of await prisma.catalogItem.findMany()) {
    const nextImage = replaceValue(item.image);
    const nextImages = item.images.map((img) => replaceValue(img) ?? img);
    if (nextImage !== item.image || nextImages.some((img, i) => img !== item.images[i])) {
      updated += 1;
      await prisma.catalogItem.update({
        where: { id: item.id },
        data: { image: nextImage ?? null, images: nextImages },
      });
    }
  }

  for (const item of await prisma.galleryImage.findMany()) {
    const next = replaceValue(item.url);
    if (next !== item.url) {
      updated += 1;
      await prisma.galleryImage.update({ where: { id: item.id }, data: { url: next ?? item.url } });
    }
  }

  for (const post of await prisma.blogPost.findMany()) {
    const next = replaceValue(post.image);
    if (next !== post.image) {
      updated += 1;
      await prisma.blogPost.update({ where: { id: post.id }, data: { image: next ?? null } });
    }
  }

  for (const setting of await prisma.siteSetting.findMany()) {
    const raw = JSON.stringify(setting.value);
    let next = raw;
    for (const [from, to] of map.entries()) {
      if (next.includes(from)) next = next.split(from).join(to);
    }
    if (next !== raw) {
      updated += 1;
      await prisma.siteSetting.update({
        where: { key: setting.key },
        data: { value: JSON.parse(next) as Prisma.InputJsonValue },
      });
    }
  }

  return updated;
}

export async function importPublicSiteImages(): Promise<{
  imported: number;
  updated: number;
  items: MediaRecord[];
}> {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured on the server");
  }

  let entries: string[] = [];
  try {
    entries = await readdir(PUBLIC_IMAGES_DIR);
  } catch {
    throw new Error("Public images folder not found");
  }

  const urlMap = new Map<string, string>();
  const importedItems: MediaRecord[] = [];

  for (const filename of entries) {
    const filePath = join(PUBLIC_IMAGES_DIR, filename);
    const info = await stat(filePath);
    if (!info.isFile()) continue;

    const mimeType = mimeFromExt(extname(filename));
    if (!mimeType.startsWith("image/")) continue;

    let record = await findMediaByOriginalName(filename);
    if (!record) {
      const buffer = await readFile(filePath);
      const uploaded = await uploadBufferToCloudinary(buffer, {
        folder: "senay-tela/site",
        filename,
        mimeType,
      });
      record = await addMedia({
        url: uploaded.secureUrl,
        publicId: uploaded.publicId,
        originalName: filename,
        mimeType,
        sizeBytes: uploaded.bytes,
      });
      importedItems.push(record);
    }

    for (const variant of publicImagePathVariants(filename)) {
      urlMap.set(variant, record.url);
    }
  }

  const updated = await replacePublicImageUrls(urlMap);
  return { imported: importedItems.length, updated, items: importedItems };
}

export async function ensurePublicSiteImagesImported(): Promise<void> {
  if (!isCloudinaryConfigured()) return;
  const existing = await listMedia();
  if (existing.length > 0) return;

  try {
    await access(PUBLIC_IMAGES_DIR);
  } catch {
    console.warn(`Public images folder not found at ${PUBLIC_IMAGES_DIR}; skipping media seed.`);
    return;
  }

  const result = await importPublicSiteImages();
  console.log(
    `Media library seeded from public images: imported ${result.imported}, updated ${result.updated} content links`,
  );
}
