# CodeSafe

Your Gmail codes, one click away.

CodeSafe is a Chrome extension that brings the iPhone "From Messages" code suggestion to Chrome. When you focus a verification-code field, a small pill appears above it with the latest code from your Gmail and who sent it. Click it and the code is filled in.

[![CodeSafe demo](docs/codesafe-demo.gif)](docs/codesafe-film.mp4)

**[Watch the 30-second film (MP4)](docs/codesafe-film.mp4)**

## How it works

1. Focus a code field on any site.
2. CodeSafe checks the last 10 minutes of your Gmail and shows the code above the field.
3. Click the pill (or press ⌘⇧Y / Ctrl+Shift+Y). Done.

If the code came from a different site than the one you're on, or Gmail couldn't verify the sender, the pill turns amber and needs a second click. That's your cue to check you're not on a phishing page.

## Privacy & security

- No server. The extension talks directly to Google's Gmail API from your browser.
- Read-only access (`gmail.readonly`). It can never send, delete or change mail.
- Looks only when you focus a code field, and only at recent messages that look like they contain a code.
- The code is kept in session memory for 5 minutes, or until it's used, then wiped.
- Hardened against malicious pages: sender-checked messaging, a clickjacking-resistant pill, single-use codes, and a strict CSP. See [SECURITY.md](SECURITY.md).

## Repository layout

| Path | What it is |
| --- | --- |
| `extension/` | The Chrome extension (Manifest V3, TypeScript, esbuild). Setup guide in [`extension/README.md`](extension/README.md). |
| `web/` | The landing page (Next.js App Router, static export, Tailwind) with install info and the privacy policy. |
| `video/` | The animated explainer film (React + Framer Motion). |
| `docs/` | The exported film and demo GIF. |

## Quick start

Requires Node.js 20+ and pnpm 10 (`corepack enable` or `npm i -g pnpm`).

```bash
pnpm install
pnpm ext:keygen     # once: stable extension ID + oauth.config.json
pnpm ext:build
```

Open `chrome://extensions`, turn on Developer mode, choose **Load unpacked**, and select `extension/dist`. Google sign-in needs a one-time OAuth client setup in Google Cloud. See [`extension/README.md`](extension/README.md).

## Develop

```bash
pnpm web:dev        # landing page on http://127.0.0.1:3000
pnpm video:dev      # explainer film on http://127.0.0.1:5174
pnpm test           # extractor + security tests
pnpm typecheck      # all packages
pnpm ext:zip        # package extension/release/codesafe-extension.zip for a GitHub Release
pnpm --filter @codesafe/web run build   # static site -> web/out (deploy that folder anywhere)
```

## Architecture notes

- No backend anywhere: the extension calls `gmail.googleapis.com` directly; the Next.js site is a static export (`output: "export"`), deployable to Vercel, Netlify, Cloudflare Pages or any static host. Security headers ship in `web/vercel.json` and `web/public/_headers`.
- Background service worker (`extension/src/background`): auth, Gmail search, code extraction, and the only place the code is stored (`chrome.storage.session`).
- Content script (`extension/src/content`): detects code fields from input attributes, renders the pill, and fills it with the native value setter plus input/change events, so React and Vue controlled inputs accept the value. Split 6-box inputs are detected via `maxlength=1` groups.
- esbuild rather than a Vite CRX plugin: MV3 content scripts can't be ES modules, and a plain multi-entry build is predictable.
- Design: Apple-style white UI, system fonts, no emojis. Tokens live in `extension/src/shared/tokens.ts` and are shared by the popup and the pill.
