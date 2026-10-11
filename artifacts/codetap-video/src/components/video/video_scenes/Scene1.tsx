import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';
import { Boxes, EASE, GREY, Rise, display } from '../ui';

export function Scene1() {
  const [b, setB] = useState(0);
  useSceneTimer([
    { time: 1300, callback: () => setB(1) },
    { time: 2000, callback: () => setB(2) },
    { time: 2700, callback: () => setB(3) },
  ]);
  return (
    <motion.section className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 1 }} exit={{ scale: 1.6, opacity: 0, filter: 'blur(12px)', transition: { duration: 0.6, ease: [0.6, 0, 0.8, 0.4] } }}>
      <motion.div className="flex flex-col items-center" animate={{ y: b >= 3 ? '-3vmin' : '4vmin', scale: [1, 1, 1.06] }} transition={{ y: { duration: 0.9, ease: EASE }, scale: { duration: 4.8, times: [0, 0.6, 1] } }}>
        <h1 style={{ ...display, fontSize: '15vmin', textAlign: 'center' }}><Rise delay={0.15}>Enter code.</Rise></h1>
        <motion.p initial={{ opacity: 0, y: '1vmin' }} animate={{ opacity: b >= 3 ? 1 : 0, y: b >= 3 ? 0 : '1vmin' }} transition={{ duration: 0.6, ease: EASE }}
          style={{ margin: '1.2vmin 0 0', fontSize: '3.2vmin', color: GREY }}>Sent to your email.</motion.p>
        <motion.div style={{ marginTop: '6vmin' }} initial={{ opacity: 0, y: '3vmin', scale: 0.92 }} animate={{ opacity: b >= 1 ? 1 : 0, y: b >= 1 ? 0 : '3vmin', scale: b >= 1 ? 1 : 0.92 }} transition={{ duration: 0.7, ease: EASE }}>
          <Boxes w={8} focus={b >= 2} caret={b >= 2} />
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
