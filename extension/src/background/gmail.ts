import { authedFetch } from "./auth";
import { extractCode } from "./extract";
import type { FoundCode } from "../shared/types";

const BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

/** Only mail from the last 10 minutes that looks like a verification email. */
const QUERY =
  'newer_than:10m (code OR verification OR verify OR OTP OR passcode OR "one-time" OR "sign in" OR "log in" OR 2FA)';

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

function header(m: GmailMessage, name: string): string {
  const lower = name.toLowerCase();
  return m.payload?.headers?.find((h) => h.name.toLowerCase() === lower)?.value ?? "";
}

/** "Stripe <no-reply@mail.stripe.com>" -> "stripe.com" */
export function senderDomain(from: string): string {
  const m = from.match(/@([\w.-]+)/);
  if (!m) return "unknown";
  return m[1]
    .toLowerCase()
    .replace(/^(mail|email|e|noreply|no-reply|notifications?|notify|accounts?|auth|security|info|hello|support|alerts?|em|mta|bounce)\./, "")
    .replace(/^(mail|email|noreply|no-reply|notifications?)\./, "");
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

function bodyText(p?: GmailPayload): string {
  if (!p) return "";
  if (p.mimeType === "text/plain" && p.body?.data) return decodeBase64Url(p.body.data);
  if (p.mimeType === "text/html" && p.body?.data) return htmlToText(decodeBase64Url(p.body.data));
  return (p.parts ?? []).map(bodyText).join(" ");
}

function toFound(m: GmailMessage, code: string): FoundCode {
  const receivedAt = Number(m.internalDate) || Date.now();
  return {
    code,
    sender: senderDomain(header(m, "From")),
    subject: header(m, "Subject").slice(0, 60),
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

/**
 * Two passes, cheapest first:
 *  1. metadata + snippet for up to 5 messages (no bodies downloaded)
 *  2. full body for the 2 newest only, if the snippet didn't contain the code
 *
 * Nothing but the returned FoundCode outlives this function.
 */
export async function findLatestCode(): Promise<FoundCode | null> {
  const list = await readJson<{ messages?: { id: string }[] }>(
    await authedFetch(`${BASE}/messages?maxResults=5&q=${encodeURIComponent(QUERY)}`),
    "list",
  );
  const ids = (list.messages ?? []).map((m) => m.id);
  if (!ids.length) return null;

  const metas = await Promise.all(
    ids.map(async (id) =>
      readJson<GmailMessage>(
        await authedFetch(
          `${BASE}/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`,
        ),
        "message",
      ),
    ),
  );
  metas.sort((a, b) => Number(b.internalDate) - Number(a.internalDate));

  for (const m of metas) {
    const code = extractCode(`${header(m, "Subject")} ${m.snippet ?? ""}`);
    if (code) return toFound(m, code);
  }

  for (const m of metas.slice(0, 2)) {
    const full = await readJson<GmailMessage>(
      await authedFetch(`${BASE}/messages/${m.id}?format=full`),
      "message",
    );
    const code = extractCode(bodyText(full.payload).slice(0, 6000));
    if (code) return toFound(m, code);
  }

  return null;
}
