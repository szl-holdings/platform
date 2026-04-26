import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { sceneTransitions } from '@/lib/video';

export function Scene7() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2000), // Show layers
      setTimeout(() => setPhase(3), 5000), // VO
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const layers = [
    'Signal Mesh',
    'Causal Core',
    'Context Engine',
    'Workcell Engine',
    'Proof Chain',
    'Covenant Layer',
    'Replay'
  ];

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-20 overflow-hidden"
      {...sceneTransitions.slideUp}
    >
      <motion.div
        className="absolute top-[15vh] font-mono text-[1.5vw] text-white tracking-widest uppercase"
        initial={{ opacity: 0, y: -20 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
        transition={{ duration: 1 }}
      >
        The orchestration layer is taking shape.
      </motion.div>

      <div className="relative w-[60vw] h-[50vh] mt-[10vh] flex flex-col items-center justify-center">
        {layers.map((layer, i) => (
          <motion.div
            key={i}
            className="w-full py-[1.5vh] border border-accent/20 bg-surface/50 my-[0.5vh] flex items-center justify-center backdrop-blur-md relative"
            initial={{ opacity: 0, rotateX: 90, z: i * -50 }}
            animate={phase >= 2 ? { opacity: 1, rotateX: 0, z: 0 } : { opacity: 0, rotateX: 90, z: i * -50 }}
            transition={{ duration: 1, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="font-mono text-[1.2vw] text-accent/80 uppercase tracking-widest">
              {layer}
            </div>
            
            {/* Connecting line to previous layer */}
            {i > 0 && (
              <motion.div
                className="absolute -top-[1vh] w-[1px] h-[1vh] bg-accent/40"
                initial={{ scaleY: 0 }}
                animate={phase >= 2 ? { scaleY: 1 } : { scaleY: 0 }}
                transition={{ duration: 0.5, delay: 1 + i * 0.1 }}
              />
            )}
          </motion.div>
        ))}
      </div>

      <motion.div
        className="absolute bottom-[10vh] w-[80vw] text-center font-display italic text-[2.5vw] text-white/90"
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        "This is the direction of the SZL ecosystem: operational intelligence with consequence."
      </motion.div>
    </motion.div>
  );
}