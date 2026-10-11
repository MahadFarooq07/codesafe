'use client';

import { useState } from 'react';

export interface PrivacyPoint { t: string; s: string; d: string }
export interface FaqItem { q: string; a: string }

export function PrivacyCard({ p, i }: { p: PrivacyPoint; i: number }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen(!open)}
      className="group flex w-full flex-col rounded-[21px] bg-white p-7 text-left hair transition-transform duration-500 [transition-timing-function:cubic-bezier(.2,.8,.2,1)] hover:-translate-y-0.5 sm:p-8"
      aria-expanded={open}
      data-testid={`card-privacy-${i}`}
    >
      <div className="flex w-full items-start justify-between gap-4">
        <div>
          <h3 className="text-[22px] font-semibold tracking-[-0.025em] text-[#1B1C1D]">{p.t}</h3>
          <p className="mt-1 text-[15px] text-[#6E6E73]">{p.s}</p>
        </div>
        <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F2F4F7] text-[#1B1C1D] transition-transform duration-500 [transition-timing-function:cubic-bezier(.2,.8,.2,1)]" style={{ transform: open ? 'rotate(45deg)' : 'none' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
        </span>
      </div>
      <div className="grid transition-[grid-template-rows] duration-500 [transition-timing-function:cubic-bezier(.2,.8,.2,1)]" style={{ gridTemplateRows: open ? '1fr' : '0fr' }}>
        <div className="overflow-hidden">
          <p className="pt-5 text-[15px] leading-[1.6] text-[#424245]" style={{ opacity: open ? 1 : 0, transition: 'opacity .4s cubic-bezier(.2,.8,.2,1)' }}>{p.d}</p>
        </div>
      </div>
    </button>
  );
}

export function Faq({ f, i }: { f: FaqItem; i: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '.5px solid var(--hair)' }}>
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-6 py-6 text-left" aria-expanded={open} data-testid={`button-faq-${i}`}>
        <span className="text-[18px] font-medium tracking-[-0.015em] text-[#1B1C1D]">{f.q}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6E6E73" strokeWidth="2.4" strokeLinecap="round" className="shrink-0 transition-transform duration-500 [transition-timing-function:cubic-bezier(.2,.8,.2,1)]" style={{ transform: open ? 'rotate(180deg)' : 'none' }}><path d="M6 9l6 6 6-6" /></svg>
      </button>
      <div className="grid transition-[grid-template-rows] duration-500 [transition-timing-function:cubic-bezier(.2,.8,.2,1)]" style={{ gridTemplateRows: open ? '1fr' : '0fr' }}>
        <div className="overflow-hidden"><p className="max-w-[640px] pb-6 text-[16px] leading-[1.6] text-[#6E6E73]">{f.a}</p></div>
      </div>
    </div>
  );
}
