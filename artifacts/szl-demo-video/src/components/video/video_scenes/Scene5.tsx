import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { sceneTransitions } from '@/lib/video';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 4000), // VO
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const cards = [
    'Proof Chain',
    'Constitutional Enforcement',
    'Agent Welfare',
    'Alignment Verification'
  ];

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-20 overflow-hidden"
      {...sceneTransitions.clipPolygon}
    >
      <motion.div
        className="absolute top-[15vh] font-mono text-[1.5vw] text-white tracking-widest uppercase"
        initial={{ opacity: 0, y: -20 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
        transition={{ duration: 1 }}
      >
        Governance is structural, not optional.
      </motion.div>

      <div className="flex gap-[2vw] mt-[10vh] px-[5vw]">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            className="w-[20vw] h-[35vh] bg-surface border border-border flex items-center justify-center p-[2vw] text-center relative overflow-hidden"
            initial={{ clipPath: 'inset(100% 0 0 0)' }}
            animate={phase >= 2 ? { clipPath: 'inset(0% 0 0 0)' } : { clipPath: 'inset(100% 0 0 0)' }}
            transition={{ duration: 1, delay: i * 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Glow behind */}
            <div className="absolute inset-0 bg-accent/5 blur-2xl" />
            <div className="font-display text-[2vw] text-white leading-tight z-10">
              {card}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Voiceover */}
      <motion.div
        className="absolute bottom-[10vh] w-[70vw] text-center font-display italic text-[2.5vw] text-white/90"
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        "And every domain pack inherits the same governed backbone."
      </motion.div>
    </motion.div>
  );
}