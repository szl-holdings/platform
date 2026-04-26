import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { sceneTransitions } from '@/lib/video';

export function Scene8() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 3000), // Particle fade / final hold
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-20 overflow-hidden bg-black"
      {...sceneTransitions.clipPolygon}
    >
      <div className="flex flex-col items-center justify-center z-10">
        <motion.div
          className="font-display text-[6vw] text-white leading-none tracking-tight mb-[2vh]"
          initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
          animate={phase >= 1 ? { opacity: 1, scale: 1, filter: 'blur(0px)' } : { opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
          transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
        >
          SZL Holdings
        </motion.div>

        <motion.div
          className="flex items-center gap-[1vw] mb-[4vh]"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          <div className="w-[4vw] h-[1px] bg-accent/50" />
          <div className="font-display text-[3vw] text-white">
            <span>a</span>
            <span className="text-accent">11</span>
            <span>oy</span>
          </div>
          <div className="w-[4vw] h-[1px] bg-accent/50" />
        </motion.div>

        <motion.div
          className="font-mono text-[1.2vw] text-text-muted uppercase tracking-widest"
          initial={{ opacity: 0, y: 10 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
        >
          Governed Operational Intelligence
        </motion.div>
      </div>

      {/* Subtle gold particle field fades */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-0"
        initial={{ opacity: 1 }}
        animate={phase >= 3 ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 3, ease: 'linear' }}
      >
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-[2px] h-[2px] rounded-full bg-accent"
            style={{
              left: `${Math.random() * 100}vw`,
              top: `${Math.random() * 100}vh`,
            }}
            animate={{
              y: [0, -50],
              opacity: [0.2, 0.8, 0],
            }}
            transition={{
              duration: Math.random() * 2 + 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}