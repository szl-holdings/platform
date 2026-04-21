import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { sceneTransitions } from '@/lib/video';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500), // Phone appears
      setTimeout(() => setPhase(2), 2000), // First alert
      setTimeout(() => setPhase(3), 3500), // Second alert linking
      setTimeout(() => setPhase(4), 5000), // Third alert linking + policy
    ];
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  const easeOut = { duration: 0.6, ease: [0.16, 1, 0.3, 1] } as const;
  const easeOutFast = { duration: 0.45, ease: [0.16, 1, 0.3, 1] } as const;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-20"
      {...sceneTransitions.slideUp}
    >
      <div className="flex w-[70vw] items-center justify-between">
        {/* Left side text */}
        <div className="w-[30vw]">
          <motion.h2
            className="font-display text-[3vw] text-[var(--color-text-primary)] leading-tight mb-[2vh]"
            initial={{ opacity: 0, x: -30 }}
            animate={phase >= 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            APEX Mobile
            <br />
            <span className="text-[var(--color-text-muted)] text-[2vw]">Pocket-cockpit</span>
          </motion.h2>
          <motion.div
            className="font-mono text-[1vw] text-[var(--color-lyte-cyan)] mb-[1vh]"
            initial={{ opacity: 0 }}
            animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            CROSS-DOMAIN ALERTS ACTIVE
          </motion.div>
        </div>

        {/* Vertical Phone Frame */}
        <motion.div
          className="w-[20vw] h-[40vw] bg-[#0A0A0A] rounded-[2vw] border-4 border-[#333] relative overflow-hidden shadow-2xl"
          initial={{ opacity: 0, y: 40 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={easeOut}
        >
          <div className="absolute top-0 inset-x-0 h-[3vh] bg-[#111] flex justify-center items-center">
            <div className="w-[6vw] h-[1vh] bg-black rounded-full" />
          </div>

          <div className="mt-[5vh] px-[1.5vw] flex flex-col gap-[1.5vh]">
            {/* Alert 1 - Maritime */}
            <motion.div
              className="bg-[var(--color-surface)] p-[1.5vw] rounded-xl border border-[var(--color-vessels)]/40 relative"
              initial={{ opacity: 0, x: 16 }}
              animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: 16 }}
              transition={easeOutFast}
            >
              <div className="font-mono text-[0.6vw] text-[var(--color-vessels)] mb-[0.5vh]">
                MARITIME (VESSELS)
              </div>
              <div className="font-body text-[1vw] text-[var(--color-text-primary)] font-medium leading-snug">
                Sanctioned tanker PACIFIC MERIDIAN detected in Gulf.
              </div>
            </motion.div>

            {/* Connection line 1 */}
            <motion.div
              className="w-[2px] h-[2vh] bg-[var(--color-lyte-cyan)] ml-[2vw]"
              initial={{ scaleY: 0, opacity: 0 }}
              animate={phase >= 3 ? { scaleY: 1, opacity: 1 } : { scaleY: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: "top" }}
            />

            {/* Alert 2 - Real Estate */}
            <motion.div
              className="bg-[var(--color-surface)] p-[1.5vw] rounded-xl border border-[var(--color-terra)]/40"
              initial={{ opacity: 0, x: -16 }}
              animate={phase >= 3 ? { opacity: 1, x: 0 } : { opacity: 0, x: -16 }}
              transition={easeOutFast}
            >
              <div className="font-mono text-[0.6vw] text-[var(--color-terra)] mb-[0.5vh]">
                REAL ESTATE (TERRA)
              </div>
              <div className="font-body text-[1vw] text-[var(--color-text-primary)] font-medium leading-snug">
                Counterparty exposure to Meridian Tower lessee.
              </div>
            </motion.div>

            {/* Connection line 2 */}
            <motion.div
              className="w-[2px] h-[2vh] bg-[var(--color-lyte-cyan)] ml-[2vw]"
              initial={{ scaleY: 0, opacity: 0 }}
              animate={phase >= 4 ? { scaleY: 1, opacity: 1 } : { scaleY: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: "top" }}
            />

            {/* Alert 3 - Legal */}
            <motion.div
              className="bg-[var(--color-surface)] p-[1.5vw] rounded-xl border border-[var(--color-critical)]/40"
              initial={{ opacity: 0, y: 14 }}
              animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
              transition={easeOutFast}
            >
              <div className="font-mono text-[0.6vw] text-[var(--color-critical)] mb-[0.5vh]">
                LEGAL COMPLIANCE
              </div>
              <div className="font-body text-[1vw] text-[var(--color-text-primary)] font-medium leading-snug mb-[1.5vh]">
                Immediate legal obligation triggered.
              </div>
              <div className="bg-[var(--color-critical)] text-black font-mono text-[0.7vw] py-[0.5vh] text-center rounded">
                POLICY: HUMAN APPROVAL MANDATORY
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
