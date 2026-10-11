/**
 * Approximate "registrable domain" (eTLD+1) without shipping the full Public
 * Suffix List. Good enough to tell stripe.com from stripe.com.evil.io, which
 * is all the phishing check needs. Unknown multi-part suffixes fall back to
 * the last two labels, which errs on the side of "not the same site".
 */
const MULTI_PART_SUFFIXES = new Set([
  "co.uk", "org.uk", "ac.uk", "gov.uk", "me.uk", "ltd.uk", "plc.uk",
  "com.au", "net.au", "org.au", "edu.au", "gov.au",
  "co.nz", "org.nz", "net.nz",
  "co.jp", "ne.jp", "or.jp", "ac.jp",
  "co.kr", "or.kr",
  "com.br", "net.br", "org.br",
  "com.cn", "net.cn", "org.cn",
  "com.mx", "com.ar", "com.co", "com.tr", "com.sg", "com.my", "com.hk", "com.tw",
  "co.in", "net.in", "org.in", "firm.in", "gen.in", "ind.in",
  "co.za", "org.za",
  "com.pk", "net.pk", "org.pk",
  "co.id", "or.id", "web.id",
  "com.ph", "com.vn", "com.sa", "com.eg", "com.ng", "co.il", "co.th",
]);

export function siteOf(hostname: string): string {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (!host || /^[\d.]+$/.test(host) || host.includes(":")) return host; // IPs
  const labels = host.split(".");
  if (labels.length <= 2) return host;
  const lastTwo = labels.slice(-2).join(".");
  if (MULTI_PART_SUFFIXES.has(lastTwo)) return labels.slice(-3).join(".");
  return lastTwo;
}

/** Hostname from a URL string, or "" if it isn't an http(s) URL. */
export function hostOf(url: string | undefined): string {
  if (!url) return "";
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.hostname : "";
  } catch {
    return "";
  }
}

export function sameSite(senderDomain: string, pageHost: string): boolean {
  if (!senderDomain || !pageHost) return false;
  return siteOf(senderDomain) === siteOf(pageHost);
}
