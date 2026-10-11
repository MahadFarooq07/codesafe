import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';
import { Boxes, EASE, GREY, INK, CODE, display } from '../ui';

const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
function Key({ c, flex = '1 1 0', dark = false }: { c?: string; flex?: string; dark?: boolean }) {
  return <div style={{ flex, height: '4.4vmin', borderRadius: '0.6vmin', background: dark ? '#ABB0BA' : '#FDFDFE', boxShadow: '0 0.12vmin 0 rgba(0,0,0,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2vmin', color: INK }}>{c}</div>;
}

export function Scene3() {
  const [b, setB] = useState(0);
  const [filled, setFilled] = useState(0);
  useSceneTimer([
    { time: 1200, callback: () => setB(1) },
    { time: 2400, callback: () => setB(2) },
    ...[0, 1, 2, 3, 4, 5].map((k) => ({ time: 2600 + k * 70, callback: () => setFilled(k + 1) })),
    { time: 3800, callback: () => setB(3) },
  ]);
  return (
    <motion.section className="absolute inset-0 overflow-hidden" style={{ background: '#FBFDFF' }} exit={{ opacity: 0, transition: { duration: 0.4, delay: 0.2 } }}>
      {/* copy column, left */}
      <div className="absolute" style={{ left: '9vw', top: '50%', transform: 'translateY(-50%)', width: '44vw' }}>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} style={{ margin: 0, fontSize: '2.1vmin', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#0A84FF' }}>Familiar</motion.p>
        <div style={{ position: 'relative', height: '22vmin', marginTop: '2vmin' }}>
          <AnimatePresence mode="popLayout">
            {b < 3 ? (
              <motion.h2 key="a" style={{ ...display, fontSize: '9vmin', position: 'absolute' }} initial={{ opacity: 0, y: '5vmin' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '-4vmin', filter: 'blur(6px)' }} transition={{ duration: 0.7, ease: EASE }}>
                On iPhone,<br /><span style={{ color: GREY }}>it just appears.</span>
              </motion.h2>
            ) : (
              <motion.h2 key="b" style={{ ...display, fontSize: '9vmin', position: 'absolute' }} initial={{ opacity: 0, y: '5vmin' }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
                Now,<br />in Chrome.
              </motion.h2>
            )}
          </AnimatePresence>
        </div>
      </div>
      {/* phone, right */}
      <motion.div className="absolute" style={{ right: '12vw', top: '50%', y: '-50%' }}
        initial={{ scale: 0.9, opacity: 0, rotate: 3 }} animate={{ scale: b >= 3 ? 0.82 : 1, opacity: b >= 3 ? 0.0 : 1, rotate: 0, x: b >= 3 ? '6vw' : 0 }}
        transition={{ duration: b >= 3 ? 0.9 : 0.9, ease: EASE }}>
        <div style={{ width: '45vmin', height: '92vmin', borderRadius: '7vmin', background: INK, padding: '1.4vmin', boxShadow: '0 5vmin 10vmin -5vmin rgba(27,28,29,.4)' }}>
          <div style={{ position: 'relative', height: '100%', borderRadius: '5.8vmin', background: '#F2F2F7', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'absolute', left: '50%', top: '1.5vmin', width: '13vmin', height: '3.8vmin', transform: 'translateX(-50%)', borderRadius: '3vmin', background: INK }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2.1vmin 4vmin 0', fontSize: '1.8vmin', fontWeight: 600 }}><span>9:41</span><span>100%</span></div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '9vmin' }}>
              <p style={{ margin: 0, fontSize: '3vmin', fontWeight: 600, letterSpacing: '-0.02em' }}>Enter code</p>
              <p style={{ margin: '0.6vmin 0 3.4vmin', fontSize: '1.7vmin', color: GREY }}>Sent to your phone</p>
              <Boxes w={4.6} filled={filled} focus caret={b < 2} ok={filled >= 6} />
            </div>
            <div style={{ background: '#D1D3D9', padding: '0 0.5vmin 3.4vmin' }}>
              <div style={{ height: '6.4vmin', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <motion.div initial={false} animate={{ opacity: b >= 1 && filled < 6 ? 1 : 0, y: b >= 1 ? 0 : '1vmin', scale: b === 2 ? 0.95 : 1 }} transition={{ duration: 0.4, ease: EASE }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.15, padding: '0.6vmin 3vmin', borderRadius: '1vmin', background: b === 2 ? 'rgba(255,255,255,.6)' : 'transparent' }}>
                  <span style={{ fontSize: '1.5vmin', color: '#3C3C43' }}>From Messages</span>
                  <span className="tnum" style={{ fontSize: '2.3vmin', fontWeight: 600, letterSpacing: '0.04em' }}>{CODE}</span>
                </motion.div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4vmin' }}>
                <div style={{ display: 'flex', gap: '0.7vmin' }}>{ROWS[0].split('').map((k) => <Key key={k} c={k} />)}</div>
                <div style={{ display: 'flex', gap: '0.7vmin', padding: '0 2vmin' }}>{ROWS[1].split('').map((k) => <Key key={k} c={k} />)}</div>
                <div style={{ display: 'flex', gap: '0.7vmin' }}><Key flex="0 0 5.4vmin" dark /><div style={{ flex: 1, display: 'flex', gap: '0.7vmin', margin: '0 0.8vmin' }}>{ROWS[2].split('').map((k) => <Key key={k} c={k} />)}</div><Key flex="0 0 5.4vmin" dark /></div>
                <div style={{ display: 'flex', gap: '0.7vmin' }}><Key flex="0 0 11vmin" dark c="123" /><Key c="space" /><Key flex="0 0 11vmin" dark c="done" /></div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
}
