import { optimizeImageBuffer } from "./image-optimize.js";
import {
  isCloudinaryConfigured,
  overwriteCloudinaryImage,
} from "./cloudinary.js";
import { listMedia, updateMedia, type MediaRecord } from "./media-store.js";

export type OptimizeMediaResult = {
  id: string;
  originalName: string;
  status: "optimized" | "skipped" | "failed";
  savedBytes?: number;
  error?: string;
};

async function fetchImageBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} (${response.status})`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function optimizeMediaRecord(record: MediaRecord): Promise<OptimizeMediaResult> {
  if (record.type !== "IMAGE") {
    return {
      id: record.id,
      originalName: record.originalName,
      status: "skipped",
    };
  }

  if (!record.publicId) {
    return {
      id: record.id,
      originalName: record.originalName,
      status: "skipped",
      error: "No Cloudinary publicId",
    };
  }

  try {
    const originalBytes = record.sizeBytes ?? 0;
    const source = await fetchImageBuffer(record.url);
    const optimized = await optimizeImageBuffer(source, record.mimeType);

    if (!optimized.optimized && optimized.optimizedBytes >= optimized.originalBytes * 0.97) {
      return {
        id: record.id,
        originalName: record.originalName,
        status: "skipped",
      };
    }

    const uploaded = await overwriteCloudinaryImage(
      record.publicId,
      optimized.buffer,
      optimized.mimeType,
    );

    await updateMedia(record.id, {
      url: uploaded.secureUrl,
      mimeType: optimized.mimeType,
      sizeBytes: uploaded.bytes,
    });

    return {
      id: record.id,
      originalName: record.originalName,
      status: "optimized",
      savedBytes: Math.max(0, originalBytes - uploaded.bytes),
    };
  } catch (error) {
    return {
      id: record.id,
      originalName: record.originalName,
      status: "failed",
      error: error instanceof Error ? error.message : "Optimization failed",
    };
  }
}

export async function optimizeAllMediaRecords(): Promise<{
  total: number;
  optimized: number;
  skipped: number;
  failed: number;
  savedBytes: number;
  results: OptimizeMediaResult[];
}> {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured on the server");
  }

  const items = await listMedia();
  const images = items.filter((item) => item.type === "IMAGE");
  const results: OptimizeMediaResult[] = [];

  let optimized = 0;
  let skipped = 0;
  let failed = 0;
  let savedBytes = 0;

  for (const item of images) {
    const result = await optimizeMediaRecord(item);
    results.push(result);

    if (result.status === "optimized") {
      optimized += 1;
      savedBytes += result.savedBytes ?? 0;
    } else if (result.status === "failed") {
      failed += 1;
    } else {
      skipped += 1;
    }
  }

  return {
    total: images.length,
    optimized,
    skipped,
    failed,
    savedBytes,
    results,
  };
}
