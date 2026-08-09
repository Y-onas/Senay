import { Hono } from "hono";
import { z } from "zod";
import {
  deleteFromCloudinary,
  inferMediaMimeType,
  isAllowedMediaUpload,
  isAllowedVideoUpload,
  isCloudinaryConfigured,
  uploadFileToCloudinary,
} from "../lib/cloudinary.js";
import { importPublicSiteImages } from "../lib/import-public-images.js";
import { optimizeAllMediaRecords } from "../lib/optimize-media.js";
import {
  addMedia,
  deleteMedia,
  listMedia,
  updateMedia,
} from "../lib/media-store.js";

export const mediaRoutes = new Hono();

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

mediaRoutes.get("/", async (c) => {
  const q = c.req.query("q")?.trim().toLowerCase();
  const type = c.req.query("type")?.toUpperCase();
  const limit = Number(c.req.query("limit") ?? "0");

  let items = await listMedia();

  if (type && ["IMAGE", "VIDEO", "DOCUMENT"].includes(type)) {
    items = items.filter((item) => item.type === type);
  }

  if (q) {
    items = items.filter((item) => {
      const haystack = `${item.originalName} ${item.alt ?? ""} ${item.caption ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }

  const total = items.length;
  if (limit > 0) items = items.slice(0, limit);

  return c.json({
    data: items,
    meta: { total },
  });
});

mediaRoutes.post("/", async (c) => {
  if (!isCloudinaryConfigured()) {
    return c.json({ error: "Cloudinary is not configured on the server" }, 503);
  }

  let form: FormData;
  try {
    form = await c.req.formData();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid upload payload";
    return c.json({ error: message }, 400);
  }
  const entries = [
    ...form.getAll("files").filter((entry): entry is File => entry instanceof File),
    ...(form.get("file") instanceof File ? [form.get("file") as File] : []),
  ];

  if (!entries.length) {
    return c.json({ error: "At least one file is required" }, 400);
  }

  const uploaded = [];
  for (const file of entries) {
    const isVideo = isAllowedVideoUpload(file.name, file.type || undefined);
    const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;

    if (file.size > maxBytes) {
      return c.json(
        { error: isVideo ? "Max video upload size is 100MB" : "Max upload size is 10MB per file" },
        400,
      );
    }
    if (!isAllowedMediaUpload(file.name, file.type || undefined)) {
      return c.json(
        {
          error:
            "Unsupported file type. Use JPG, PNG, WEBP, GIF, AVIF, HEIC, HEIF, MP4, WEBM, or MOV.",
        },
        400,
      );
    }

    const result = await uploadFileToCloudinary(file);
    const mimeType =
      result.format && result.resourceType === "image"
        ? `image/${result.format}`
        : inferMediaMimeType(file.name, file.type || undefined);
    const record = await addMedia({
      url: result.secureUrl,
      publicId: result.publicId,
      originalName: file.name,
      mimeType,
      sizeBytes: result.bytes,
    });
    uploaded.push(record);
  }

  return c.json({ data: uploaded }, 201);
});

mediaRoutes.patch("/:id", async (c) => {
  const body = z
    .object({
      alt: z.string().nullable().optional(),
      caption: z.string().nullable().optional(),
    })
    .safeParse(await c.req.json());

  if (!body.success) return c.json({ error: "Invalid body" }, 400);

  const updated = await updateMedia(c.req.param("id"), body.data);
  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json({ data: updated });
});

mediaRoutes.delete("/:id", async (c) => {
  const removed = await deleteMedia(c.req.param("id"));
  if (!removed) return c.json({ error: "Not found" }, 404);

  if (removed.publicId) {
    const resourceType =
      removed.type === "VIDEO" ? "video" : removed.type === "DOCUMENT" ? "raw" : "image";
    try {
      await deleteFromCloudinary(removed.publicId, resourceType);
    } catch {
      // Keep DB/store delete successful even if remote delete fails.
    }
  }

  return c.json({ ok: true });
});

mediaRoutes.post("/import-public", async (c) => {
  try {
    const result = await importPublicSiteImages();
    return c.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import failed";
    const status = message.includes("not configured") ? 503 : message.includes("not found") ? 404 : 500;
    return c.json({ error: message }, status);
  }
});

/** Re-compress all images in the media library (Cloudinary overwrite). */
mediaRoutes.post("/optimize", async (c) => {
  if (!isCloudinaryConfigured()) {
    return c.json({ error: "Cloudinary is not configured on the server" }, 503);
  }

  try {
    const result = await optimizeAllMediaRecords();
    return c.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Optimization failed";
    return c.json({ error: message }, 500);
  }
});
