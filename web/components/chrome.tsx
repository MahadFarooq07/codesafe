import Link from 'next/link';

export const ZIP = '/codesafe-extension.zip';

export function Mark({ size = 22 }: { size?: number }) {
  return (
    <span className="inline-flex items-center justify-center rounded-[7px]" style={{ width: size, height: size, background: '#0A84FF' }}>
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round">
        <rect x="3" y="8" width="18" height="8" rx="4" />
        <circle cx="8" cy="12" r=".6" fill="#fff" /><circle cx="12" cy="12" r=".6" fill="#fff" /><circle cx="16" cy="12" r=".6" fill="#fff" />
      </svg>
    </span>
  );
}

export function AddButton({ size = 'lg' }: { size?: 'lg' | 'sm' }) {
  const lg = size === 'lg';
  return (
    <a
      href={ZIP}
      download
      className={`inline-flex items-center gap-2 rounded-full bg-[#1B1C1D] font-medium text-white transition-[transform,opacity] duration-300 [transition-timing-function:cubic-bezier(.2,.8,.2,1)] hover:opacity-85 active:scale-[.97] ${lg ? 'h-12 px-6 text-[16px]' : 'h-8 px-4 text-[13px]'}`}
      data-testid={lg ? 'button-add-to-chrome' : 'button-add-to-chrome-nav'}
    >
      Add to Chrome
    </a>
  );
}

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50" style={{ background: 'rgba(251,253,255,.78)', backdropFilter: 'saturate(180%) blur(20px)', WebkitBackdropFilter: 'saturate(180%) blur(20px)', borderBottom: '.5px solid var(--hair)' }}>
      <div className="mx-auto flex h-14 max-w-[1080px] items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.02em]" data-testid="link-home">
          <Mark /> CodeSafe
        </Link>
        <nav className="flex items-center gap-6 text-[13px] text-[#6E6E73]">
          <a href="/#how" className="hidden transition-colors hover:text-[#1B1C1D] sm:inline" data-testid="link-how">How it works</a>
          <a href="/#privacy" className="hidden transition-colors hover:text-[#1B1C1D] sm:inline" data-testid="link-privacy-section">Privacy</a>
          <a href="/#faq" className="hidden transition-colors hover:text-[#1B1C1D] sm:inline" data-testid="link-faq">FAQ</a>
          <AddButton size="sm" />
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer style={{ borderTop: '.5px solid var(--hair)' }}>
      <div className="mx-auto flex max-w-[1080px] flex-col gap-4 px-5 py-10 text-[13px] text-[#6E6E73] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2"><Mark size={18} /> <span>CodeSafe. Free and open source.</span></div>
        <div className="flex gap-6">
          <Link href="/privacy" className="hover:text-[#1B1C1D]" data-testid="link-privacy">Privacy</Link>
          <a href="https://github.com/MahadFarooq07/codesafe" target="_blank" rel="noopener noreferrer" className="hover:text-[#1B1C1D]" data-testid="link-github">GitHub</a>
        </div>
      </div>
    </footer>
  );
}
