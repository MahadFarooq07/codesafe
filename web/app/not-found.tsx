import Link from 'next/link';
import { Nav, Footer } from '@/components/chrome';

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#FBFDFF]">
      <Nav />
      <main className="mx-auto flex max-w-[680px] flex-1 flex-col items-center justify-center px-5 py-40 text-center">
        <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#0A84FF]">404</p>
        <h1 className="text-[42px] font-semibold leading-[1.05] tracking-[-0.04em] text-[#1B1C1D] sm:text-[56px]">Nothing to paste here.</h1>
        <p className="mt-5 text-[18px] leading-[1.55] text-[#6E6E73]">This page doesn’t exist.</p>
        <Link href="/" className="mt-8 text-[16px] text-[#0A84FF] hover:underline">Back to CodeSafe ›</Link>
      </main>
      <Footer />
    </div>
  );
}
