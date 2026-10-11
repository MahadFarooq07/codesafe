# CodeSafe — Chrome extension

Manifest V3 · TypeScript · esbuild · no runtime dependencies · no backend.

Shows the latest verification code from your Gmail in a pill above any code field. One click fills it.

## Build

```bash
pnpm --filter @workspace/codesafe-extension run build   # -> extension/dist
pnpm --filter @workspace/codesafe-extension run zip     # also writes artifacts/codetap-web/public/codesafe-extension.zip
pnpm --filter @workspace/codesafe-extension run test    # extractor test cases
```

## One-time Google setup (required for sign-in)

1. [console.cloud.google.com](https://console.cloud.google.com) → New project → "CodeSafe".
2. APIs & Services → Library → **Gmail API** → Enable.
3. OAuth consent screen → External → app name "CodeSafe" → add scope `https://www.googleapis.com/auth/gmail.readonly` → add your Gmail address under **Test users**. Leave it in *Testing*.
4. Get a stable extension ID so Google can trust it:
   ```bash
   openssl genrsa 2048 | openssl pkcs8 -topk8 -nocrypt -out key.pem
   openssl rsa -in key.pem -pubout -outform DER | openssl base64 -A
   ```
   Put the printed base64 string in `manifest.json` as `"key": "..."`. (`key.pem` is git-ignored; don't share it.)
5. Build, open `chrome://extensions`, enable Developer mode, **Load unpacked** → `extension/dist`. Copy the extension ID shown.
6. Credentials → Create credentials → OAuth client ID → type **Chrome Extension** → paste the ID. Copy the client ID into `manifest.json` → `oauth2.client_id`. Rebuild and reload.

## Try it

1. Click the toolbar icon → **Continue with Google** (Google shows an "unverified app" screen while in Testing — Advanced → Continue).
2. Email yourself: subject "Test", body `Your verification code is 482193`.
3. Open `test/otp.html` (enable "Allow access to file URLs" for the extension), focus a field. The pill says "Checking Gmail…", then shows the code. Click it.

## What it touches

| Permission | Why |
| --- | --- |
| `identity` | Google sign-in through Chrome; no passwords handled |
| `storage` | `session` for the current code (RAM only, 5-minute TTL), `sync` for two toggles |
| `alarms` | the 5-minute wipe survives the service worker sleeping |
| `clipboardWrite` + `offscreen` | the Copy button / optional auto-copy |
| host `gmail.googleapis.com` | the only network destination |
| content script on `<all_urls>` | to see code inputs; it reads input attributes only |

Gmail search: `newer_than:10m` plus code keywords, max 5 results, snippet first, full body for the two newest only, and only when you focus a code field, open the popup, or press the shortcut.

## Publishing

`gmail.readonly` is a Google *restricted* scope. For a public Chrome Web Store listing you need OAuth verification (privacy policy URL — the landing page's `/privacy` — plus a demo video and a CASA security assessment). Until then up to 100 test users can use it with the "unverified" interstitial. Remove the `key` field from the manifest before uploading to the Web Store.
