import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useVideoPlayer } from '@/lib/video';
import { CaptionTrack, SCENE_CAPTIONS } from './CaptionTrack';
import { type Chapter, ChapterMarkers } from './ChapterMarkers';
import { type SocialCut, CaptionToggle, SOCIAL_CUT_CONFIGS, SocialCutSelector } from './SocialCutSelector';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';
import { Scene6 } from './video_scenes/Scene6';
import { Scene7 } from './video_scenes/Scene7';
import { Scene8 } from './video_scenes/Scene8';

const FULL_SCENE_DURATIONS = {
  shot1: 6000,
  shot2: 6000,
  shot3: 8000,
  shot4: 8000,
  shot5: 8000,
  shot6: 8000,
  shot7: 10000,
  shot8: 6000,
};

const CHAPTER_META: Record<string, { title: string; subtitle: string }> = {
  shot1: { title: 'Hero Reveal', subtitle: 'Governed orchestration' },
  shot2: { title: 'Ecosystem', subtitle: 'One backbone, many surfaces' },
  shot3: { title: 'Signal Flow', subtitle: 'Signal to proof' },
  shot4: { title: 'Metrics', subtitle: 'Built for proof' },
  shot5: { title: 'Trust Surfaces', subtitle: 'Structural governance' },
  shot6: { title: 'Domain Packs', subtitle: 'Seven verticals' },
  shot7: { title: 'The Platform', subtitle: 'Seven-layer fabric' },
  shot8: { title: 'End Card', subtitle: 'Governed intelligence' },
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
        durationMs: durations[key]!,
      };
      cumulative += durations[key]!;
      return ch;
    });
  }, [activeCut]);

  const sceneIndexMap: Record<string, number> = {};
  Object.keys(FULL_SCENE_DURATIONS).forEach((k, i) => {
    sceneIndexMap[k] = i;
  });
  const currentSceneKey = sceneKeys[currentScene] ?? '';
  const fullSceneIndex = sceneIndexMap[currentSceneKey] ?? 0;

  return (
    <div className="absolute inset-0">
      <AnimatePresence mode="popLayout">
        {fullSceneIndex === 0 && <Scene1 key="shot1" />}
        {fullSceneIndex === 1 && <Scene2 key="shot2" />}
        {fullSceneIndex === 2 && <Scene3 key="shot3" />}
        {fullSceneIndex === 3 && <Scene4 key="shot4" />}
        {fullSceneIndex === 4 && <Scene5 key="shot5" />}
        {fullSceneIndex === 5 && <Scene6 key="shot6" />}
        {fullSceneIndex === 6 && <Scene7 key="shot7" />}
        {fullSceneIndex === 7 && <Scene8 key="shot8" />}
      </AnimatePresence>

      <CaptionTrack
        sceneCaptions={SCENE_CAPTIONS}
        currentSceneKey={currentSceneKey}
        sceneElapsedMs={sceneElapsedMs}
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

function getCaptureMode(): SocialCut | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const cut = params.get('capture');
  if (!cut) return null;
  if (cut === '1' || cut === 'full') return 'full';
  if (cut === '60s' || cut === '30s' || cut === '15s') return cut;
  return 'full';
}

export default function VideoTemplate() {
  const captureCut = getCaptureMode();
  const [activeCut, setActiveCut] = useState<SocialCut>(captureCut ?? 'full');
  const [captionsVisible, setCaptionsVisible] = useState(true);
  const [playerKey, setPlayerKey] = useState(0);

  function handleCutChange(cut: SocialCut) {
    setActiveCut(cut);
    setPlayerKey((k) => k + 1);
  }

  const durations = SOCIAL_CUT_CONFIGS.full.durations;
  const { currentScene } = useVideoPlayer({ durations });

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[var(--color-bg-base)]">
      <div className="absolute inset-0 bg-noise pointer-events-none z-0" />

      <motion.div
        className="absolute w-[80vw] h-[80vw] rounded-full blur-[120px] opacity-20 pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, var(--color-lyte-cyan), transparent 70%)' }}
        animate={{
          x: ['-20vw', '40vw', '-10vw', '20vw', '30vw', '-15vw', '10vw', '-20vw'],
          y: ['-10vh', '30vh', '60vh', '-20vh', '40vh', '10vh', '-30vh', '-10vh'],
          scale: [1, 1.2, 0.8, 1.1, 0.9, 1.3, 1.0, 1],
          opacity: [0.15, 0.25, 0.15, 0.3, 0.2, 0.25, 0.15, 0.15],
        }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      />

      <motion.div
        className="absolute h-[1px] bg-gradient-to-r from-transparent via-[var(--color-hero-accent)] to-transparent z-10"
        animate={{
          left: ['-10%', '0%', '10%', '5%', '20%', '-5%', '15%', '0%'][currentScene] ?? '-10%',
          width: ['120%', '100%', '80%', '90%', '60%', '110%', '70%', '100%'][currentScene] ?? '120%',
          top: ['50%', '20%', '80%', '30%', '50%', '40%', '60%', '50%'][currentScene] ?? '50%',
          opacity: [0.3, 0.6, 0.4, 0.7, 0.2, 0.5, 0.3, 0.1][currentScene] ?? 0.3,
        }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      />

      {!captureCut && (
        <>
          <SocialCutSelector activeCut={activeCut} onSelect={handleCutChange} />
          <CaptionToggle visible={captionsVisible} onToggle={() => setCaptionsVisible((v) => !v)} />
        </>
      )}

      <VideoPlayer key={playerKey} activeCut={activeCut} captionsVisible={captionsVisible} />
    </div>
  );
}
