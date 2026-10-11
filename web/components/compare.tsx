'use client';

import { useEffect, useRef, useState } from 'react';
import { Pill } from './pill';
import { Reveal } from './reveal';

const ease = 'cubic-bezier(.2,.8,.2,1)';
const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

function Boxes({ size }: { size: 'sm' | 'md' }) {
  const s = size === 'sm' ? 'h-[38px] w-[30px] rounded-[8px]' : 'h-[46px] w-[36px] rounded-[10px]';
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={`${s} bg-white`} style={{ boxShadow: i === 0 ? '0 0 0 1.5px #0A84FF' : '0 0 0 1px rgba(27,28,29,.12)' }} />
      ))}
    </div>
  );
}

function Key({ children, w, dark }: { children?: string; w?: string; dark?: boolean }) {
  return (
    <div
      className="flex h-[34px] items-center justify-center rounded-[5px] text-[15px] text-[#1B1C1D]"
      style={{ flex: w ?? '1 1 0', background: dark ? '#ABB0BA' : '#FDFDFE', boxShadow: '0 1px 0 rgba(0,0,0,.3)' }}
    >
      {children}
    </div>
  );
}

function Phone({ show }: { show: boolean }) {
  return (
    <div className="relative mx-auto w-[300px] rounded-[52px] bg-[#1B1C1D] p-[10px]" style={{ boxShadow: '0 30px 70px -30px rgba(27,28,29,.35)' }} data-testid="mock-iphone">
      <div className="relative flex h-[600px] flex-col overflow-hidden rounded-[42px] bg-[#F2F2F7]">
        <div className="absolute left-1/2 top-[11px] h-[28px] w-[96px] -translate-x-1/2 rounded-full bg-[#1B1C1D]" />
        <div className="flex justify-between px-7 pt-[15px] text-[13px] font-semibold"><span>9:41</span><span className="tracking-tight">100%</span></div>
        <div className="flex flex-1 flex-col items-center px-5 pt-14 text-center">
          <p className="text-[20px] font-semibold tracking-[-0.02em]">Enter code</p>
          <p className="mt-1 text-[12px] text-[#6E6E73]">Sent to your phone</p>
          <div className="mt-6"><Boxes size="sm" /></div>
        </div>
        <div className="bg-[#D1D3D9] px-[3px] pb-6">
          <div className="flex h-[44px] items-center justify-center">
            <div className="flex flex-col items-center leading-tight" style={{ opacity: show ? 1 : 0, transform: `translateY(${show ? 0 : 4}px)`, transition: `opacity .5s ${ease}, transform .5s ${ease}` }}>
              <span className="text-[11px] text-[#3C3C43]">From Messages</span>
              <span className="text-[16px] font-semibold tabular-nums tracking-[0.04em]">482193</span>
            </div>
          </div>
          <div className="space-y-[10px]">
            <div className="flex gap-[5px]">{ROWS[0].split('').map((k) => <Key key={k}>{k}</Key>)}</div>
            <div className="flex gap-[5px] px-[14px]">{ROWS[1].split('').map((k) => <Key key={k}>{k}</Key>)}</div>
            <div className="flex gap-[5px]">
              <Key w="0 0 38px" dark>⇧</Key>
              <div className="mx-[6px] flex flex-1 gap-[5px]">{ROWS[2].split('').map((k) => <Key key={k}>{k}</Key>)}</div>
              <Key w="0 0 38px" dark>⌫</Key>
            </div>
            <div className="flex gap-[5px]"><Key w="0 0 80px" dark>123</Key><Key>space</Key><Key w="0 0 80px" dark>done</Key></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Browser({ show }: { show: boolean }) {
  return (
    <div className="w-full max-w-[400px] overflow-hidden rounded-[16px] bg-white" style={{ boxShadow: '0 0 0 .5px rgba(27,28,29,.1), 0 30px 70px -30px rgba(27,28,29,.22)' }} data-testid="mock-chrome">
      <div className="flex items-center gap-[7px] px-4 py-3" style={{ background: '#F6F7F8', borderBottom: '.5px solid var(--hair)' }}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <span key={c} className="h-3 w-3 rounded-full" style={{ background: c }} />)}
      </div>
      <div className="flex flex-col items-center px-6 pb-14 pt-10">
        <p className="text-[20px] font-semibold tracking-[-0.02em]">Enter code</p>
        <p className="mt-1 text-[12px] text-[#6E6E73]">Sent to your email</p>
        <div className="relative mt-[78px]">
          <div className="absolute bottom-[calc(100%+12px)] left-1/2" style={{ opacity: show ? 1 : 0, transform: `translateX(-50%) translateY(${show ? 0 : 6}px)`, transition: `opacity .5s ${ease}, transform .5s ${ease}` }}>
            <Pill />
          </div>
          <Boxes size="md" />
        </div>
      </div>
    </div>
  );
}

export function Compare() {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setShow(true); return; }
    const el = ref.current;
    if (!el) return;
    let t = 0;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { t = window.setTimeout(() => setShow(true), 500); io.disconnect(); }
    }, { threshold: 0.35 });
    io.observe(el);
    return () => { io.disconnect(); clearTimeout(t); };
  }, []);

  return (
    <section className="mx-auto max-w-[1080px] px-5 py-24 sm:py-32" style={{ borderTop: '.5px solid var(--hair)' }}>
      <Reveal className="text-center">
        <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#0A84FF]">Familiar</p>
        <h2 className="text-[36px] font-semibold leading-[1.08] tracking-[-0.035em] sm:text-[52px]">You already know how this works.</h2>
        <p className="mx-auto mt-5 max-w-[520px] text-[18px] leading-[1.5] text-[#6E6E73]">iPhone fills codes from Messages. CodeSafe does the same for Gmail, in Chrome.</p>
      </Reveal>
      <div ref={ref} className="mt-16 grid items-center gap-16 md:grid-cols-2 md:gap-8">
        <Reveal className="flex flex-col items-center">
          <Phone show={show} />
          <p className="mt-6 text-[14px] font-medium text-[#6E6E73]">On iPhone</p>
        </Reveal>
        <Reveal delay={120} className="flex flex-col items-center">
          <Browser show={show} />
          <p className="mt-6 text-[14px] font-medium text-[#6E6E73]">Now in Chrome</p>
        </Reveal>
      </div>
    </section>
  );
}
