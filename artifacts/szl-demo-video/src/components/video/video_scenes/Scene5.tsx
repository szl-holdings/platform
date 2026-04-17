import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { sceneTransitions } from '@/lib/video';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 1000), // Parent lockup
      setTimeout(() => setPhase(2), 3000), // Tagline
      setTimeout(() => setPhase(3), 5000), // Stats
      setTimeout(() => setPhase(4), 6500), // Stephen
      setTimeout(() => setPhase(5), 10000), // Exit drift
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-20"
      {...sceneTransitions.zoomThrough}
    >
      <div className="text-center px-[5vw]">
        
        <motion.div
          className="mb-[4vh]"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="font-display text-[5vw] text-[var(--color-text-primary)] tracking-tight leading-none mb-[1vh]">
            SZL Holdings
          </h1>
          <div className="font-mono text-[1.2vw] text-[var(--color-hero-accent)] tracking-widest uppercase">
            Governed Decision Operating System
          </div>
        </motion.div>

        <motion.div
          className="mb-[6vh]"
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={phase >= 2 ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(10px)' }}
          transition={{ duration: 1 }}
        >
          <div className="font-display italic text-[2.5vw] text-[var(--color-text-muted)]">
            "The era of AI-without-receipts is ending."
          </div>
        </motion.div>

        <motion.div
          className="flex justify-center gap-[2vw] mb-[6vh]"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8 }}
        >
          {['9 surfaces', '6 domain packs', '1 Decision Fabric'].map((stat, i) => (
            <div key={i} className="font-mono text-[0.9vw] bg-[var(--color-surface)] border border-[var(--color-border)] px-[1.5vw] py-[0.8vh] rounded-full text-[var(--color-text-primary)]">
              {stat}
            </div>
          ))}
        </motion.div>

        <motion.div
          className="font-body text-[1.2vw] text-[var(--color-text-primary)]"
          initial={{ opacity: 0 }}
          animate={phase >= 4 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1 }}
        >
          <span className="font-semibold">Stephen Lutar</span> <span className="text-[var(--color-text-muted)]">— Founder & CEO, SZL Holdings</span>
        </motion.div>

      </div>
    </motion.div>
  );
}
