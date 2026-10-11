'use client';

import { useEffect, useState } from 'react';
import { Pill } from './pill';

const CODE = '482193';
type Phase = 'idle' | 'checking' | 'found' | 'pressed' | 'filling' | 'done';

function usePrefersReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    setR(m.matches);
    const f = () => setR(m.matches);
    m.addEventListener('change', f);
    return () => m.removeEventListener('change', f);
  }, []);
  return r;
}

export function Demo() {
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<Phase>('idle');
  const [filled, setFilled] = useState(0);

  useEffect(() => {
    if (reduced) {
      setPhase('found');
      setFilled(0);
      return;
    }
    let timers: number[] = [];
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
    const run = () => {
      timers.forEach(clearTimeout);
      timers = [];
      setPhase('idle');
      setFilled(0);
      at(900, () => setPhase('checking'));
      at(2500, () => setPhase('found'));
      at(4100, () => setPhase('pressed'));
      at(4350, () => setPhase('filling'));
      for (let i = 1; i <= 6; i++) at(4350 + i * 85, () => setFilled(i));
      at(5150, () => setPhase('done'));
      at(8200, run);
    };
    run();
    return () => timers.forEach(clearTimeout);
  }, [reduced]);

  const pillVisible = phase === 'checking' || phase === 'found' || phase === 'pressed';
  const focused = phase !== 'done';
  const ease = 'cubic-bezier(.2,.8,.2,1)';

  return (
    <div
      className="relative mx-auto w-full max-w-[640px] overflow-hidden rounded-[16px] bg-white hair"
      style={{ boxShadow: '0 0 0 .5px rgba(27,28,29,.1), 0 30px 80px -30px rgba(27,28,29,.22), 0 8px 24px -12px rgba(27,28,29,.08)' }}
      data-testid="demo-window"
      aria-label="Animated demo: CodeSafe fills a six digit code from Gmail"
      role="img"
    >
      {/* Chrome */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '.5px solid var(--hair)', background: '#F6F7F8' }}>
        <div className="flex gap-[7px]">
          <span className="h-3 w-3 rounded-full" style={{ background: '#FF5F57' }} />
          <span className="h-3 w-3 rounded-full" style={{ background: '#FEBC2E' }} />
          <span className="h-3 w-3 rounded-full" style={{ background: '#28C840' }} />
        </div>
        <div className="mx-auto flex h-7 w-full max-w-[300px] items-center justify-center rounded-[8px] bg-white text-[12px] text-[#6E6E73] hair">
          <svg width="10" height="10" viewBox="0 0 24 24" className="mr-1.5" fill="none" stroke="currentColor" strokeWidth="2.4"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
          dashboard.stripe.com/verify
        </div>
        <div className="w-[50px]" />
      </div>

      {/* Body */}
      <div className="flex flex-col items-center px-6 pb-14 pt-12 sm:pt-14">
        <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-[10px] text-[15px] font-semibold text-white" style={{ background: '#1B1C1D' }}>S</div>
        <h3 className="text-[22px] font-semibold tracking-[-0.02em] text-[#1B1C1D]">Enter your code</h3>
        <p className="mt-1.5 text-[14px] text-[#6E6E73]">We sent a 6-digit code to m•••@gmail.com</p>

        <div className="relative mt-[72px]">
          {/* Pill */}
          <div
            className="absolute left-1/2 bottom-[calc(100%+14px)] z-10"
            style={{
              transform: `translateX(-50%) translateY(${pillVisible ? 0 : 6}px) scale(${pillVisible ? 1 : 0.97})`,
              opacity: pillVisible ? 1 : 0,
              transition: `opacity .45s ${ease}, transform .45s ${ease}`,
            }}
          >
            <Pill searching={phase === 'checking'} pressed={phase === 'pressed'} />
            {/* cursor */}
            <svg
              width="18" height="22" viewBox="0 0 18 22" className="absolute"
              style={{
                right: 8, top: 26,
                opacity: phase === 'found' || phase === 'pressed' ? 1 : 0,
                transform: `translate(${phase === 'found' || phase === 'pressed' ? 0 : 26}px, ${phase === 'found' || phase === 'pressed' ? 0 : 20}px) scale(${phase === 'pressed' ? 0.88 : 1})`,
                transition: `opacity .4s ${ease}, transform .7s ${ease}`,
              }}
            >
              <path d="M2 1.5v16l4.2-3.9 2.7 6.2 2.6-1.1-2.7-6.1h5.7z" fill="#1B1C1D" stroke="#fff" strokeWidth="1.3" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Boxes */}
          <div className="flex gap-2 sm:gap-2.5">
            {CODE.split('').map((d, i) => {
              const has = i < filled;
              const isActive = focused && (phase === 'filling' ? i === filled : i === 0) && !has;
              return (
                <div
                  key={i}
                  className="flex h-[54px] w-[42px] items-center justify-center rounded-[12px] bg-white text-[24px] font-semibold tabular-nums text-[#1B1C1D] sm:h-[60px] sm:w-[48px]"
                  style={{
                    boxShadow: phase === 'done'
                      ? '0 0 0 1px rgba(52,199,89,.55)'
                      : isActive ? '0 0 0 1.5px #0A84FF, 0 0 0 5px rgba(10,132,255,.14)' : '0 0 0 1px rgba(27,28,29,.12)',
                    transition: `box-shadow .3s ${ease}`,
                  }}
                  data-testid={`demo-box-${i}`}
                >
                  <span style={{ opacity: has ? 1 : 0, transform: `translateY(${has ? 0 : 6}px)`, transition: `opacity .25s ${ease}, transform .25s ${ease}` }}>{d}</span>
                </div>
              );
            })}
          </div>

          <div
            className="absolute left-0 right-0 top-[calc(100%+20px)] flex items-center justify-center gap-2 text-[14px] font-medium"
            style={{ color: '#248A3D', opacity: phase === 'done' ? 1 : 0, transform: `translateY(${phase === 'done' ? 0 : 6}px)`, transition: `opacity .45s ${ease}, transform .45s ${ease}` }}
            data-testid="demo-success"
          >
            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full" style={{ background: '#34C759' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            </span>
            Signed in
          </div>
        </div>
      </div>
    </div>
  );
}
