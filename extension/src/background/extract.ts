/**
 * Pulls a one-time code out of an email subject/snippet/body.
 *
 * Snippets look like "Your Stripe verification code is 482193. It expires in
 * 10 minutes." but also "Order #48219 shipped" and "Call 415-555-0199", so we
 * score every candidate instead of grabbing the first number.
 */

const KEYWORDS =
  /\b(code|verification|verify|verifying|otp|one[- ]?time|passcode|pin|2fa|two[- ]factor|security|login|log[- ]in|sign[- ]?in|authenticat\w*|confirm\w*|token)\b/i;

// 4–8 digits, or two alphanumeric chunks joined by a dash/space (7F3K-9Q2L, 174 923).
const CANDIDATE =
  /(?<![\w$€£#.\-])([A-Z0-9]{3,4}[- ][A-Z0-9]{3,4}|[A-Z0-9]{6,8}|\d{4,8})(?![\w%]|\.\d)/g;

function normalise(text: string): string {
  return (
    text
      .replace(/\s+/g, " ")
      // Google-style "G-713402" prefix
      .replace(/\bG-(\d{6,8})\b/g, "$1")
      // zero-width and non-breaking spaces
      .replace(/[\u200b\u00a0]/g, " ")
  );
}

export function extractCode(text: string): string | null {
  const clean = normalise(text);
  if (!KEYWORDS.test(clean)) return null;

  let best: { code: string; score: number } | null = null;

  for (const m of clean.matchAll(CANDIDATE)) {
    const raw = m[1];
    const code = raw.replace(/[- ]/g, "");
    const idx = m.index ?? 0;
    let score = 0;

    // Length sweet spot.
    if (code.length === 6) score += 3;
    else if (code.length >= 4 && code.length <= 8) score += 1;
    else continue;

    // Must contain at least one digit unless it is clearly a formatted code.
    const hasDigit = /\d/.test(code);
    const hasLetter = /[A-Z]/.test(code);
    if (!hasDigit && !/[- ]/.test(raw)) continue;

    const before = clean.slice(Math.max(0, idx - 60), idx);
    const after = clean.slice(idx + raw.length, idx + raw.length + 30);

    if (KEYWORDS.test(before)) score += 4;
    if (KEYWORDS.test(after)) score += 2;
    if (/\b(is|:)\s*$/i.test(before)) score += 2; // "code is 482193"
    if (/^[:\s]*$/.test(before.slice(-2)) && /^\s*(is|will)\b/i.test(after)) score += 1; // "482193 is your code"

    // Negatives.
    if (/^(19|20)\d{2}$/.test(code)) score -= 4; // looks like a year
    if (/(\$|€|£|usd|total|order|invoice|#)\s*$/i.test(before)) score -= 3;
    if (/https?:\/\/\S*$/.test(before)) score -= 5; // inside a URL
    if (/^\s*(minutes?|mins?|hours?|seconds?|days?)\b/i.test(after)) score -= 4; // "10 minutes"
    if (/^\d+$/.test(code) && /^\d/.test(after)) score -= 2; // part of a longer number
    if (hasLetter && !hasDigit) score -= 3; // all letters: probably a word
    if (/^[A-Z]{2,}\d{0,2}$/.test(code) && !/[- ]/.test(raw)) score -= 3; // e.g. "GITHUB"

    if (!best || score > best.score) best = { code, score };
  }

  return best && best.score >= 4 ? best.code : null;
}
