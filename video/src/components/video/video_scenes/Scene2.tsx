import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';
import { BLUE, EASE, GREY, INK, display } from '../ui';

const WORDS = ['Open Gmail.', 'Find the email.', 'Copy.', 'Switch back.'];
const TAB = [1, 1, 0, 0]; // 1 = Gmail tab active

export function Scene2() {
  const [i, setI] = useState(0);
  useSceneTimer([700, 1350, 2000, 2650].map((t, k) => ({ time: t, callback: () => setI(k + 1) })));
  const w = Math.min(i, 3);
  const done = i >= 4;
  return (
    <motion.section className="absolute inset-0 overflow-hidden" style={{ background: '#F5F5F7' }}
      initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: EASE }}
      exit={{ clipPath: 'inset(0 0 100% 0)', transition: { duration: 0.55, ease: [0.7, 0, 0.3, 1] } }}>
      {/* tab strip */}
      <div className="absolute flex" style={{ top: '9vmin', left: '50%', transform: 'translateX(-50%)', gap: '1vmin' }}>
        {['Gmail', 'northwind.com'].map((t, k) => {
          const on = (TAB[w] === 1) === (k === 0);
          return (
            <motion.div key={t} animate={{ background: on ? '#FFFFFF' : 'rgba(255,255,255,0)', color: on ? INK : GREY, scale: on ? 1 : 0.96 }} transition={{ duration: 0.2 }}
              style={{ padding: '1.4vmin 3vmin', borderRadius: '1.4vmin', fontSize: '2.4vmin', fontWeight: 500, boxShadow: on ? '0 1vmin 3vmin -1vmin rgba(27,28,29,.18)' : 'none' }}>{t}</motion.div>
          );
        })}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence mode="popLayout">
          {!done && (
            <motion.h2 key={w} style={{ ...display, fontSize: '13vmin', position: 'absolute' }}
              initial={{ opacity: 0, scale: 1.25, filter: 'blur(8px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }} transition={{ duration: 0.32, ease: EASE }}>
              {WORDS[w]}
            </motion.h2>
          )}
          {done && (
            <motion.h2 key="every" style={{ ...display, fontSize: '13vmin', position: 'absolute', color: GREY }}
              initial={{ opacity: 0, y: '4vmin' }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
              Every time.
            </motion.h2>
          )}
        </AnimatePresence>
      </div>
      {/* step ticks */}
      <div className="absolute flex" style={{ bottom: '10vmin', left: '50%', transform: 'translateX(-50%)', gap: '1.2vmin' }}>
        {WORDS.map((_, k) => (
          <motion.span key={k} animate={{ background: k <= w ? (done ? GREY : BLUE) : 'rgba(27,28,29,.12)', width: k === w && !done ? '6vmin' : '2.4vmin' }} transition={{ duration: 0.3, ease: EASE }}
            style={{ height: '0.7vmin', borderRadius: '1vmin', display: 'block' }} />
        ))}
      </div>
    </motion.section>
  );
}
