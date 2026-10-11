# Security

CodeSafe reads one-time codes out of your Gmail and types them into web pages. That makes it a target. This document covers what it defends against and how.

## Reporting a vulnerability

Please open a private security advisory on GitHub ("Security" tab → "Report a vulnerability") rather than a public issue.

## Assets

- Your Gmail read access (an OAuth access token for `gmail.readonly`).
- The verification codes themselves.
- Your email address.

## Threats and mitigations

| Threat | Mitigation |
| --- | --- |
| A malicious web page asks the extension for the code or your email | Web pages can't message the extension (`externally_connectable` allows nobody). The service worker checks every sender. Content scripts never receive your email, and receive a code only for the one frame that registered a focused field, after a real click. |
| A page tricks you into clicking an invisible pill (clickjacking) so the code fills a field it reads | Pill lives in a closed shadow root, in the browser top layer, with `!important` host styles. Any attribute change by the page destroys it. Clicks must be `isTrusted`, ≥500 ms after the pill appears, and hit-test to the pill with nothing on top. IntersectionObserver v2 visibility is checked where available. |
| Real-time phishing: a look-alike site triggers a real login and asks you for the emailed code | The pill names the sender's domain. If it doesn't match both the frame and the top-level site, or Gmail didn't record DMARC (or aligned DKIM) pass for that domain, the pill is amber and needs two clicks spaced ≥600 ms apart. The keyboard shortcut never auto-fills such a code. |
| A spoofed email, e.g. `From: "security@stripe.com" <x@evil.io>` | The sender domain is parsed from the angle-bracket address, not the display name. Verification uses only Gmail's own (first) `Authentication-Results` header from `mx.google.com`. |
| A page abuses code-field focus to poll your Gmail | Invisible or tiny inputs are ignored. Content-triggered searches are limited to one per 20 s. Each search stops at the first code or after 90 s. Spam and trash are excluded. |
| Code reuse or stale codes | Codes live 5 minutes in `chrome.storage.session` (memory only), are wiped as soon as they are filled, and the source message is never offered again. Messages older than 10 minutes are ignored. |
| Token theft | Chrome's `getAuthToken` keeps the token inside the browser. The optional web-flow token is held only in session storage locked to `TRUSTED_CONTEXTS`. It's validated with Google's `tokeninfo` (audience and scope) and protected by a random `state` against CSRF. Revocation sends the token in a POST body, never a URL. |
| Injected markup | Codes must match `^[A-Z0-9]{4,8}$` at every boundary (extractor, storage, popup, content script, clipboard). The pill builds DOM with `textContent`, never `innerHTML`. |
| Compromised extension pages | Extension CSP: `default-src 'none'; script-src 'self'`, with network access only to Gmail and Google OAuth. |
| Supply chain | No runtime dependencies in the extension. The workspace refuses package versions less than 24 h old (`minimumReleaseAge`) and only lets allow-listed packages run install scripts. Builds are reproducible (fixed zip timestamps, unminified output). |

## Known limitations

- `siteOf()` approximates the registrable domain with a small built-in suffix list rather than the full Public Suffix List. Unknown multi-part suffixes compare by their last two labels, which errs toward "different site" (amber pill).
- Legitimate flows where the code is emailed by a different domain than the site you are on (for example a bank using a third-party auth provider) show the amber pill and need two clicks.
- With "Copy automatically" turned on, the code goes to the system clipboard, where clipboard history tools may keep it. The option is off by default.
- A fully compromised browser renderer can defeat any in-page protection. CodeSafe still never sends the code anywhere except into the field.

## Landing site

The site is a static Next.js export with no third-party origins, no user input and no API calls. Its CSP allows inline scripts because Next.js inlines small bootstrap scripts into exported HTML. `web/vercel.json` and `web/public/_headers` set the CSP, HSTS, `X-Frame-Options: DENY`, `nosniff` and a locked-down `Permissions-Policy` on hosts that support it. The dev server binds to `127.0.0.1` only.
