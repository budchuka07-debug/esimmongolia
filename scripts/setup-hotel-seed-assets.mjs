#!/usr/bin/env node
/**
 * Copy licensed local hotel stock photos into assets/seed-images/hotels/{category}/
 * Source: /images/hotels/ (project-owned placeholders, not Google/Trip/Booking)
 * Run: node scripts/setup-hotel-seed-assets.mjs
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "images/hotels");
const DEST = join(ROOT, "assets/seed-images/hotels");

const CATEGORY_FILES = {
  budget: ["exterior-01.jpg", "exterior-02.jpg", "exterior-04.jpg", "exterior-05.jpg", "exterior-06.jpg", "standard_room-01.jpg", "standard_room-02.jpg", "standard_room-03.jpg"],
  midrange: ["exterior-07.jpg", "exterior-08.jpg", "lobby-05.jpg", "lobby-06.jpg", "standard_room-06.jpg", "standard_room-07.jpg"],
  luxury: ["exterior-09.jpg", "exterior-10.jpg", "exterior-11.jpg", "exterior-12.jpg", "deluxe_room-01.jpg", "deluxe_room-05.jpg", "lobby-11.jpg", "lobby-12.jpg"],
  beach: ["exterior-03.jpg", "exterior-07.jpg", "exterior-09.jpg", "deluxe_room-08.jpg"],
  city: ["exterior-01.jpg", "exterior-05.jpg", "exterior-08.jpg", "lobby-04.jpg"],
  business: ["lobby-01.jpg", "lobby-02.jpg", "lobby-03.jpg", "exterior-04.jpg", "restaurant-01.jpg"],
  restaurant: ["restaurant-01.jpg", "restaurant-02.jpg", "restaurant-03.jpg", "restaurant-04.jpg", "restaurant-05.jpg"]
};

function copyGlob(category, pattern) {
  const dir = join(DEST, category);
  mkdirSync(dir, { recursive: true });
  const prefix = pattern.replace("*", "");
  const files = readdirSync(SRC).filter((f) => f.startsWith(prefix.replace(".jpg", "")) && f.endsWith(".jpg"));
  files.forEach((f) => {
    copyFileSync(join(SRC, f), join(dir, f));
  });
  return files.length;
}

function main() {
  if (!existsSync(SRC)) {
    console.error("Missing source folder:", SRC);
    process.exit(1);
  }
  mkdirSync(DEST, { recursive: true });

  let total = 0;
  for (const [cat, files] of Object.entries(CATEGORY_FILES)) {
    mkdirSync(join(DEST, cat), { recursive: true });
    for (const f of files) {
      const from = join(SRC, f);
      if (!existsSync(from)) {
        console.warn("Skip missing:", f);
        continue;
      }
      copyFileSync(from, join(DEST, cat, f));
      total++;
    }
  }
  total += copyGlob("room", "standard_room");
  total += copyGlob("room", "deluxe_room");
  total += copyGlob("lobby", "lobby-");
  total += copyGlob("bathroom", "bathroom-");

  console.log(`Setup complete: ${total} files in ${DEST}`);
}

main();
