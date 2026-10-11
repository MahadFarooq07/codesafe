// Generates a private key for a stable extension ID (once), then prints the
// extension ID and the values Google Cloud asks for. No openssl needed.
//
//   pnpm ext:keygen
//
// key.pem stays on your machine (git-ignored). Only its *public* half goes
// into oauth.config.json -> "key".
import { createHash, createPrivateKey, createPublicKey, generateKeyPairSync } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const pemPath = path.join(root, "key.pem");
const cfgPath = path.join(root, "oauth.config.json");

let privateKey;
if (existsSync(pemPath)) {
  privateKey = createPrivateKey(readFileSync(pemPath));
  console.log("Using existing key.pem");
} else {
  ({ privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 }));
  writeFileSync(pemPath, privateKey.export({ type: "pkcs8", format: "pem" }), { mode: 0o600 });
  console.log("Created key.pem (keep it private, don't commit it)");
}

const der = createPublicKey(privateKey).export({ type: "spki", format: "der" });
const key = der.toString("base64");
// Chrome's extension ID: first 128 bits of SHA-256(public key), hex digits mapped 0-f -> a-p.
const id = createHash("sha256")
  .update(der)
  .digest("hex")
  .slice(0, 32)
  .replace(/./g, (h) => String.fromCharCode(97 + parseInt(h, 16)));

const cfg = existsSync(cfgPath) ? JSON.parse(readFileSync(cfgPath, "utf8")) : { chromeClientId: "", webClientId: "" };
cfg.key = key;
writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + "\n");

console.log(`
Extension ID:   ${id}
Redirect URI:   https://${id}.chromiumapp.org/   (only for the optional "Web application" client)

Wrote the public key to extension/oauth.config.json.
Next: create the OAuth client(s) in Google Cloud with this ID, paste the client ID(s)
into oauth.config.json, then run \`pnpm ext:build\`. Full steps: extension/README.md
`);
