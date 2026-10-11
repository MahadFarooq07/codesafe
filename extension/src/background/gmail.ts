import { authedFetch } from "./auth";
import { extractCode } from "./extract";
import { siteOf } from "../shared/site";
import { CODE_RE, type FoundCode } from "../shared/types";

const BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

/** How far back we look. Codes older than this are almost always expired. */
const WINDOW_MS = 10 * 60 * 1000;

/** Only mail from the last 10 minutes that looks like a verification email. */
const QUERY =
  'newer_than:10m -in:spam -in:trash (code OR verification OR verify OR OTP OR passcode OR "one-time" OR "sign in" OR "log in" OR 2FA)';

/** How long a found code lives in session storage. */
export const CODE_TTL_MS = 5 * 60 * 1000;

interface GmailPayload {
  mimeType?: string;
  headers?: { name: string; value: string }[];
  body?: { data?: string };
  parts?: GmailPayload[];
}

interface GmailMessage {
  id: string;
  internalDate: string;
  snippet?: string;
  payload?: GmailPayload;
}

/** First header with this name. Gmail prepends its own headers, so for
 *  Authentication-Results the first one is Gmail's, not the sender's. */
function header(m: GmailMessage, name: string): string {
  const lower = name.toLowerCase();
  return m.payload?.headers?.find((h) => h.name.toLowerCase() === lower)?.value ?? "";
}

/** "Stripe <no-reply@mail.stripe.com>" -> "stripe.com" */
export function senderDomain(from: string): string {
  // Use the address inside <...> when present so a display name like
  // "support@stripe.com <attacker@evil.io>" can't fool us.
  const angle = from.match(/<([^<>]*)>\s*$/);
  const addr = angle ? angle[1] : from;
  const m = addr.match(/@([a-z0-9.-]+)\s*$/i);
  if (!m) return "unknown";
  return siteOf(m[1]);
}

/**
 * True when Gmail itself recorded that the message passed DMARC for the
 * domain shown in From. Spoofed "From: no-reply@stripe.com" mail fails this.
 */
export function isVerifiedSender(authResults: string, domain: string): boolean {
  const v = authResults.toLowerCase();
  if (!v.startsWith("mx.google.com")) return false;
  const dmarc = v.match(/\bdmarc=(\w+)[^;]*?header\.from=([a-z0-9.-]+)/);
  if (dmarc) return dmarc[1] === "pass" && siteOf(dmarc[2]) === domain;
  // No DMARC record published: fall back to an aligned DKIM signature.
  const dkim = v.match(/\bdkim=pass[^;]*?header\.(?:i|d)=@?([a-z0-9.-]+)/);
  return !!dkim && siteOf(dkim[1]) === domain;
}

function decodeBase64Url(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#?\w+;/g, " ");
}

function bodyText(p?: GmailPayload, depth = 0): string {
  if (!p || depth > 8) return "";
  if (p.mimeType === "text/plain" && p.body?.data) return decodeBase64Url(p.body.data);
  if (p.mimeType === "text/html" && p.body?.data) return htmlToText(decodeBase64Url(p.body.data));
  return (p.parts ?? []).map((part) => bodyText(part, depth + 1)).join(" ");
}

function toFound(m: GmailMessage, code: string): FoundCode | null {
  if (!CODE_RE.test(code)) return null;
  const receivedAt = Number(m.internalDate) || Date.now();
  const sender = senderDomain(header(m, "From"));
  return {
    code,
    sender,
    verified: isVerifiedSender(header(m, "Authentication-Results"), sender),
    messageId: m.id,
    receivedAt,
    expiresAt: Date.now() + CODE_TTL_MS,
  };
}

async function readJson<T>(r: Response, what: string): Promise<T> {
  if (!r.ok) {
    if (r.status === 403) throw new Error("gmail-forbidden");
    if (r.status === 429) throw new Error("gmail-rate-limited");
    throw new Error(`${what} ${r.status}`);
  }
  return (await r.json()) as T;
}

const ID_RE = /^[a-zA-Z0-9]{1,64}$/;

/**
 * Two passes, cheapest first:
 *  1. metadata + snippet for up to 5 messages (no bodies downloaded)
 *  2. full body for the 2 newest only, if the snippet didn't contain the code
 *
 * Messages whose code was already used are skipped. Nothing but the returned
 * FoundCode outlives this function.
 */
export async function findLatestCode(usedIds: ReadonlySet<string>): Promise<FoundCode | null> {
  const list = await readJson<{ messages?: { id: string }[] }>(
    await authedFetch(`${BASE}/messages?maxResults=5&q=${encodeURIComponent(QUERY)}`),
    "list",
  );
  const ids = (list.messages ?? [])
    .map((m) => m.id)
    .filter((id) => typeof id === "string" && ID_RE.test(id) && !usedIds.has(id));
  if (!ids.length) return null;

  const metas = await Promise.all(
    ids.map(async (id) =>
      readJson<GmailMessage>(
        await authedFetch(
          `${BASE}/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Authentication-Results`,
        ),
        "message",
      ),
    ),
  );
  const cutoff = Date.now() - WINDOW_MS;
  const recent = metas
    .filter((m) => Number(m.internalDate) >= cutoff)
    .sort((a, b) => Number(b.internalDate) - Number(a.internalDate));

  for (const m of recent) {
    const code = extractCode(`${header(m, "Subject")} ${m.snippet ?? ""}`);
    const found = code ? toFound(m, code) : null;
    if (found) return found;
  }

  for (const m of recent.slice(0, 2)) {
    const full = await readJson<GmailMessage>(
      await authedFetch(`${BASE}/messages/${m.id}?format=full`),
      "message",
    );
    const code = extractCode(bodyText(full.payload).slice(0, 6000));
    const found = code ? toFound(m, code) : null;
    if (found) return found;
  }

  return null;
}
