import type { NextConfig } from 'next';

// Static export: `next build` writes plain HTML/CSS/JS to out/. There is no
// server, so the site can be hosted anywhere (Vercel, Netlify, Cloudflare
// Pages, GitHub Pages, S3). Security headers live in public/_headers and
// vercel.json because static hosts, not Next.js, serve the files.
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  poweredByHeader: false,
  reactStrictMode: true,
  images: { unoptimized: true },
};

export default nextConfig;
