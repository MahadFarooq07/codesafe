import type { ReactNode } from 'react';
import { Demo } from '@/components/demo';
import { Compare } from '@/components/compare';
import { Film } from '@/components/film';
import { Reveal } from '@/components/reveal';
import { Nav, Footer, GitHubButton } from '@/components/chrome';
import { PrivacyCard, Faq, type PrivacyPoint, type FaqItem } from '@/components/disclosure';

const Eyebrow = ({ children }: { children: ReactNode }) => (
  <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#0A84FF]">{children}</p>
);
const H2 = ({ children }: { children: ReactNode }) => (
  <h2 className="max-w-[720px] text-[36px] font-semibold leading-[1.08] tracking-[-0.035em] text-[#1B1C1D] sm:text-[52px]">{children}</h2>
);
const Lead = ({ children }: { children: ReactNode }) => (
  <p className="mt-5 max-w-[560px] text-[18px] leading-[1.5] text-[#6E6E73]">{children}</p>
);

const steps = [
  { n: '01', t: 'Focus a code field.', d: 'Click into any verification input. CodeSafe recognizes single fields and split six-box inputs alike.' },
  { n: '02', t: 'The code appears.', d: 'It checks only the last 10 minutes of Gmail and floats the code just above the field.' },
  { n: '03', t: 'One click. Done.', d: 'Tap the pill and every box fills. Or press ⌘⇧Y without touching the mouse.' },
];

const privacy: PrivacyPoint[] = [
  { t: 'No server.', s: 'Nothing leaves your browser.', d: 'CodeSafe has no backend. The only network calls are from your browser directly to Google’s Gmail API. There is no CodeSafe account, no analytics, no telemetry.' },
  { t: 'Read-only.', s: 'It cannot send, delete, or change mail.', d: 'CodeSafe requests the gmail.readonly scope. It can read; it can never act. You can revoke access at any time from the popup or myaccount.google.com/permissions.' },
  { t: 'Ten minutes, on demand.', s: 'Not a background scanner.', d: 'CodeSafe only looks when you focus a code field, and only at messages received in the last 10 minutes that match code keywords. The rest of your inbox is never requested.' },
  { t: 'Gone in five.', s: 'Session memory only.', d: 'The code, its sender domain, and a timestamp live in session memory for 5 minutes, or until you use it, then they are wiped. Nothing is written to disk.' },
  { t: 'Phishing-aware.', s: 'Knows where the code came from.', d: 'The pill shows who sent the code. If that sender doesn’t match the site you’re on, or Gmail couldn’t verify it, the pill turns amber and needs a second click, so a look-alike site can’t quietly collect your code.' },
];

const faqs: FaqItem[] = [
  { q: 'Does it read all my email?', a: 'No. CodeSafe only queries Gmail when you focus a code field, and only for messages from the last 10 minutes that look like they contain a verification code. Access is read-only, so it can never send, delete, or modify anything.' },
  { q: 'What does it store?', a: 'Three things: the code, the sender’s domain, and when it arrived. They are kept in session memory for 5 minutes, or until the code is used, and then wiped. Nothing is saved to disk and nothing is sent to us. There is no “us” server.' },
  { q: 'Why does Google say “unverified app”?', a: 'Google requires a security review for any app requesting Gmail scopes, and CodeSafe’s review is in progress. Until it completes, Google shows this warning. The code is open source, so you can read exactly what it does before you approve.' },
  { q: 'Which sites does it work on?', a: 'Any site with a one-time code field, including split inputs with one box per digit. If a site uses an unusual field, ⌘⇧Y (Ctrl+Shift+Y on Windows and Linux) pastes the latest code into the text field your cursor is in.' },
  { q: 'How do I install it?', a: 'Open CodeSafe on GitHub and follow the README to build it, then open chrome://extensions, turn on Developer mode, and choose Load unpacked. A Chrome Web Store listing is on the way.' },
  { q: 'How do I turn it off?', a: 'Sign out from the CodeSafe popup, or revoke access at myaccount.google.com/permissions. Removing the extension also removes everything it held.' },
];

const Key = ({ children }: { children: ReactNode }) => (
  <kbd className="inline-flex h-14 min-w-14 items-center justify-center rounded-[14px] bg-white px-4 font-sans text-[22px] font-medium text-[#1B1C1D]" style={{ boxShadow: '0 0 0 .5px rgba(27,28,29,.14), 0 2px 0 rgba(27,28,29,.08)' }}>{children}</kbd>
);

export default function Home() {
  return (
    <div className="min-h-[100dvh] bg-[#FBFDFF] text-[#1B1C1D]">
      <Nav />
      <main>
        {/* Hero */}
        <section className="mx-auto max-w-[1080px] px-5 pb-24 pt-32 text-center sm:pt-40">
          <Reveal><Eyebrow>Free · Open source · Chrome</Eyebrow></Reveal>
          <Reveal delay={80}>
            <h1 className="mx-auto max-w-[820px] text-[46px] font-semibold leading-[1.02] tracking-[-0.045em] sm:text-[76px]">The code is already here.</h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mx-auto mt-6 max-w-[540px] text-[19px] leading-[1.5] text-[#6E6E73]">When a sign-in code lands in Gmail, CodeSafe shows it right above the field you’re typing in. One click fills it. Nothing leaves your browser.</p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-9 flex flex-col items-center gap-3">
              <div className="flex items-center gap-6">
                <GitHubButton />
                <a href="#how" className="text-[16px] text-[#0A84FF] hover:underline" data-testid="link-see-how">See how it works ›</a>
              </div>
              <p className="text-[12px] text-[#86868B]">Free and open source. Install steps are in the README.</p>
            </div>
          </Reveal>
          <Reveal delay={360} className="mt-16 sm:mt-20"><Demo /></Reveal>
        </section>

        <Compare />
        <Film />

        {/* Problem */}
        <section className="mx-auto max-w-[1080px] px-5 py-24 sm:py-32" style={{ borderTop: '.5px solid var(--hair)' }}>
          <Reveal><Eyebrow>The detour</Eyebrow><H2>Twenty times a day, you leave the page to find six digits.</H2></Reveal>
          <Reveal delay={100}>
            <div className="mt-14 grid gap-px overflow-hidden rounded-[21px] bg-[rgba(27,28,29,.08)] sm:grid-cols-[1.4fr_1fr]">
              <div className="bg-white p-8 sm:p-10">
                <p className="text-[13px] font-medium text-[#86868B]">Without CodeSafe</p>
                <ol className="mt-5 space-y-3 text-[17px] text-[#424245]">
                  {['Switch to the Gmail tab', 'Wait for it to refresh', 'Open the message', 'Select the code, copy it', 'Switch back, find the field', 'Paste, hope it splits right'].map((s, i) => (
                    <li key={s} className="flex gap-4"><span className="w-5 tabular-nums text-[#C7C7CC]">{i + 1}</span>{s}</li>
                  ))}
                </ol>
              </div>
              <div className="flex flex-col justify-between bg-white p-8 sm:p-10">
                <div>
                  <p className="text-[13px] font-medium text-[#0A84FF]">With CodeSafe</p>
                  <p className="mt-5 text-[28px] font-semibold leading-[1.15] tracking-[-0.03em]">Click the pill.</p>
                </div>
                <p className="mt-10 text-[15px] text-[#6E6E73]">One click, every time. You never leave the page.</p>
              </div>
            </div>
          </Reveal>
        </section>

        {/* How */}
        <section id="how" className="mx-auto max-w-[1080px] scroll-mt-16 px-5 py-24 sm:py-32">
          <Reveal><Eyebrow>How it works</Eyebrow><H2>If it’s in your inbox, it’s in the field.</H2></Reveal>
          <div className="mt-16 grid gap-12 sm:grid-cols-3 sm:gap-8">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 110}>
                <div className="pt-6" style={{ borderTop: '.5px solid rgba(27,28,29,.14)' }}>
                  <p className="text-[13px] tabular-nums text-[#86868B]">{s.n}</p>
                  <h3 className="mt-3 text-[22px] font-semibold tracking-[-0.025em]">{s.t}</h3>
                  <p className="mt-2 text-[16px] leading-[1.55] text-[#6E6E73]">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Shortcut */}
        <section className="px-5 py-8">
          <Reveal>
            <div className="mx-auto flex max-w-[1080px] flex-col items-center rounded-[28px] bg-[#F2F4F7] px-6 py-20 text-center sm:py-24">
              <Eyebrow>Keyboard</Eyebrow>
              <h2 className="text-[34px] font-semibold tracking-[-0.035em] sm:text-[44px]">Never reach for the mouse.</h2>
              <div className="mt-10 flex items-center gap-2.5"><Key>⌘</Key><Key>⇧</Key><Key>Y</Key></div>
              <p className="mt-8 max-w-[440px] text-[16px] leading-[1.55] text-[#6E6E73]">Pastes the latest code into the field you are typing in. Ctrl+Shift+Y on Windows and Linux. Change it any time at chrome://extensions/shortcuts.</p>
            </div>
          </Reveal>
        </section>

        {/* Privacy */}
        <section id="privacy" className="mx-auto max-w-[1080px] scroll-mt-16 px-5 py-24 sm:py-32">
          <Reveal><Eyebrow>Security & Privacy</Eyebrow><H2>Your inbox stays yours.</H2>
            <Lead>An extension that touches email should be small enough to explain in five sentences. Here they are.</Lead></Reveal>
          <div className="mt-14 grid items-start gap-4 sm:grid-cols-2">
            {privacy.map((p, i) => <Reveal key={p.t} delay={(i % 2) * 90}><PrivacyCard p={p} i={i} /></Reveal>)}
          </div>
          <Reveal delay={100}>
            <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-[21px] bg-[rgba(27,28,29,.08)] sm:grid-cols-4">
              {[['0', 'servers'], ['10 min', 'of mail, max'], ['5 min', 'in memory'], ['Read', 'only scope']].map(([a, b]) => (
                <div key={b} className="bg-white px-6 py-7"><p className="text-[30px] font-semibold tracking-[-0.03em]">{a}</p><p className="mt-1 text-[14px] text-[#6E6E73]">{b}</p></div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-[820px] scroll-mt-16 px-5 py-24 sm:py-32">
          <Reveal><Eyebrow>Questions</Eyebrow><H2>Asked, honestly answered.</H2></Reveal>
          <Reveal delay={100}><div className="mt-12" style={{ borderTop: '.5px solid var(--hair)' }}>{faqs.map((f, i) => <Faq key={f.q} f={f} i={i} />)}</div></Reveal>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-[1080px] px-5 pb-32 pt-12 text-center">
          <Reveal>
            <h2 className="mx-auto max-w-[700px] text-[40px] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[60px]">Stop alt-tabbing.</h2>
            <p className="mt-4 text-[18px] text-[#6E6E73]">Free forever. Open source. Under 60 KB.</p>
            <div className="mt-9 flex flex-col items-center gap-3">
              <GitHubButton />
              <p className="text-[12px] text-[#86868B]">Free and open source. Install steps are in the README.</p>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
    </div>
  );
}
