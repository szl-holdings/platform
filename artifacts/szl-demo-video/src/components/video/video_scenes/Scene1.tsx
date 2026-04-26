import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { sceneTransitions } from '@/lib/video';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500), // Zoom out starts
      setTimeout(() => setPhase(2), 2000), // Subtitle appears
      setTimeout(() => setPhase(3), 3000), // VO subtitle appears
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-20 overflow-hidden"
      {...sceneTransitions.clipPolygon}
    >
      {/* Background layer */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-black to-zinc-900/50"
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 6, ease: 'easeOut' }}
      />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full w-full">
        {/* Wordmark */}
        <motion.div
          className="font-display text-[15vw] text-white tracking-tighter leading-none flex"
          initial={{ scale: 3, opacity: 0, y: 100 }}
          animate={phase >= 1 ? { scale: 1, opacity: 1, y: -20 } : { scale: 3, opacity: 0, y: 100 }}
          transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <span>a</span>
          <span className="text-accent">11</span>
          <span>oy</span>
        </motion.div>

        {/* Subtitle */}
        <motion.div
          className="font-mono text-[1.5vw] text-text-muted mt-[2vh] tracking-widest uppercase overflow-hidden"
          initial={{ clipPath: 'inset(0 50% 0 50%)' }}
          animate={phase >= 2 ? { clipPath: 'inset(0 0% 0 0%)' } : { clipPath: 'inset(0 50% 0 50%)' }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        >
          Governed orchestration for consequence-bearing AI
        </motion.div>
      </div>

      {/* Voiceover Subtitle */}
      <motion.div
        className="absolute bottom-[10vh] w-[60vw] text-center font-display italic text-[2.5vw] text-white/90"
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        "Most AI systems stop at recommendation."
      </motion.div>
    </motion.div>
  );
}