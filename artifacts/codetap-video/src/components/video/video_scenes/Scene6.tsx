import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';
import { EASE, GREY, Mark, Pill, Rise, display } from '../ui';

export function Scene6() {
  const [b, setB] = useState(0);
  useSceneTimer([
    { time: 900, callback: () => setB(1) },
    { time: 1900, callback: () => setB(2) },
    { time: 2700, callback: () => setB(3) },
    { time: 4000, callback: () => setB(4) },
  ]);
  return (
    <motion.section className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: '#FBFDFF' }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}>
      <motion.div className="absolute" style={{ top: '50%', left: '50%' }}
        initial={{ x: '-50%', y: '-50%', scale: 0.6, opacity: 0 }}
        animate={{ x: '-50%', y: b >= 1 ? '-180%' : '-50%', scale: b >= 1 ? 0.55 : 1, opacity: b >= 4 ? 0 : 1 }}
        transition={{ duration: 0.8, ease: EASE }}>
        <Pill u={0.6} />
      </motion.div>
      <motion.div animate={{ opacity: b >= 4 ? 0 : 1, scale: b >= 4 ? 0.98 : 1 }} transition={{ duration: 0.6 }} className="flex flex-col items-center" style={{ marginTop: '10vmin' }}>
        {b >= 1 && (
          <div className="flex items-center" style={{ gap: '3vmin' }}>
            <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}><Mark size={12} /></motion.div>
            <h1 style={{ ...display, fontSize: '17vmin', letterSpacing: '-0.055em' }}><Rise delay={0.05}>CodeSafe</Rise></h1>
          </div>
        )}
        <motion.p initial={false} animate={{ opacity: b >= 2 ? 1 : 0, y: b >= 2 ? 0 : '1.5vmin' }} transition={{ duration: 0.6, ease: EASE }}
          style={{ margin: '2vmin 0 0', fontSize: '4vmin', fontWeight: 500, letterSpacing: '-0.02em', color: GREY }}>Your Gmail codes. One click away.</motion.p>
        <motion.p initial={false} animate={{ opacity: b >= 3 ? 1 : 0 }} transition={{ duration: 0.5 }}
          style={{ margin: '4vmin 0 0', fontSize: '2.1vmin', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#0A84FF' }}>For Chrome</motion.p>
      </motion.div>
    </motion.section>
  );
}
