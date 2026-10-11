import { extractCode } from "../src/background/extract";

const cases: [string, string | null][] = [
  ["Your Stripe verification code is 482193. It expires in 10 minutes.", "482193"],
  ["G-713402 is your Google verification code.", "713402"],
  ["Your Apple ID code is: 174 923", "174923"],
  ["Your security code: 7F3K-9Q2L", "7F3K9Q2L"],
  ["Use 029384 to sign in to GitHub", "029384"],
  ["[GitHub] Please verify your device. Verification code: 591204", "591204"],
  ["Your one-time passcode is 4421", "4421"],
  ["Enter this code to confirm your email: 88107731", "88107731"],
  ["Your login code is 203 918. Do not share it.", "203918"],
  ["Your order #48219 shipped on 2026-10-10", null],
  ["Enter 2048 to continue", null],
  ["Your invoice total is $1234 for 2025", null],
  ["Thanks for signing up! See https://example.com/u/123456 to continue", null],
  ["Your flight departs at 0745 tomorrow", null],
];

let failed = 0;
for (const [input, want] of cases) {
  const got = extractCode(input);
  const ok = got === want;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${JSON.stringify(input)} -> ${JSON.stringify(got)}${ok ? "" : ` (want ${JSON.stringify(want)})`}`);
}
if (failed) {
  console.error(`\n${failed} failing case(s)`);
  process.exit(1);
}
console.log(`\nall ${cases.length} cases passed`);
