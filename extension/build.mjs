// Builds the extension into dist/ with esbuild.
//
//   node build.mjs            development build (keeps the manifest "key" so the ID is stable)
//   node build.mjs --zip      also packages dist/ into release/codesafe-extension.zip (attach it to a GitHub Release)
//   node build.mjs --release  strips the "key" field (required for Chrome Web Store uploads)
//
// OAuth settings come from oauth.config.json (git-ignored; see oauth.config.example.json),
// or from the CODESAFE_CHROME_CLIENT_ID / CODESAFE_WEB_CLIENT_ID / CODESAFE_EXTENSION_KEY
// environment variables.
import { build } from "esbuild";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeZip } from "./scripts/zip.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, "dist");
const wantZip = process.argv.includes("--zip");
const release = process.argv.includes("--release");

const CLIENT_ID_RE = /^[0-9]{6,20}-[a-z0-9]{20,40}\.apps\.googleusercontent\.com$/;
const KEY_RE = /^[A-Za-z0-9+/]{200,1000}={0,2}$/;

function loadConfig() {
  const file = path.join(root, "oauth.config.json");
  const fromFile = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {};
  const cfg = {
    chromeClientId: process.env.CODESAFE_CHROME_CLIENT_ID ?? fromFile.chromeClientId ?? "",
    webClientId: process.env.CODESAFE_WEB_CLIENT_ID ?? fromFile.webClientId ?? "",
    key: process.env.CODESAFE_EXTENSION_KEY ?? fromFile.key ?? "",
  };
  for (const k of ["chromeClientId", "webClientId"]) {
    if (cfg[k] && !CLIENT_ID_RE.test(cfg[k])) throw new Error(`oauth.config.json: ${k} doesn't look like a Google OAuth client ID`);
  }
  if (cfg.key && !KEY_RE.test(cfg.key)) throw new Error("oauth.config.json: key must be the base64 public key printed by `pnpm ext:keygen`");
  return cfg;
}

const cfg = loadConfig();

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

const common = {
  bundle: true,
  minify: false, // readable output makes store review and user audits easy
  sourcemap: false,
  target: ["chrome116"],
  logLevel: "info",
  legalComments: "none",
  define: { __CODESAFE_WEB_CLIENT_ID__: JSON.stringify(cfg.webClientId) },
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

// Inline the shared tokens into popup.css so there is a single source of truth.
const tokensSrc = readFileSync(path.join(root, "src/shared/tokens.ts"), "utf8");
const tokens = tokensSrc.match(/`([\s\S]*?)`/)?.[1] ?? "";
const cssPath = path.join(dist, "popup.css");
writeFileSync(cssPath, readFileSync(cssPath, "utf8").replace("__TOKENS__", tokens.trim()));

// Manifest with OAuth settings filled in.
const manifest = JSON.parse(readFileSync(path.join(root, "manifest.json"), "utf8"));
if (cfg.chromeClientId) manifest.oauth2.client_id = cfg.chromeClientId;
else delete manifest.oauth2; // no Chrome client: rely on the web-flow client (if any)
if (cfg.key && !release) manifest.key = cfg.key;
writeFileSync(path.join(dist, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

console.log(`\nCodeSafe ${manifest.version} built to extension/dist${release ? " (release)" : ""}`);
if (!cfg.chromeClientId && !cfg.webClientId) {
  console.log("note: no OAuth client ID configured; Google sign-in will not work until you set one up.");
  console.log("      See extension/README.md -> 'One-time Google setup'.");
}
if (!cfg.key && !release) {
  console.log("note: no extension key configured; the extension ID will change between machines. Run `pnpm ext:keygen`.");
}

if (wantZip) {
  const outDir = path.join(root, "release");
  mkdirSync(outDir, { recursive: true });
  const zipPath = path.join(outDir, "codesafe-extension.zip");
  writeZip(dist, zipPath);
  console.log(`zipped to ${path.relative(path.join(root, ".."), zipPath)}`);
}
