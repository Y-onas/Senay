import { v2 as cloudinary } from "cloudinary";
import { Readable } from "node:stream";
import { extname } from "node:path";
import { optimizeImageBuffer } from "./image-optimize.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export type CloudinaryUploadResult = {
  publicId: string;
  url: string;
  secureUrl: string;
  bytes: number;
  format?: string;
  resourceType: "image" | "video" | "raw";
};

export function inferImageMimeType(filename: string, mimeType?: string): string {
  if (mimeType && mimeType !== "application/octet-stream") return mimeType;
  switch (extname(filename).toLowerCase()) {
    case ".heic":
    case ".heif":
      return "image/heic";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".avif":
      return "image/avif";
    case ".bmp":
      return "image/bmp";
    case ".tif":
    case ".tiff":
      return "image/tiff";
    default:
      return mimeType || "application/octet-stream";
  }
}

export function inferMediaMimeType(filename: string, mimeType?: string): string {
  if (mimeType && mimeType !== "application/octet-stream") return mimeType;
  switch (extname(filename).toLowerCase()) {
    case ".mp4":
      return "video/mp4";
    case ".webm":
      return "video/webm";
    case ".mov":
      return "video/quicktime";
    case ".m4v":
      return "video/x-m4v";
    default:
      return inferImageMimeType(filename, mimeType);
  }
}

export function isAllowedImageUpload(filename: string, mimeType?: string): boolean {
  const mime = inferImageMimeType(filename, mimeType);
  if (mime.startsWith("image/")) return true;
  return [".heic", ".heif", ".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".bmp", ".tif", ".tiff"].includes(
    extname(filename).toLowerCase(),
  );
}

export function isAllowedVideoUpload(filename: string, mimeType?: string): boolean {
  const mime = inferMediaMimeType(filename, mimeType);
  if (mime.startsWith("video/")) return true;
  return [".mp4", ".webm", ".mov", ".m4v"].includes(extname(filename).toLowerCase());
}

export function isAllowedMediaUpload(filename: string, mimeType?: string): boolean {
  return isAllowedImageUpload(filename, mimeType) || isAllowedVideoUpload(filename, mimeType);
}

function resourceTypeFromMime(mime: string): "image" | "video" | "raw" {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return "raw";
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

export async function uploadBufferToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string;
    filename?: string;
    mimeType?: string;
    publicId?: string;
    overwrite?: boolean;
    skipOptimize?: boolean;
  },
): Promise<CloudinaryUploadResult> {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured");
  }

  let uploadBuffer = buffer;
  let mimeType = options.mimeType ?? "image/jpeg";
  const resourceType = resourceTypeFromMime(mimeType);
  const folder = options.folder ?? "senay-tela";

  if (resourceType === "image" && !options.skipOptimize) {
    const optimized = await optimizeImageBuffer(buffer, mimeType);
    uploadBuffer = optimized.buffer;
    mimeType = optimized.mimeType;
  }

  const uploadOptions: Record<string, unknown> = {
    resource_type: resourceType,
    quality: "auto:good",
    fetch_format: "auto",
  };

  if (options.publicId) {
    uploadOptions.public_id = options.publicId;
    uploadOptions.overwrite = options.overwrite ?? false;
    uploadOptions.invalidate = true;
  } else {
    uploadOptions.folder = folder;
    if (options.filename) {
      uploadOptions.public_id = options.filename.replace(/\.[^.]+$/, "");
    }
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve({
          publicId: result.public_id,
          url: result.url,
          secureUrl: result.secure_url,
          bytes: result.bytes ?? uploadBuffer.length,
          format: result.format,
          resourceType,
        });
      },
    );

    Readable.from(uploadBuffer).pipe(stream);
  });
}

export async function uploadFileToCloudinary(
  file: File,
  folder = "senay-tela",
): Promise<CloudinaryUploadResult> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = inferMediaMimeType(file.name, file.type || undefined);
  return uploadBufferToCloudinary(buffer, {
    folder,
    filename: file.name,
    mimeType,
  });
}

export async function deleteFromCloudinary(
  publicId: string,
  resourceType: "image" | "video" | "raw" = "image",
): Promise<void> {
  if (!isCloudinaryConfigured()) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

/** Re-upload an optimized buffer over an existing Cloudinary asset (same public_id). */
export async function overwriteCloudinaryImage(
  publicId: string,
  buffer: Buffer,
  mimeType: string,
): Promise<CloudinaryUploadResult> {
  return uploadBufferToCloudinary(buffer, {
    publicId,
    mimeType,
    overwrite: true,
  });
}
