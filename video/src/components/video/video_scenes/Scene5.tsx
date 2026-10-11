import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';
import { CODE, EASE, GREY, INK, Mark, display } from '../ui';

export function Scene5() {
  const [b, setB] = useState(0);
  useSceneTimer([
    { time: 500, callback: () => setB(1) },
    { time: 1800, callback: () => setB(2) },
    { time: 2000, callback: () => setB(3) },
    { time: 3500, callback: () => setB(4) },
  ]);
  return (
    <motion.section className="absolute inset-0 overflow-hidden" style={{ background: '#F5F5F7' }}
      initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease: EASE }}
      exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.15 } }}>
      {/* toolbar macro across the top */}
      <div className="absolute" style={{ left: 0, right: 0, top: 0, height: '15vmin', background: '#FFFFFF', borderBottom: '0.1vmin solid rgba(27,28,29,.08)', display: 'flex', alignItems: 'center', padding: '0 6vw', gap: '2vmin' }}>
        <div style={{ flex: 1, height: '6.4vmin', borderRadius: '3.2vmin', background: '#EDEEF0', display: 'flex', alignItems: 'center', padding: '0 3vmin', fontSize: '2.6vmin', color: GREY }}>northwind.com/verify</div>
        <motion.div animate={{ scale: b === 1 ? 0.9 : 1, background: b >= 1 ? '#E3E4E8' : '#FFFFFF' }} transition={{ duration: 0.15 }}
          style={{ width: '7vmin', height: '7vmin', borderRadius: '1.8vmin', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '10vw' }}>
          <Mark size={4} />
        </motion.div>
      </div>
      {/* caption, lower-left */}
      <div className="absolute" style={{ left: '7vw', bottom: '14vh', width: '36vw' }}>
        <motion.h2 style={{ ...display, fontSize: '8vmin' }} initial={{ opacity: 0, y: '4vmin' }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3, ease: EASE }}>
          Or from<br />the toolbar.
        </motion.h2>
      </div>
      {/* popup card under the icon */}
      <motion.div className="absolute" style={{ right: 'calc(6vw + 10vw - 16vmin)', top: '17vmin', transformOrigin: '80% 0%' }}
        initial={{ opacity: 0, scale: 0.9, y: '-2vmin' }} animate={{ opacity: b >= 1 && b < 4 ? 1 : b >= 4 ? 0 : 0, scale: b >= 4 ? 0.5 : b === 2 ? 0.97 : 1, y: b >= 4 ? '10vmin' : 0, x: b >= 4 ? '-20vw' : 0 }}
        transition={{ duration: b >= 4 ? 0.7 : 0.45, ease: EASE }}>
        <div style={{ width: '38vmin', padding: '2.4vmin', background: '#FFFFFF', borderRadius: '2.6vmin', boxShadow: '0 0.2vmin 0.4vmin rgba(0,0,0,.04), 0 3vmin 8vmin rgba(27,28,29,.14)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.2vmin', marginBottom: '2vmin' }}>
            <Mark size={3} /><span style={{ fontSize: '2.2vmin', fontWeight: 600 }}>CodeSafe</span>
          </div>
          <div style={{ borderRadius: '1.8vmin', background: b >= 2 && b < 3 ? '#EDEEF0' : '#F5F5F7', padding: '3.4vmin 2vmin', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8vmin' }}>
            <span style={{ fontSize: '1.9vmin', fontWeight: 500, color: GREY }}>From Gmail</span>
            <span className="tnum" style={{ fontSize: '6.4vmin', fontWeight: 600, letterSpacing: '0.06em', color: INK, lineHeight: 1 }}>{CODE}</span>
            <motion.span key={b >= 3 ? 'c' : 'k'} initial={{ opacity: 0, y: '0.6vmin' }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
              style={{ fontSize: '1.9vmin', fontWeight: 500, color: b >= 3 ? '#248A3D' : '#0A84FF' }}>{b >= 3 ? 'Copied' : 'Click to copy'}</motion.span>
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
}
