import { motion } from 'framer-motion';
import type { CSSProperties, ReactNode } from 'react';

export const EASE = [0.2, 0.8, 0.2, 1] as const;
export const INK = '#1B1C1D';
export const GREY = '#6E6E73';
export const BLUE = '#0A84FF';
export const CODE = '482193';

/** Faithful CodeSafe pill. `u` = vmin per CSS px of the real 46px pill. */
export function Pill({ u = 0.2, state = 'found', pressed = false, source = 'Gmail' }: { u?: number; state?: 'searching' | 'found'; pressed?: boolean; source?: string }) {
  const px = (n: number) => `${n * u}vmin`;
  return (
    <motion.div
      animate={{ scale: pressed ? 0.97 : 1 }}
      transition={{ duration: 0.18, ease: EASE }}
      style={{
        display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: px(2), minWidth: px(96), height: px(46), padding: `0 ${px(16)}`, background: '#fff',
        border: `${px(0.5)} solid rgba(0,0,0,.12)`, borderRadius: px(12),
        boxShadow: `0 ${px(1)} ${px(2)} rgba(0,0,0,.05), 0 ${px(6)} ${px(20)} rgba(0,0,0,.10)`, whiteSpace: 'nowrap',
      }}
    >
      {state === 'searching' ? (
        <span style={{ display: 'inline-flex', gap: px(4) }}>
          {[0, 1, 2].map((i) => (
            <i key={i} className="ct-dot" style={{ width: px(5), height: px(5), borderRadius: '50%', background: GREY, animationDelay: `${i * 0.15}s` }} />
          ))}
        </span>
      ) : (
        <>
          <span style={{ fontSize: px(11), lineHeight: 1, fontWeight: 500, color: GREY }}>From {source}</span>
          <span className="tnum" style={{ fontSize: px(17), lineHeight: 1.1, fontWeight: 600, letterSpacing: '0.06em', color: INK }}>{CODE}</span>
        </>
      )}
    </motion.div>
  );
}

/** Six code boxes; `filled` = number of digits shown, `focus` highlights the first empty. */
export function Boxes({ w, filled = 0, focus = false, caret = false, ok = false }: { w: number; filled?: number; focus?: boolean; caret?: boolean; ok?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: `${w * 0.18}vmin` }}>
      {CODE.split('').map((d, i) => {
        const active = focus && i === Math.min(filled, 5) && filled < 6;
        return (
          <div key={i} style={{
            width: `${w}vmin`, height: `${w * 1.28}vmin`, borderRadius: `${w * 0.26}vmin`, background: '#fff',
            boxShadow: ok ? `0 0 0 ${w * 0.04}vmin #34C759` : active ? `0 0 0 ${w * 0.045}vmin ${BLUE}, 0 0 0 ${w * 0.16}vmin rgba(10,132,255,.14)` : `0 0 0 ${w * 0.028}vmin rgba(27,28,29,.14)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', transition: 'box-shadow .25s',
          }}>
            <motion.span className="tnum" initial={false} animate={{ opacity: i < filled ? 1 : 0, y: i < filled ? 0 : `${w * 0.15}vmin`, scale: i < filled ? 1 : 0.8 }}
              transition={{ duration: 0.22, ease: EASE }} style={{ fontSize: `${w * 0.62}vmin`, fontWeight: 600, color: INK }}>{d}</motion.span>
            {active && caret && <span className="ct-caret" style={{ position: 'absolute', width: `${w * 0.05}vmin`, height: `${w * 0.5}vmin`, background: BLUE, borderRadius: 2 }} />}
          </div>
        );
      })}
    </div>
  );
}

export function Browser({ children, style, url = 'northwind.com/verify', tabs }: { children: ReactNode; style?: CSSProperties; url?: string; tabs?: ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: '1.6vmin', overflow: 'hidden', boxShadow: '0 0 0 0.06vmin rgba(27,28,29,.12), 0 4vmin 9vmin -3vmin rgba(27,28,29,.22)', display: 'flex', flexDirection: 'column', ...style }}>
      <div style={{ background: '#F6F7F8', borderBottom: '0.08vmin solid rgba(27,28,29,.08)', padding: '1.4vmin 1.8vmin', display: 'flex', alignItems: 'center', gap: '1.6vmin' }}>
        <div style={{ display: 'flex', gap: '0.8vmin' }}>
          {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <span key={c} style={{ width: '1.3vmin', height: '1.3vmin', borderRadius: '50%', background: c }} />)}
        </div>
        {tabs}
        <div style={{ flex: 1, height: '3.2vmin', borderRadius: '1.6vmin', background: '#EDEEF0', display: 'flex', alignItems: 'center', padding: '0 1.6vmin', fontSize: '1.5vmin', color: GREY }}>{url}</div>
        <div style={{ width: '3.2vmin', height: '3.2vmin', borderRadius: '0.8vmin', background: '#EDEEF0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Mark size={1.9} />
        </div>
      </div>
      <div style={{ flex: 1, position: 'relative' }}>{children}</div>
    </div>
  );
}

/** Small CodeSafe mark: rounded square with a code-dot row. */
export function Mark({ size = 4 }: { size?: number }) {
  return (
    <div style={{ width: `${size}vmin`, height: `${size}vmin`, borderRadius: `${size * 0.26}vmin`, background: INK, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: `${size * 0.07}vmin` }}>
      {[0, 1, 2].map((i) => <span key={i} style={{ width: `${size * 0.14}vmin`, height: `${size * 0.14}vmin`, borderRadius: '50%', background: i === 1 ? BLUE : '#fff' }} />)}
    </div>
  );
}

export function Cursor({ x, y, down = false, delay = 0, duration = 0.7 }: { x: string; y: string; down?: boolean; delay?: number; duration?: number }) {
  return (
    <motion.div initial={false} animate={{ left: x, top: y, scale: down ? 0.85 : 1 }} transition={{ left: { duration, delay, ease: EASE }, top: { duration, delay, ease: EASE }, scale: { duration: 0.12 } }}
      style={{ position: 'absolute', zIndex: 20, width: '3vmin', height: '3vmin', marginLeft: '-0.4vmin', marginTop: '-0.3vmin', pointerEvents: 'none' }}>
      <svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M5 3l14 8-6.2 1.6L9.6 19z" fill={INK} stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" /></svg>
    </motion.div>
  );
}

/** Masked line reveal. */
export function Rise({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: CSSProperties }) {
  return (
    <span style={{ display: 'block', overflow: 'hidden', paddingBottom: '0.12em', ...style }}>
      <motion.span style={{ display: 'block' }} initial={{ y: '110%' }} animate={{ y: '0%' }} transition={{ duration: 0.8, delay, ease: EASE }}>{children}</motion.span>
    </span>
  );
}

export const display: CSSProperties = { fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '-0.045em', color: INK, margin: 0, lineHeight: 1.02 };
