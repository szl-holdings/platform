import { motion } from 'framer-motion';

export function Scene1() {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-[#0a0a0a]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
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
          HERO OPEN
        </motion.span>
      </div>

      <motion.div
        className="relative w-[85vw] aspect-video rounded-xl overflow-hidden border border-white/10 shadow-[0_0_60px_rgba(201,183,135,0.1)]"
        initial={{ opacity: 0, y: 40, rotateX: 10 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        style={{ perspective: 1000 }}
      >
        <motion.img
          src={`${import.meta.env.BASE_URL}screens/01-landing.jpg`}
          alt="Landing"
          className="w-full h-full object-cover"
          initial={{ scale: 1.1, x: '-2%' }}
          animate={{ scale: 1.0, x: '0%' }}
          transition={{ duration: 11, ease: 'linear' }}
        />
      </motion.div>
    </motion.div>
  );
}
