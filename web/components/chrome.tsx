import Link from 'next/link';

export const GITHUB_URL = 'https://github.com/MahadFarooq07/codesafe';

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

export function GitHubButton({ size = 'lg' }: { size?: 'lg' | 'sm' }) {
  const lg = size === 'lg';
  return (
    <a
      href={GITHUB_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 rounded-full bg-[#1B1C1D] font-medium text-white transition-[transform,opacity] duration-300 [transition-timing-function:cubic-bezier(.2,.8,.2,1)] hover:opacity-85 active:scale-[.97] ${lg ? 'h-12 px-6 text-[16px]' : 'h-8 px-4 text-[13px]'}`}
      data-testid={lg ? 'button-github' : 'button-github-nav'}
    >
      <svg aria-hidden="true" viewBox="0 0 16 16" fill="currentColor" className={lg ? 'h-[18px] w-[18px]' : 'h-[14px] w-[14px]'}><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
      View on GitHub
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
          <GitHubButton size="sm" />
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
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="hover:text-[#1B1C1D]" data-testid="link-github">GitHub</a>
        </div>
      </div>
    </footer>
  );
}
