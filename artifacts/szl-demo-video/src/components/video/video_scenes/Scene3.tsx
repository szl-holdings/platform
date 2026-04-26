import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { sceneTransitions } from '@/lib/video';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 1900),
      setTimeout(() => setPhase(4), 2600),
      setTimeout(() => setPhase(5), 3300),
      setTimeout(() => setPhase(6), 4500), // VO
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const stages = [
    { label: 'Signal', phaseReq: 1 },
    { label: 'Decision', phaseReq: 2 },
    { label: 'Approval', phaseReq: 3 },
    { label: 'Execute', phaseReq: 4 },
    { label: 'Audit', phaseReq: 5 },
  ];

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-20 overflow-hidden"
      {...sceneTransitions.morphExpand}
    >
      <div className="relative w-[80vw] h-[40vh] flex items-center justify-between">
        {/* Connection Line */}
        <motion.div
          className="absolute left-[5vw] right-[5vw] h-[2px] bg-accent/20 z-0 origin-left"
          initial={{ scaleX: 0 }}
          animate={phase >= 1 ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 3, ease: 'linear' }}
        />

        {/* Data Particles */}
        {phase >= 1 && (
          <motion.div
            className="absolute left-[5vw] h-[4px] w-[4vw] bg-accent blur-[2px] z-10"
            animate={{ left: ['5vw', '75vw'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
          />
        )}

        {/* Nodes */}
        {stages.map((stage, i) => (
          <div key={i} className="relative z-20 flex flex-col items-center">
            <motion.div
              className={`w-[2vw] h-[2vw] rounded-full border-2 ${
                phase >= stage.phaseReq ? 'border-accent bg-accent/20 shadow-[0_0_20px_rgba(201,183,135,0.5)]' : 'border-border bg-surface'
              }`}
              initial={{ scale: 0 }}
              animate={phase >= stage.phaseReq ? { scale: [1.5, 1] } : { scale: 1 }}
              transition={{ duration: 0.5 }}
            />
            <motion.div
              className={`mt-[2vh] font-mono text-[1.2vw] ${
                phase >= stage.phaseReq ? 'text-white' : 'text-text-muted'
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={phase >= stage.phaseReq ? { opacity: 1, y: 0 } : { opacity: 0.5, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {stage.label}
            </motion.div>
          </div>
        ))}
      </div>

      {/* Voiceover */}
      <motion.div
        className="absolute bottom-[10vh] w-[70vw] text-center font-display italic text-[2.5vw] text-white/90"
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 6 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        "It connects signals to decisions, approvals, execution, and proof."
      </motion.div>
    </motion.div>
  );
}