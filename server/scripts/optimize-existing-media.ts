/**
 * Batch-optimize all images in media.json (re-upload compressed versions to Cloudinary).
 * Run: npm run media:optimize
 */
import "dotenv/config";
import { optimizeAllMediaRecords } from "../src/lib/optimize-media.js";

async function main() {
  console.log("Optimizing media library images...\n");
  const result = await optimizeAllMediaRecords();

  console.log(`Total images: ${result.total}`);
  console.log(`Optimized:    ${result.optimized}`);
  console.log(`Skipped:      ${result.skipped}`);
  console.log(`Failed:       ${result.failed}`);
  console.log(`Saved:        ${Math.round(result.savedBytes / 1024)} KB\n`);

  for (const row of result.results) {
    if (row.status === "optimized") {
      console.log(`  ✓ ${row.originalName} (saved ${Math.round((row.savedBytes ?? 0) / 1024)} KB)`);
    } else if (row.status === "failed") {
      console.log(`  ✗ ${row.originalName}: ${row.error}`);
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
