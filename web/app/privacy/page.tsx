import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Nav, Footer } from '@/components/chrome';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Exactly what the CodeSafe Chrome extension reads, stores and transmits. Short, because there is little to say.',
};

const S = ({ t, children }: { t: string; children: ReactNode }) => (
  <section className="pt-10" style={{ borderTop: '.5px solid var(--hair)' }}>
    <h2 className="text-[22px] font-semibold tracking-[-0.025em] text-[#1B1C1D]">{t}</h2>
    <div className="mt-4 space-y-4 text-[17px] leading-[1.65] text-[#424245]">{children}</div>
  </section>
);

export default function Privacy() {
  return (
    <div className="min-h-[100dvh] bg-[#FBFDFF]">
      <Nav />
      <main className="mx-auto max-w-[680px] px-5 pb-28 pt-32 sm:pt-40">
        <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#0A84FF]">Privacy Policy</p>
        <h1 className="text-[42px] font-semibold leading-[1.05] tracking-[-0.04em] text-[#1B1C1D] sm:text-[56px]">Short, because there’s little to say.</h1>
        <p className="mt-6 text-[18px] leading-[1.55] text-[#6E6E73]">CodeSafe is a Chrome extension that runs entirely in your browser. It has no server. This page explains exactly what it touches.</p>
        <p className="mt-3 text-[14px] text-[#86868B]">Effective October 10, 2026 (updated for version 1.1)</p>

        <div className="mt-14 space-y-10">
          <S t="What CodeSafe accesses">
            <p>With your permission, CodeSafe uses read-only Gmail access to look at messages received in the last 10 minutes that match verification-code keywords (“code”, “verification”, “verify”, “OTP”, “passcode”, “one-time”, “sign in”, “log in”, “2FA”). It does this only when you focus a code field on a web page, open the popup, or press the keyboard shortcut. It does not read the rest of your inbox and cannot send, delete, or modify mail.</p>
          </S>
          <S t="What CodeSafe stores">
            <p>When a code is found, CodeSafe keeps three things: the code, the sender’s domain, and the timestamp. They are held in session memory only and are wiped after 5 minutes, as soon as the code is used, or when the browser closes. To avoid offering the same code twice, CodeSafe also remembers the Gmail message IDs of codes you have used, in session memory only. Nothing is written to disk.</p>
          </S>
          <S t="What CodeSafe transmits">
            <p>Nothing is sent to CodeSafe. There is no CodeSafe server, account, analytics, or telemetry. The only network requests are API calls made directly from your browser to Google to read the matching messages.</p>
          </S>
          <S t="Third parties">
            <p>None. CodeSafe does not sell, share, or transfer your data to anyone.</p>
          </S>
          <S t="How to revoke access">
            <p>Sign out in the CodeSafe popup, or remove CodeSafe’s access at <a className="text-[#0A84FF] hover:underline" href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" data-testid="link-google-permissions">myaccount.google.com/permissions</a>. Uninstalling the extension also clears everything it held.</p>
          </S>
          <S t="Google API Services">
            <p>CodeSafe's use and transfer to any other app of information received from Google APIs will adhere to the Google API Services User Data Policy, including the Limited Use requirements.</p>
          </S>
          <S t="Changes">
            <p>If this policy changes, the update will be posted on this page with a new effective date. Because the code is open source, every change is also visible in the repository.</p>
          </S>
        </div>
      </main>
      <Footer />
    </div>
  );
}
