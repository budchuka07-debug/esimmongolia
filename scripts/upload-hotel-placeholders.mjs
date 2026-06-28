#!/usr/bin/env node
/**
 * Upload assets/seed-images/hotels/* to Cloudinary
 * Saves data/cloudinary-hotel-images.json grouped by category
 *
 * Env: CLOUDINARY_CLOUD_NAME=dflwo8gmz CLOUDINARY_UPLOAD_PRESET=esimmongolia_upload
 * Run: node scripts/setup-hotel-seed-assets.mjs && node scripts/upload-hotel-placeholders.mjs
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ASSETS = join(ROOT, "assets/seed-images/hotels");
const OUT = join(ROOT, "data/cloudinary-hotel-images.json");

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "dflwo8gmz";
const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || "esimmongolia_upload";
const BASE_FOLDER = "esimmongolia/hotel-placeholders";

const CATEGORIES = ["budget", "midrange", "luxury", "beach", "city", "business", "room", "lobby", "bathroom", "restaurant"];

async function uploadFile(filePath, folder) {
  const fd = new FormData();
  const blob = new Blob([readFileSync(filePath)]);
  fd.append("file", blob, filePath.split(/[/\\]/).pop());
  fd.append("upload_preset", UPLOAD_PRESET);
  fd.append("folder", folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: fd
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `Upload failed: ${filePath}`);
  return {
    secure_url: data.secure_url,
    public_id: data.public_id,
    folder,
    filename: filePath.split(/[/\\]/).pop()
  };
}

function loadExisting() {
  if (!existsSync(OUT)) return null;
  try {
    return JSON.parse(readFileSync(OUT, "utf8"));
  } catch {
    return null;
  }
}

async function main() {
  if (!existsSync(ASSETS)) {
    console.error("Run setup first: node scripts/setup-hotel-seed-assets.mjs");
    process.exit(1);
  }

  const skipExisting = process.argv.includes("--skip-existing");
  const existing = skipExisting ? loadExisting() : null;
  const result = {
    cloud_name: CLOUD_NAME,
    base_folder: BASE_FOLDER,
    uploaded_at: new Date().toISOString(),
    categories: {}
  };

  for (const cat of CATEGORIES) {
    const dir = join(ASSETS, cat);
    if (!existsSync(dir)) {
      result.categories[cat] = [];
      continue;
    }
    if (skipExisting && existing?.categories?.[cat]?.length) {
      result.categories[cat] = existing.categories[cat];
      console.log(`Skip ${cat}: ${result.categories[cat].length} cached`);
      continue;
    }

    const files = readdirSync(dir).filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f));
    result.categories[cat] = [];
    for (const f of files) {
      const fp = join(dir, f);
      try {
        const item = await uploadFile(fp, `${BASE_FOLDER}/${cat}`);
        result.categories[cat].push(item);
        console.log("OK", cat, f, item.secure_url);
      } catch (err) {
        console.error("FAIL", cat, f, err.message);
        throw err;
      }
    }
  }

  writeFileSync(OUT, JSON.stringify(result, null, 2), "utf8");
  const urlCount = Object.values(result.categories).reduce((n, arr) => n + arr.length, 0);
  console.log(`\nWrote ${OUT} (${urlCount} images)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
