import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';

const SCENE_DURATIONS = {
  open: 12000,
  reel: 18000,
  fabric: 18000,
  cortex: 10000,
  close: 12000,
};

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[var(--color-bg-base)]">
      {/* Background noise */}
      <div className="absolute inset-0 bg-noise pointer-events-none z-0" />

      {/* Drifting orb */}
      <motion.div 
        className="absolute w-[80vw] h-[80vw] rounded-full blur-[120px] opacity-20 pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, var(--color-lyte-cyan), transparent 70%)' }}
        animate={{ 
          x: ['-20vw', '40vw', '-10vw', '20vw', '-20vw'],
          y: ['-10vh', '30vh', '60vh', '-20vh', '-10vh'],
          scale: [1, 1.2, 0.8, 1.1, 1],
          opacity: [0.15, 0.25, 0.15, 0.3, 0.15]
        }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      />

      {/* Persistent Accent Line */}
      <motion.div
        className="absolute h-[1px] bg-gradient-to-r from-transparent via-[var(--color-hero-accent)] to-transparent z-10"
        animate={{
          left: ['-10%', '0%', '10%', '5%', '20%'][currentScene],
          width: ['120%', '100%', '80%', '90%', '60%'][currentScene],
          top: ['50%', '20%', '80%', '30%', '50%'][currentScene],
          opacity: [0.3, 0.6, 0.4, 0.7, 0.2][currentScene]
        }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      />

      <AnimatePresence mode="popLayout">
        {currentScene === 0 && <Scene1 key="open" />}
        {currentScene === 1 && <Scene2 key="reel" />}
        {currentScene === 2 && <Scene3 key="fabric" />}
        {currentScene === 3 && <Scene4 key="cortex" />}
        {currentScene === 4 && <Scene5 key="close" />}
      </AnimatePresence>
    </div>
  );
}
