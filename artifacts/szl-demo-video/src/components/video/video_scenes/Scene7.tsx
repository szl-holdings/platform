import { motion } from 'framer-motion';

export function Scene7() {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-[#0a0a0a]"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.8 }}
    >
      <div className="absolute top-12 left-12 z-20 flex items-center gap-4">
        <motion.div
          className="h-px w-8 bg-[#c9b787]"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
        <motion.span
          className="font-mono text-[1.2vw] tracking-[0.2em] text-[#c9b787] uppercase"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          EXECUTIVE INTELLIGENCE
        </motion.span>
      </div>

      <div className="relative w-[85vw] h-[65vh] flex gap-6">
        <motion.div
          className="w-1/3 relative rounded-xl overflow-hidden border border-white/10 shadow-[0_0_60px_rgba(201,183,135,0.05)]"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        >
          <motion.img
            src={`${import.meta.env.BASE_URL}screens/13-exec-brief.jpg`}
            alt="Executive Brief"
            className="w-full h-full object-cover object-left"
            initial={{ scale: 1.1, y: '2%' }}
            animate={{ scale: 1.0, y: '0%' }}
            transition={{ duration: 11, ease: 'linear' }}
          />
        </motion.div>
        
        <div className="flex-1 flex flex-col gap-6">
          <motion.div
            className="flex-1 relative rounded-xl overflow-hidden border border-white/10 shadow-[0_0_60px_rgba(201,183,135,0.05)]"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          >
            <motion.img
              src={`${import.meta.env.BASE_URL}screens/10-frontier-intel.jpg`}
              alt="Frontier Intelligence"
              className="w-full h-full object-cover object-top"
              initial={{ scale: 1.0, x: '-2%' }}
              animate={{ scale: 1.1, x: '0%' }}
              transition={{ duration: 11, ease: 'linear' }}
            />
          </motion.div>
          <motion.div
            className="flex-1 relative rounded-xl overflow-hidden border border-white/10 shadow-[0_0_60px_rgba(201,183,135,0.05)]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
          >
            <motion.img
              src={`${import.meta.env.BASE_URL}screens/14-verticals.jpg`}
              alt="Verticals"
              className="w-full h-full object-cover object-top"
              initial={{ scale: 1.1, y: '-2%' }}
              animate={{ scale: 1.0, y: '0%' }}
              transition={{ duration: 11, ease: 'linear' }}
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
