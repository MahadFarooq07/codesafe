// Serves test/otp.html on http://127.0.0.1:8787 for manual testing.
// Bound to loopback only, serves exactly two files, nothing else.
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const files = {
  "/": ["otp.html", "text/html; charset=utf-8"],
  "/otp.js": ["otp.js", "text/javascript; charset=utf-8"],
};

createServer((req, res) => {
  const entry = files[new URL(req.url ?? "/", "http://127.0.0.1").pathname];
  if (!entry || req.method !== "GET") {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, {
    "Content-Type": entry[1],
    "Content-Security-Policy": "default-src 'self'; style-src 'self' 'unsafe-inline'",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(readFileSync(path.join(dir, entry[0])));
}).listen(8787, "127.0.0.1", () => console.log("CodeSafe test page: http://127.0.0.1:8787/"));
