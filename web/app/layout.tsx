import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

const description =
  'CodeSafe shows Gmail verification codes right above the field you are typing in. One click fills it. Free, open source, and nothing leaves your browser.';

// Set SITE_URL at build time (e.g. https://codesafe.example) so social previews get absolute image URLs.
const siteUrl = process.env.SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'CodeSafe: Your sign-in codes, right where you need them.',
    template: '%s · CodeSafe',
  },
  description,
  robots: { index: true, follow: true },
  icons: { icon: '/favicon.svg' },
  referrer: 'strict-origin-when-cross-origin',
  openGraph: { title: 'CodeSafe', description, type: 'website', images: ['/codesafe-film-poster.jpg'] },
  twitter: { card: 'summary_large_image', title: 'CodeSafe', description, images: ['/codesafe-film-poster.jpg'] },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FBFDFF',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
