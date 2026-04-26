import { motion } from 'framer-motion';

export function Scene2() {
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
          COMMAND &amp; NOW BOARD
        </motion.span>
      </div>

      <div className="flex gap-4 w-[90vw] h-[44vh]">
        <motion.div
          className="relative flex-1 rounded-xl overflow-hidden border border-white/10 shadow-[0_0_60px_rgba(201,183,135,0.1)]"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        >
          <motion.img
            src={`${import.meta.env.BASE_URL}screens/02-command-surface.jpg`}
            alt="Command Surface"
            className="w-full h-full object-cover object-top"
            initial={{ scale: 1.05 }}
            animate={{ scale: 1.12 }}
            transition={{ duration: 11, ease: 'linear' }}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent h-16 flex items-end pb-3 px-4">
            <span className="font-mono text-[0.7vw] text-white/60 tracking-widest uppercase">
              Unified Operator Command
            </span>
          </div>
        </motion.div>

        <motion.div
          className="relative flex-1 rounded-xl overflow-hidden border border-white/10 shadow-[0_0_60px_rgba(201,183,135,0.1)]"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
        >
          <motion.img
            src={`${import.meta.env.BASE_URL}screens/12-now-board.jpg`}
            alt="Now Board"
            className="w-full h-full object-cover object-top"
            initial={{ scale: 1.0, y: '-3%' }}
            animate={{ scale: 1.08, y: '0%' }}
            transition={{ duration: 11, ease: 'linear' }}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent h-16 flex items-end pb-3 px-4">
            <span className="font-mono text-[0.7vw] text-white/60 tracking-widest uppercase">
              Live Operational Status
            </span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
