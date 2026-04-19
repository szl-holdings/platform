import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';
import { ChapterMarkers } from './ChapterMarkers';
import type { Chapter } from './ChapterMarkers';
import { CaptionTrack, FULL_CAPTIONS } from './CaptionTrack';
import { SocialCutSelector, CaptionToggle, SOCIAL_CUT_CONFIGS } from './SocialCutSelector';
import type { SocialCut } from './SocialCutSelector';

const FULL_SCENE_DURATIONS = {
  open: 12000,
  reel: 25000,
  fabric: 18000,
  cortex: 10000,
  close: 12000,
};

const CHAPTER_META: Record<string, { title: string; subtitle: string }> = {
  open: { title: 'The Governance Problem', subtitle: 'Autonomy vs. control' },
  reel: { title: 'Meet the Platform', subtitle: 'SZL portfolio surfaces' },
  fabric: { title: 'The Alloy Fabric', subtitle: 'Agentic backbone' },
  cortex: { title: 'Cortex Intelligence', subtitle: 'Cross-domain correlation' },
  close: { title: 'Governed Autonomy', subtitle: 'The SZL difference' },
};

function VideoPlayer({
  activeCut,
  captionsVisible,
}: {
  activeCut: SocialCut;
  captionsVisible: boolean;
}) {
  const config = SOCIAL_CUT_CONFIGS[activeCut];
  const durations = config.durations;

  const { currentScene, totalElapsedMs, sceneElapsedMs } = useVideoPlayer({ durations });

  const sceneKeys = Object.keys(durations);
  const totalDurationMs = Object.values(durations).reduce((s, d) => s + d, 0);

  const chapters = useMemo<Chapter[]>(() => {
    let cumulative = 0;
    return sceneKeys.map((key, i) => {
      const ch: Chapter = {
        index: i,
        title: CHAPTER_META[key]?.title ?? key,
        subtitle: CHAPTER_META[key]?.subtitle ?? '',
        startMs: cumulative,
        durationMs: durations[key],
      };
      cumulative += durations[key];
      return ch;
    });
  }, [activeCut]);

  const sceneIndexMap: Record<string, number> = {};
  Object.keys(FULL_SCENE_DURATIONS).forEach((k, i) => { sceneIndexMap[k] = i; });
  const currentSceneKey = sceneKeys[currentScene];
  const fullSceneIndex = sceneIndexMap[currentSceneKey] ?? 0;

  return (
    <div className="absolute inset-0">
      <AnimatePresence mode="popLayout">
        {fullSceneIndex === 0 && <Scene1 key="open" />}
        {fullSceneIndex === 1 && <Scene2 key="reel" />}
        {fullSceneIndex === 2 && <Scene3 key="fabric" />}
        {fullSceneIndex === 3 && <Scene4 key="cortex" />}
        {fullSceneIndex === 4 && <Scene5 key="close" />}
      </AnimatePresence>

      <CaptionTrack
        captions={FULL_CAPTIONS}
        totalElapsedMs={totalElapsedMs}
        visible={captionsVisible}
      />

      <ChapterMarkers
        chapters={chapters}
        currentScene={currentScene}
        totalElapsedMs={totalElapsedMs}
        totalDurationMs={totalDurationMs}
      />

      {activeCut !== 'full' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-14 right-4 z-30 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10"
        >
          <span className="text-[9px] font-mono text-white/40">
            Social cut · {config.label} · {config.description}
          </span>
        </motion.div>
      )}
    </div>
  );
}

export default function VideoTemplate() {
  const [activeCut, setActiveCut] = useState<SocialCut>('full');
  const [captionsVisible, setCaptionsVisible] = useState(true);
  const [playerKey, setPlayerKey] = useState(0);

  function handleCutChange(cut: SocialCut) {
    setActiveCut(cut);
    setPlayerKey((k) => k + 1);
  }

  const durations = SOCIAL_CUT_CONFIGS['full'].durations;
  const { currentScene } = useVideoPlayer({ durations });

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[var(--color-bg-base)]">
      <div className="absolute inset-0 bg-noise pointer-events-none z-0" />

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

      <SocialCutSelector activeCut={activeCut} onSelect={handleCutChange} />
      <CaptionToggle visible={captionsVisible} onToggle={() => setCaptionsVisible((v) => !v)} />

      <VideoPlayer key={playerKey} activeCut={activeCut} captionsVisible={captionsVisible} />
    </div>
  );
}
