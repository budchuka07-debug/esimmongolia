/**
 * Verify Capacitor mobile setup without deploying.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const required = [
  "package.json",
  "capacitor.config.json",
  "js/api-config.js",
  "js/capacitor-app.js",
  "css/capacitor-mobile.css",
  "resources/icon.svg",
  "resources/splash.svg",
  "public/.well-known/assetlinks.json",
  "public/.well-known/apple-app-site-association",
  "netlify/functions/push-register.js",
  "README_APP.md"
];

let ok = true;
for (const rel of required) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) {
    console.error("MISSING:", rel);
    ok = false;
  } else {
    console.log("OK:", rel);
  }
}

if (!fs.existsSync(path.join(ROOT, "www", "index.html"))) {
  console.warn("WARN: www/ not built yet — run: npm run www:sync");
}

if (!ok) process.exit(1);
console.log("\nMobile setup files present. Run npm install && npm run cap:sync to build native projects.");
