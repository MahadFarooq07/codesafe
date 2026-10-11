import { sameSite, siteOf, hostOf } from "../src/shared/site";
import { CODE_RE } from "../src/shared/types";

// gmail.ts imports auth.ts, which touches `chrome` only inside functions, so
// importing it under Node is safe.
const { senderDomain, isVerifiedSender } = await import("../src/background/gmail");

let failed = 0;
function check(name: string, got: unknown, want: unknown): void {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name} -> ${JSON.stringify(got)}${ok ? "" : ` (want ${JSON.stringify(want)})`}`);
}

// Site matching (phishing check).
check("siteOf dashboard.stripe.com", siteOf("dashboard.stripe.com"), "stripe.com");
check("siteOf www.bbc.co.uk", siteOf("www.bbc.co.uk"), "bbc.co.uk");
check("siteOf IP", siteOf("127.0.0.1"), "127.0.0.1");
check("same site: stripe.com vs dashboard.stripe.com", sameSite("stripe.com", "dashboard.stripe.com"), true);
check("lookalike: stripe.com vs stripe.com.evil.io", sameSite("stripe.com", "stripe.com.evil.io"), false);
check("lookalike: stripe.com vs evil-stripe.com", sameSite("stripe.com", "evil-stripe.com"), false);
check("lookalike: co.uk suffix", sameSite("bank.co.uk", "evil.co.uk"), false);
check("empty page host", sameSite("stripe.com", ""), false);
check("hostOf https", hostOf("https://a.b.com/x?y"), "a.b.com");
check("hostOf file:", hostOf("file:///C:/x.html"), "");
check("hostOf javascript:", hostOf("javascript:alert(1)"), "");

// Sender parsing can't be fooled by the display name.
check("sender plain", senderDomain("Stripe <no-reply@mail.stripe.com>"), "stripe.com");
check("sender spoofed display name", senderDomain('"support@stripe.com" <attacker@evil.io>'), "evil.io");
check("sender bare", senderDomain("no-reply@accounts.google.com"), "google.com");
check("sender garbage", senderDomain("nobody"), "unknown");

// DMARC verification uses Gmail's own Authentication-Results header only.
const pass = "mx.google.com; dkim=pass header.i=@stripe.com header.s=s1; spf=pass smtp.mailfrom=bounce.stripe.com; dmarc=pass (p=REJECT sp=REJECT dis=NONE) header.from=stripe.com";
check("dmarc pass", isVerifiedSender(pass, "stripe.com"), true);
check("dmarc pass, other domain", isVerifiedSender(pass, "evil.io"), false);
check("dmarc fail", isVerifiedSender(pass.replace("dmarc=pass", "dmarc=fail"), "stripe.com"), false);
check("forged authserv-id", isVerifiedSender(pass.replace("mx.google.com", "mx.evil.io"), "stripe.com"), false);
check("no dmarc, aligned dkim", isVerifiedSender("mx.google.com; dkim=pass header.i=@stripe.com header.s=s1; spf=pass", "stripe.com"), true);
check("empty header", isVerifiedSender("", "stripe.com"), false);

// Only code-shaped strings can ever be filled.
check("code ok", CODE_RE.test("482193"), true);
check("code alnum", CODE_RE.test("7F3K9Q2L"), true);
check("code html", CODE_RE.test("<img src=x>"), false);
check("code too long", CODE_RE.test("123456789"), false);

if (failed) {
  console.error(`\n${failed} failing case(s)`);
  process.exit(1);
}
console.log("\nall security cases passed");
