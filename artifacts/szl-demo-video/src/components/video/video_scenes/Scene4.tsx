import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { sceneTransitions } from '@/lib/video';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 3500), // VO
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const metrics = [
    { value: '59', label: 'SDK Primitives' },
    { value: '133', label: 'API Endpoints' },
    { value: '16', label: 'Platform Tabs' },
    { value: '7', label: 'Fabric Layers' },
    { value: '8', label: 'Frontier AI Providers' },
  ];

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-20 overflow-hidden"
      {...sceneTransitions.wipe}
    >
      {/* Overlay Title */}
      <motion.div
        className="absolute top-[15vh] font-mono text-[1.5vw] text-white tracking-widest uppercase"
        initial={{ opacity: 0, y: -20 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
        transition={{ duration: 1 }}
      >
        Built for proof, not just demos.
      </motion.div>

      {/* Metrics Grid */}
      <div className="flex flex-wrap justify-center gap-[4vw] px-[10vw] mt-[5vh]">
        {metrics.map((m, i) => (
          <motion.div
            key={i}
            className="flex flex-col items-center bg-surface border border-border p-[3vw] rounded-lg shadow-2xl min-w-[20vw]"
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={phase >= 2 ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.9, y: 40 }}
            transition={{ duration: 0.8, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="font-mono text-[5vw] text-accent font-light leading-none mb-[1vh]">
              {m.value}
            </div>
            <div className="font-mono text-[1vw] text-text-muted uppercase tracking-wider">
              {m.label}
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
        "Lyte is the command surface. A11oy is the execution fabric."
      </motion.div>
    </motion.div>
  );
}