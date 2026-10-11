# CodeSafe: Chrome extension

Manifest V3 · TypeScript · esbuild · no runtime dependencies · no backend.

Shows the latest verification code from your Gmail in a pill above any code field. One click fills it.

## Build

```bash
pnpm ext:build    # -> extension/dist
pnpm ext:zip      # also writes extension/release/codesafe-extension.zip (attach to a GitHub Release)
pnpm --filter @codesafe/extension run test        # extractor + security tests
pnpm --filter @codesafe/extension run release     # build without the "key" field, for the Web Store
```

## One-time Google setup (required for sign-in)

Sign-in can't work until you create your own OAuth client in Google Cloud. It takes about ten minutes.

1. **Stable extension ID.** Run `pnpm ext:keygen`. It creates `extension/key.pem` (private, git-ignored), writes the public key into `extension/oauth.config.json`, and prints your **extension ID**.
2. [console.cloud.google.com](https://console.cloud.google.com): New project, call it "CodeSafe".
3. APIs & Services → Library → **Gmail API** → Enable.
4. OAuth consent screen (Google Auth Platform) → External → app name "CodeSafe" → Data access → add scope `https://www.googleapis.com/auth/gmail.readonly` → Audience → add your Gmail address under **Test users**. Leave it in *Testing*.
5. Clients → Create client → type **Chrome Extension** → paste the extension ID from step 1. Copy the client ID into `extension/oauth.config.json` → `"chromeClientId"`.
6. *(Optional, for Edge, Brave, Arc and other Chromium browsers.)* Create a second client of type **Web application** with the authorized redirect URI `https://<extension-id>.chromiumapp.org/` (printed by `keygen`). Put its client ID in `"webClientId"`. Google Chrome works with step 5 alone.
7. `pnpm ext:build`, open `chrome://extensions`, turn on Developer mode, **Load unpacked** → `extension/dist`. Check that the ID shown matches step 1.

`oauth.config.json` is git-ignored. You can also pass the values as `CODESAFE_CHROME_CLIENT_ID`, `CODESAFE_WEB_CLIENT_ID` and `CODESAFE_EXTENSION_KEY` environment variables (handy in CI).

## Try it

1. Click the toolbar icon → **Continue with Google**. While the app is in Testing, Google shows an "unverified app" screen: Advanced → Continue.
2. Email yourself: subject "Test", body `Your verification code is 482193`.
3. Run `pnpm --filter @codesafe/extension run test:page` and open <http://127.0.0.1:8787/>. Focus a field. The pill shows three dots while it checks Gmail, then the code. Codes on the test page are always amber, because the sender (gmail.com) doesn't match the page, so click twice. On a real site where the sender matches, one click fills it.

## What it touches

| Permission | Why |
| --- | --- |
| `identity` | Google sign-in through the browser; no passwords handled |
| `storage` | `session` (memory only, locked to extension pages) for the current code and sign-in state; `sync` for two toggles |
| `alarms` | the 5-minute wipe survives the service worker sleeping |
| `clipboardWrite` + `offscreen` | the Copy button / optional auto-copy |
| host `gmail.googleapis.com` | the only API the extension calls (plus `oauth2.googleapis.com` to validate and revoke tokens) |
| content script on `http(s)://*/*` | to see code inputs; it reads input attributes only, never page text or values |

Gmail search: `newer_than:10m -in:spam -in:trash` plus code keywords, max 5 results, snippet first, full body for the two newest only, and only when you focus a code field, open the popup, or press the shortcut.

## Security design

See [`../SECURITY.md`](../SECURITY.md) for the threat model. In short:

- **Sender checks on every message.** Web pages can't message the extension at all. Content scripts get a small API: "a code field was focused", "the user clicked the pill". Only the popup can sign in or out or change settings.
- **The code only goes to one frame:** the one that registered the focused field. It's delivered after a real click, and it's single-use. Once filled it's wiped, and that email is never offered again.
- **Phishing friction.** The pill shows the sender's domain. If that domain doesn't match the site (both the frame and the top-level page), or Gmail didn't record a DMARC/DKIM pass for it, the pill turns amber and needs two deliberate clicks.
- **Anti-clickjacking pill.** Closed shadow root, top-layer popover, `!important` host styles, and teardown if the page touches the host. A click only counts if it is `isTrusted`, comes ≥500 ms after the pill appeared, and hits the pill with nothing on top. Where Chrome supports IntersectionObserver v2, the browser must also confirm the pill was really visible.
- **Hidden or tiny fields are ignored**, so a page can't trigger Gmail searches with invisible inputs. Content-triggered searches are rate-limited.
- **Strict extension CSP.** `default-src 'none'`, scripts only from the package, network only to Google's Gmail and OAuth endpoints.

## Publishing

`gmail.readonly` is a Google *restricted* scope. A public Chrome Web Store listing needs OAuth verification: a privacy policy URL (the landing page's `/privacy`), a demo video, and a CASA security assessment. Until then, up to 100 test users can use it with the "unverified" interstitial. Build with `pnpm --filter @codesafe/extension run release` (no `key` field) before uploading to the Web Store, and register the Web Store's extension ID on your OAuth client.
