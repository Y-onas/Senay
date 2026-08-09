const CLOUDINARY_HOST = "res.cloudinary.com";

/** True when the URL already has Cloudinary delivery transforms. */
function hasDeliveryTransform(url: string): boolean {
  const marker = "/upload/";
  const idx = url.indexOf(marker);
  if (idx === -1) return false;
  const after = url.slice(idx + marker.length);
  return !after.startsWith("v") && after.includes(",");
}

/**
 * Add Cloudinary auto-format/quality/size transforms for faster page loads.
 * Safe to call on every image URL returned from the API.
 */
export function optimizedImageUrl(
  url: string | null | undefined,
  width = 1920,
): string | null | undefined {
  if (!url || !url.includes(CLOUDINARY_HOST) || !url.includes("/upload/")) {
    return url;
  }
  if (hasDeliveryTransform(url)) return url;

  const transform = `f_auto,q_auto:good,w_${width},c_limit`;
  return url.replace("/upload/", `/upload/${transform}/`);
}

export function optimizedImageFields<T extends Record<string, unknown>>(
  row: T,
  fields: (keyof T)[],
  width = 1920,
): T {
  const next = { ...row };
  for (const field of fields) {
    const value = next[field];
    if (typeof value === "string") {
      next[field] = optimizedImageUrl(value, width) as T[keyof T];
    }
  }
  return next;
}

export function optimizedImageList(
  urls: string[] | null | undefined,
  width = 1920,
): string[] {
  if (!urls?.length) return urls ?? [];
  return urls.map((url) => optimizedImageUrl(url, width) ?? url);
}

/** Walk JSON content and apply delivery transforms to any Cloudinary URL strings. */
export function optimizeCloudinaryUrlsInJson<T>(value: T, width = 1920): T {
  if (typeof value === "string") {
    return (optimizedImageUrl(value, width) ?? value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => optimizeCloudinaryUrlsInJson(item, width)) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      out[key] = optimizeCloudinaryUrlsInJson(nested, width);
    }
    return out as T;
  }
  return value;
}
