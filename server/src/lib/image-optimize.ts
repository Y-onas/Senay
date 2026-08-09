import sharp from "sharp";

const MAX_EDGE = 2400;
const WEBP_QUALITY = 82;
const JPEG_QUALITY = 82;
const PNG_COMPRESSION = 9;

export type OptimizedImage = {
  buffer: Buffer;
  mimeType: string;
  width: number;
  height: number;
  optimized: boolean;
  originalBytes: number;
  optimizedBytes: number;
};

function isGif(mimeType: string): boolean {
  return mimeType === "image/gif";
}

function isSvg(mimeType: string): boolean {
  return mimeType === "image/svg+xml";
}

/** Resize, compress, and strip metadata from raster images before upload. */
export async function optimizeImageBuffer(
  input: Buffer,
  mimeType: string,
): Promise<OptimizedImage> {
  const originalBytes = input.length;

  if (isGif(mimeType) || isSvg(mimeType)) {
    return {
      buffer: input,
      mimeType,
      width: 0,
      height: 0,
      optimized: false,
      originalBytes,
      optimizedBytes: originalBytes,
    };
  }

  try {
    const pipeline = sharp(input, { failOn: "none" }).rotate().resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    });

    const meta = await sharp(input, { failOn: "none" }).metadata();
    const hasAlpha = meta.hasAlpha === true;

    let buffer: Buffer;
    let outputMime: string;

    if (hasAlpha) {
      buffer = await pipeline.png({ compressionLevel: PNG_COMPRESSION, effort: 10 }).toBuffer();
      outputMime = "image/png";
    } else if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
      buffer = await pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();
      outputMime = "image/jpeg";
    } else {
      buffer = await pipeline.webp({ quality: WEBP_QUALITY, effort: 4 }).toBuffer();
      outputMime = "image/webp";
    }

    const info = await sharp(buffer).metadata();

    // Keep original if optimization didn't help meaningfully.
    if (buffer.length >= originalBytes * 0.97) {
      return {
        buffer: input,
        mimeType,
        width: meta.width ?? 0,
        height: meta.height ?? 0,
        optimized: false,
        originalBytes,
        optimizedBytes: originalBytes,
      };
    }

    return {
      buffer,
      mimeType: outputMime,
      width: info.width ?? 0,
      height: info.height ?? 0,
      optimized: true,
      originalBytes,
      optimizedBytes: buffer.length,
    };
  } catch {
    return {
      buffer: input,
      mimeType,
      width: 0,
      height: 0,
      optimized: false,
      originalBytes,
      optimizedBytes: originalBytes,
    };
  }
}
