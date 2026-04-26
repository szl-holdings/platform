import { AnimatePresence, motion } from 'framer-motion';

export interface Caption {
  startMs: number;
  endMs: number;
  text: string;
  speaker?: string;
}

export type SceneCaptions = Record<string, Caption[]>;

interface CaptionTrackProps {
  sceneCaptions: SceneCaptions;
  currentSceneKey: string;
  sceneElapsedMs: number;
  visible: boolean;
}

export function CaptionTrack({
  sceneCaptions,
  currentSceneKey,
  sceneElapsedMs,
  visible,
}: CaptionTrackProps) {
  if (!visible) return null;

  const captions = sceneCaptions[currentSceneKey] ?? [];
  const current = captions.find((c) => sceneElapsedMs >= c.startMs && sceneElapsedMs < c.endMs);

  return (
    <div className="absolute bottom-16 left-0 right-0 z-30 flex justify-center px-8 pointer-events-none">
      <AnimatePresence mode="wait">
        {current && (
          <motion.div
            key={`${currentSceneKey}-${current.startMs}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="max-w-3xl text-center"
          >
            {current.speaker && (
              <div className="text-[9px] font-mono text-[#c9b787]/80 mb-1 uppercase tracking-widest">
                {current.speaker}
              </div>
            )}
            <div
              className="text-[1.2vw] font-display italic leading-relaxed px-6 py-3 rounded-lg inline-block"
              style={{
                background: 'rgba(10,10,10,0.85)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                color: 'rgba(245,245,245,0.95)',
                border: '1px solid rgba(201,183,135,0.15)',
              }}
            >
              "{current.text}"
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const SCENE_CAPTIONS: SceneCaptions = {
  shot1: [
    { startMs: 1000, endMs: 9500, text: 'A11oy. The governed agentic execution layer for high-consequence enterprise operations.' },
  ],
  shot2: [
    { startMs: 500, endMs: 4000, text: 'One unified command surface.' },
    { startMs: 4000, endMs: 7000, text: '63 active signals. 7 running workcells. 91% proof coverage.' },
    { startMs: 7000, endMs: 10500, text: 'Every action traceable.' },
  ],
  shot3: [
    { startMs: 500, endMs: 5000, text: '153 business signals ingested across 7 verticals.' },
    { startMs: 5000, endMs: 10500, text: 'Processed through a seven-layer execution fabric — every layer operational.' },
  ],
  shot4: [
    { startMs: 500, endMs: 4000, text: '6 governed agents. 20 workcells.' },
    { startMs: 4000, endMs: 7000, text: 'Trust scores tracked in real time.' },
    { startMs: 7000, endMs: 10500, text: 'Every execution context carries proof.' },
  ],
  shot5: [
    { startMs: 500, endMs: 3500, text: 'Cryptographic proof chain.' },
    { startMs: 3500, endMs: 6500, text: '100% chain integrity. Zero bypass attempts.' },
    { startMs: 6500, endMs: 10500, text: 'Human approval mandatory before any consequential action.' },
  ],
  shot6: [
    { startMs: 500, endMs: 4000, text: '11-layer orchestration pipeline.' },
    { startMs: 4000, endMs: 10500, text: 'Multi-provider AI routing — Anthropic, OpenAI, Gemini — governed by policy, not convention.' },
  ],
  shot7: [
    { startMs: 500, endMs: 3500, text: 'Board-ready intelligence.' },
    { startMs: 3500, endMs: 6500, text: 'Competitive positioning across 8 dimensions.' },
    { startMs: 6500, endMs: 10500, text: '7 enterprise verticals from a single fabric.' },
  ],
  shot8: [
    { startMs: 500, endMs: 5000, text: 'A11oy. One fabric. Governed autonomy.' },
    { startMs: 5000, endMs: 10500, text: 'SZL Holdings.', speaker: 'SZL Holdings' },
  ],
};

export const TRANSCRIPT_TEXT = Object.values(SCENE_CAPTIONS)
  .flat()
  .map((c) => c.text)
  .join(' ');
