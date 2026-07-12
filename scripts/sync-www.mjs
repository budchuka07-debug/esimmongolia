/**
 * Copy static web assets into www/ for Capacitor packaging.
 * Does not copy server code, secrets, or native project folders.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const WWW = path.join(ROOT, "www");

const SKIP_DIRS = new Set([
  "node_modules",
  "www",
  "android",
  "ios",
  ".git",
  ".capacitor",
  "scripts",
  "agent-tools",
  ".cursor"
]);

const SKIP_FILES = new Set([
  "package.json",
  "package-lock.json",
  "capacitor.config.json",
  ".gitignore",
  "README_APP.md"
]);

const MOBILE_HEAD = `
<link rel="stylesheet" href="/css/capacitor-mobile.css"/>
<script src="/js/api-config.js"></script>
`.trim();

const MOBILE_BODY = `
<script src="/js/capacitor-app.js" defer></script>
`.trim();

function shouldSkip(rel) {
  const parts = rel.split(path.sep);
  if (parts.some((p) => SKIP_DIRS.has(p))) return true;
  if (SKIP_FILES.has(path.basename(rel))) return true;
  if (rel.startsWith("netlify" + path.sep + "functions")) return true;
  return false;
}

function copyRecursive(src, dest, rel = "") {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (shouldSkip(rel)) return;
    fs.mkdirSync(dest, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      copyRecursive(path.join(src, name), path.join(dest, name), path.join(rel, name));
    }
    return;
  }
  if (shouldSkip(rel)) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function injectMobile(html) {
  let out = html;
  if (!out.includes("api-config.js")) {
    if (out.includes("</head>")) {
      out = out.replace("</head>", `  ${MOBILE_HEAD}\n</head>`);
    } else if (out.includes("<body")) {
      out = out.replace(/<body([^>]*)>/i, `<body$1>\n${MOBILE_HEAD}`);
    }
  }
  if (!out.includes("capacitor-app.js") && out.includes("</body>")) {
    out = out.replace("</body>", `  ${MOBILE_BODY}\n</body>`);
  }
  return out;
}

function postProcessHtmlFiles(dir, rel = "") {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const r = path.join(rel, name);
    if (shouldSkip(r)) continue;
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      postProcessHtmlFiles(full, r);
      continue;
    }
    if (!name.endsWith(".html")) continue;
    const raw = fs.readFileSync(full, "utf8");
    const next = injectMobile(raw);
    if (next !== raw) fs.writeFileSync(full, next, "utf8");
  }
}

function main() {
  if (fs.existsSync(WWW)) {
    fs.rmSync(WWW, { recursive: true, force: true });
  }
  fs.mkdirSync(WWW, { recursive: true });

  for (const name of fs.readdirSync(ROOT)) {
    const src = path.join(ROOT, name);
    if (shouldSkip(name)) continue;
    copyRecursive(src, path.join(WWW, name), name);
  }

  postProcessHtmlFiles(WWW);
  console.log("[www:sync] Copied static assets to www/ and injected mobile scripts.");
}

main();
