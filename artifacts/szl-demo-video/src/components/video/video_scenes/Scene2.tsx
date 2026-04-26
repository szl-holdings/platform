import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { sceneTransitions } from '@/lib/video';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),  // Core
      setTimeout(() => setPhase(2), 1500), // Nodes
      setTimeout(() => setPhase(3), 3000), // VO
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const nodes = [
    { name: 'Lyte', color: 'var(--color-lyte)', angle: 0 },
    { name: 'Aegis', color: 'var(--color-aegis)', angle: 51 },
    { name: 'Vessels', color: 'var(--color-vessels)', angle: 102 },
    { name: 'Terra', color: 'var(--color-terra)', angle: 154 },
    { name: 'Counsel', color: 'var(--color-counsel)', angle: 205 },
    { name: 'Carlota Jo', color: 'var(--color-carlota)', angle: 257 },
    { name: 'Pulse', color: 'var(--color-pulse)', angle: 308 },
  ];

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-20 overflow-hidden"
      {...sceneTransitions.zoomThrough}
    >
      {/* Constellation Container */}
      <div className="relative w-[60vh] h-[60vh] flex items-center justify-center">
        {/* Core */}
        <motion.div
          className="absolute w-[15vh] h-[15vh] rounded-full border border-accent/30 bg-surface flex items-center justify-center z-10 shadow-[0_0_40px_rgba(201,183,135,0.2)]"
          initial={{ scale: 0, rotate: -90 }}
          animate={phase >= 1 ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -90 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="font-display text-[3vh] text-white">
            <span>a</span>
            <span className="text-accent">11</span>
            <span>oy</span>
          </div>
        </motion.div>

        {/* Orbiting Nodes */}
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
        >
          {nodes.map((node, i) => {
            const radius = 25; // vh
            const x = Math.cos((node.angle * Math.PI) / 180) * radius;
            const y = Math.sin((node.angle * Math.PI) / 180) * radius;

            return (
              <motion.div
                key={i}
                className="absolute w-[4vh] h-[4vh] -ml-[2vh] -mt-[2vh] rounded-full shadow-[0_0_20px_currentColor] flex items-center justify-center"
                style={{
                  left: `calc(50% + ${x}vh)`,
                  top: `calc(50% + ${y}vh)`,
                  backgroundColor: node.color,
                  color: node.color,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={phase >= 2 ? { scale: [0, 1.2, 1], opacity: 1 } : { scale: 0, opacity: 0 }}
                transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
              >
                {/* Counter-rotate label so it stays readable if we wanted, but here we just show dots with glow */}
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Overlay Text */}
      <motion.div
        className="absolute top-[15vh] font-mono text-[1.5vw] text-white tracking-widest uppercase"
        initial={{ opacity: 0, y: -20 }}
        animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
        transition={{ duration: 1 }}
      >
        One backbone. Multiple command surfaces.
      </motion.div>

      {/* Voiceover */}
      <motion.div
        className="absolute bottom-[10vh] w-[60vw] text-center font-display italic text-[2.5vw] text-white/90"
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        "A11oy is being built for what happens after that."
      </motion.div>
    </motion.div>
  );
}