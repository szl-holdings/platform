import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { sceneTransitions } from '@/lib/video';

export function Scene6() {
  const [activePack, setActivePack] = useState(-1);

  useEffect(() => {
    // Rapid sequence: 7 packs over 6 seconds
    const interval = 800; // ms per pack
    const timers = Array.from({ length: 7 }).map((_, i) =>
      setTimeout(() => setActivePack(i), 500 + i * interval)
    );
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const packs = [
    { name: 'Aegis', sub: 'Defense & Intelligence', color: 'var(--color-aegis)' },
    { name: 'Vessels', sub: 'Maritime Intelligence', color: 'var(--color-vessels)' },
    { name: 'Terra', sub: 'Real Estate', color: 'var(--color-terra)' },
    { name: 'Counsel', sub: 'Legal Command', color: 'var(--color-counsel)' },
    { name: 'Carlota Jo', sub: 'Private Advisory', color: 'var(--color-carlota)' },
    { name: 'Pulse', sub: 'Market Intelligence', color: 'var(--color-pulse)' },
    { name: 'Lyte', sub: 'Decision Intelligence', color: 'var(--color-lyte)' },
  ];

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-20 overflow-hidden"
      {...sceneTransitions.morphExpand}
    >
      <motion.div
        className="absolute top-[15vh] font-mono text-[1.2vw] text-text-muted tracking-widest uppercase"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        Security | Maritime | Real Estate | Legal | Advisory | Markets | Decisions
      </motion.div>

      {/* Flashing packs */}
      <div className="relative w-full h-[40vh] flex items-center justify-center">
        {packs.map((pack, i) => (
          <motion.div
            key={i}
            className="absolute flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.8, filter: 'blur(20px)' }}
            animate={
              activePack === i
                ? { opacity: 1, scale: 1, filter: 'blur(0px)' }
                : activePack > i
                ? { opacity: 0, scale: 1.5, filter: 'blur(20px)' }
                : { opacity: 0, scale: 0.8, filter: 'blur(20px)' }
            }
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="font-display text-[10vw] font-bold leading-none mb-[2vh]" style={{ color: pack.color }}>
              {pack.name}
            </div>
            <div className="font-mono text-[2vw] text-white tracking-widest uppercase">
              {pack.sub}
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Background flare */}
      {activePack >= 0 && activePack < packs.length && (
        <motion.div
          key={`flare-${activePack}`}
          className="absolute inset-0 z-[-1] opacity-20"
          style={{ background: `radial-gradient(circle at center, ${packs[activePack].color}, transparent 60%)` }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.15, scale: 1.5 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        />
      )}
    </motion.div>
  );
}