import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';
import { Boxes, Browser, Cursor, EASE, GREY, Pill, display } from '../ui';

const CAPS = ['Focus the field.', 'CodeSafe checks Gmail.', 'One click. Filled.'];

export function Scene4() {
  const [b, setB] = useState(0);
  const [filled, setFilled] = useState(0);
  const at = (time: number, v: number) => ({ time, callback: () => setB(v) });
  useSceneTimer([
    at(900, 1), at(1200, 2), at(2400, 3), at(3000, 4), at(4100, 5), at(4300, 6),
    ...[0, 1, 2, 3, 4, 5].map((k) => ({ time: 4500 + k * 60, callback: () => setFilled(k + 1) })),
    at(5000, 7), at(5500, 8), at(6900, 9),
  ]);
  const cap = b < 2 ? 0 : b < 6 ? 1 : 2;
  const push = b >= 4 && b < 7;
  return (
    <motion.section className="absolute inset-0 overflow-hidden" style={{ background: '#FBFDFF' }}
      exit={{ opacity: 0, transition: { duration: 0.35 } }}>
      {/* captions, left zone */}
      <div className="absolute" style={{ left: '7vw', top: '50%', transform: 'translateY(-50%)', width: '30vw' }}>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ margin: 0, fontSize: '2.1vmin', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#0A84FF' }}>In Chrome</motion.p>
        <div style={{ position: 'relative', height: '24vmin', marginTop: '2vmin' }}>
          <AnimatePresence mode="popLayout">
            <motion.h2 key={cap} style={{ ...display, fontSize: '7.6vmin', position: 'absolute' }} initial={{ opacity: 0, y: '4vmin' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '-3vmin', filter: 'blur(6px)', transition: { duration: 0.25 } }} transition={{ duration: 0.55, ease: EASE }}>
              {CAPS[cap]}
            </motion.h2>
          </AnimatePresence>
        </div>
        <motion.p animate={{ opacity: b >= 4 && b < 8 ? 1 : 0, y: b >= 4 ? 0 : '1vmin' }} transition={{ duration: 0.4 }} style={{ margin: 0, fontSize: '3vmin', color: GREY }}>
          Read straight from your inbox.
        </motion.p>
      </div>
      {/* browser, right zone, with camera */}
      <motion.div className="absolute" style={{ right: '5vw', top: '11vh', width: '58vw', height: '78vh', transformOrigin: '50% 52%' }}
        initial={{ y: '14vh', opacity: 0, scale: 0.94 }}
        animate={{ y: 0, opacity: 1, scale: push ? 1.28 : b >= 9 ? 1.05 : 1, x: push ? '-2vw' : 0 }}
        transition={{ duration: push || b >= 7 ? 1.0 : 0.9, ease: EASE }}>
        <Browser style={{ width: '100%', height: '100%' }}>
          <div className="absolute inset-0 flex flex-col items-center" style={{ paddingTop: '9vmin' }}>
            <div style={{ fontSize: '2vmin', fontWeight: 600, letterSpacing: '-0.01em', marginBottom: '5vmin', color: GREY }}>Northwind</div>
            <p style={{ margin: 0, fontSize: '4vmin', fontWeight: 600, letterSpacing: '-0.03em' }}>Enter code</p>
            <p style={{ margin: '0.8vmin 0 0', fontSize: '1.9vmin', color: GREY }}>We sent a code to m.ortega@gmail.com</p>
            <div style={{ position: 'relative', marginTop: '13vmin' }}>
              <div style={{ position: 'absolute', bottom: 'calc(100% + 1.6vmin)', left: 0 }}>
                <AnimatePresence>
                  {b >= 2 && b < 7 && (
                    <motion.div initial={{ opacity: 0, y: '0.8vmin', scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }} transition={{ duration: 0.25, ease: EASE }}>
                      <Pill u={0.19} state={b >= 3 ? 'found' : 'searching'} pressed={b === 5} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <Boxes w={6} filled={filled} focus={b >= 1} caret={b >= 1 && filled === 0} ok={filled >= 6} />
              <motion.div initial={false} animate={{ opacity: b >= 8 ? 1 : 0, y: b >= 8 ? 0 : '1vmin' }} transition={{ duration: 0.4, ease: EASE }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1vmin', marginTop: '3.4vmin', fontSize: '2.2vmin', fontWeight: 500, color: '#248A3D' }}>
                <svg width="2.4vmin" height="2.4vmin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#34C759" /><path d="M7 12.5l3.2 3.2L17 9" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Verified
              </motion.div>
            </div>
          </div>
          <Cursor x={b >= 4 ? '38%' : b >= 1 ? '44%' : '78%'} y={b >= 4 ? '46%' : b >= 1 ? '60%' : '88%'} down={b === 1 || b === 5} duration={b >= 4 ? 0.9 : 0.75} />
        </Browser>
      </motion.div>
    </motion.section>
  );
}
