// Builds the extension into dist/ with esbuild and, with --zip, packages it
// into ../artifacts/codetap-web/public/codesafe-extension.zip so the landing
// page's "Add to Chrome" button serves the latest build.
import { build } from "esbuild";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, "dist");
const wantZip = process.argv.includes("--zip");

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

const common = {
  bundle: true,
  minify: false,
  sourcemap: false,
  target: ["chrome120"],
  logLevel: "info",
  legalComments: "none",
};

await Promise.all([
  // MV3 service worker: ES module.
  build({ ...common, entryPoints: [path.join(root, "src/background/index.ts")], outfile: path.join(dist, "background.js"), format: "esm" }),
  // Content script, popup and offscreen page: classic scripts (no module imports allowed).
  build({ ...common, entryPoints: [path.join(root, "src/content/index.ts")], outfile: path.join(dist, "content.js"), format: "iife" }),
  build({ ...common, entryPoints: [path.join(root, "src/popup/index.ts")], outfile: path.join(dist, "popup.js"), format: "iife" }),
  build({ ...common, entryPoints: [path.join(root, "src/background/offscreen.ts")], outfile: path.join(dist, "offscreen.js"), format: "iife" }),
]);

// Static files.
cpSync(path.join(root, "public"), dist, { recursive: true });
cpSync(path.join(root, "manifest.json"), path.join(dist, "manifest.json"));

// Inline the shared tokens into popup.css so there is a single source of truth.
const tokensSrc = readFileSync(path.join(root, "src/shared/tokens.ts"), "utf8");
const tokens = tokensSrc.match(/`([\s\S]*?)`/)?.[1] ?? "";
const cssPath = path.join(dist, "popup.css");
writeFileSync(cssPath, readFileSync(cssPath, "utf8").replace("__TOKENS__", tokens.trim()));

const manifest = JSON.parse(readFileSync(path.join(dist, "manifest.json"), "utf8"));
console.log(`\nCodeSafe ${manifest.version} built to extension/dist`);
if (String(manifest.oauth2?.client_id ?? "").startsWith("PASTE_")) {
  console.log("note: manifest.json still has a placeholder OAuth client_id; sign-in will not work until it is set.");
}

if (wantZip) {
  const outDir = path.join(root, "..", "artifacts", "codetap-web", "public");
  mkdirSync(outDir, { recursive: true });
  const zipPath = path.join(outDir, "codesafe-extension.zip");
  if (existsSync(zipPath)) rmSync(zipPath);
  execSync(`cd "${dist}" && zip -qr -X "${zipPath}" .`, { stdio: "inherit" });
  console.log(`zipped to ${path.relative(path.join(root, ".."), zipPath)}`);
}
