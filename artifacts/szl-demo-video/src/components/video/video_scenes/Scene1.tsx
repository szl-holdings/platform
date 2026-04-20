import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { sceneTransitions } from '@/lib/video';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 1000), // First text part
      setTimeout(() => setPhase(2), 2500), // Second text part
      setTimeout(() => setPhase(3), 4500), // Trace ID appears
      setTimeout(() => setPhase(4), 5500), // Provenance chips snap in
      setTimeout(() => setPhase(5), 9000), // Start exit choreography
    ];
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  const traceId = 'trc_01HK8N4Z2X9Q3R'.split('');

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-20"
      {...sceneTransitions.clipPolygon}
    >
      <div className="text-center px-[5vw] relative z-10 w-full">
        <h1 className="font-display text-[6vw] font-light tracking-tight text-[var(--color-text-primary)] leading-[1.1]">
          <motion.span
            className="inline-block"
            initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
            animate={
              phase >= 1
                ? { opacity: 1, y: 0, filter: 'blur(0px)' }
                : { opacity: 0, y: 40, filter: 'blur(10px)' }
            }
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            The era of AI without receipts
          </motion.span>
          <br />
          <motion.span
            className="inline-block italic text-[var(--color-hero-accent)]"
            initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
            animate={
              phase >= 2
                ? { opacity: 1, y: 0, filter: 'blur(0px)' }
                : { opacity: 0, y: 40, filter: 'blur(10px)' }
            }
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            is ending.
          </motion.span>
        </h1>

        <div className="mt-[8vh] h-[10vh] flex flex-col items-center justify-center gap-[2vh]">
          <motion.div className="font-mono text-[1.5vw] text-[var(--color-lyte-cyan)] tracking-widest flex">
            {traceId.map((char, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: phase >= 3 ? i * 0.025 : 0 }}
              >
                {char}
              </motion.span>
            ))}
          </motion.div>

          <div className="flex gap-[1vw]">
            {['SRC: AIS · S&P GLOBAL', 'FRESHNESS: 4m', 'CITATION: OFAC SDN 2026-04-12'].map((text, i) => (
              <motion.div
                key={i}
                className="font-mono text-[0.7vw] uppercase bg-[var(--color-surface)] border border-[var(--color-border)] px-[1vw] py-[0.5vh] rounded-full text-[var(--color-text-muted)]"
                initial={{ opacity: 0, y: 6 }}
                animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: phase >= 4 ? i * 0.12 : 0 }}
              >
                {text}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Background layer moving out */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--color-surface)] opacity-30"
        initial={{ opacity: 0 }}
        animate={phase >= 5 ? { opacity: 0, filter: 'blur(20px)' } : { opacity: 0.3 }}
        transition={{ duration: 2 }}
      />
    </motion.div>
  );
}
