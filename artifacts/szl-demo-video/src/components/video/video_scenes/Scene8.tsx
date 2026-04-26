import { motion } from 'framer-motion';

export function Scene8() {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-20 overflow-hidden bg-[#0a0a0a]"
      initial={{ opacity: 0, filter: 'blur(10px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex flex-col items-center justify-center z-10">
        <motion.div
          className="font-display text-[6vw] text-white leading-none tracking-tight mb-[2vh]"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
        >
          SZL Holdings
        </motion.div>

        <motion.div
          className="flex items-center gap-[1vw] mb-[4vh]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
        >
          <div className="w-[4vw] h-[1px] bg-[#c9b787]/50" />
          <div className="font-display text-[3vw] text-white">
            <span>a</span>
            <span className="text-[#c9b787]">11</span>
            <span>oy</span>
          </div>
          <div className="w-[4vw] h-[1px] bg-[#c9b787]/50" />
        </motion.div>

        <motion.div
          className="font-mono text-[1.2vw] text-[#8a8a8a] uppercase tracking-widest"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6, ease: 'easeOut' }}
        >
          Governed Operational Intelligence
        </motion.div>
      </div>

      <motion.div
        className="absolute inset-0 pointer-events-none z-0"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 10, ease: 'linear' }}
      >
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-[2px] h-[2px] rounded-full bg-[#c9b787]"
            style={{
              left: `${Math.random() * 100}vw`,
              top: `${Math.random() * 100}vh`,
            }}
            animate={{
              y: [0, -50],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 3,
              repeat: Infinity,
              ease: 'linear',
              delay: Math.random() * 2,
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
