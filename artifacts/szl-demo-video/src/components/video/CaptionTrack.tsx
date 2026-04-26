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
      <AnimatePresence mode="popLayout">
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
              <div className="text-[9px] font-mono text-white/40 mb-1 uppercase tracking-widest">
                {current.speaker}
              </div>
            )}
            <div
              className="text-base font-medium leading-relaxed px-5 py-2.5 rounded-lg inline-block"
              style={{
                background: 'rgba(0,0,0,0.78)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                color: 'rgba(255,255,255,0.95)',
                textShadow: '0 1px 6px rgba(0,0,0,0.9)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {current.text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Captions are scene-relative (ms from scene start) so they stay aligned
// across the full demo and every social cut.
export const SCENE_CAPTIONS: SceneCaptions = {
  shot1: [
    { startMs: 800, endMs: 3500, text: 'Every consequential AI action should carry a receipt.' },
    { startMs: 3500, endMs: 5800, text: 'Governed orchestration for consequence-bearing AI.' },
  ],
  shot2: [
    { startMs: 500, endMs: 3000, text: 'One backbone. Seven surfaces. One governed fabric.' },
    { startMs: 3000, endMs: 5800, text: 'Every domain speaks the same language of trust.' },
  ],
  shot3: [
    { startMs: 500, endMs: 3000, text: 'From raw signal to auditable proof — in milliseconds.' },
    { startMs: 3500, endMs: 6000, text: 'Signal. Decision. Approval. Execute. Audit.' },
    { startMs: 6000, endMs: 7800, text: 'Nothing executes without a receipt.' },
  ],
  shot4: [
    { startMs: 500, endMs: 3000, text: 'Built for proof, not just demos.' },
    { startMs: 3500, endMs: 6000, text: '59 SDK primitives. 133 API endpoints. 7 fabric layers.' },
    { startMs: 6000, endMs: 7800, text: 'Every metric is verifiable.' },
  ],
  shot5: [
    { startMs: 500, endMs: 3000, text: 'Governance is structural, not optional.' },
    { startMs: 3500, endMs: 6000, text: 'Proof chain. Constitutional enforcement. Agent welfare.' },
    { startMs: 6000, endMs: 7800, text: 'Trust is architected in, not bolted on.' },
  ],
  shot6: [
    { startMs: 500, endMs: 3000, text: 'Seven verticals. One orchestration layer.' },
    { startMs: 3500, endMs: 6500, text: 'Defense. Maritime. Real estate. Legal. Advisory. Intelligence. Decision.' },
  ],
  shot7: [
    { startMs: 500, endMs: 3500, text: 'The orchestration layer is taking shape.' },
    { startMs: 3500, endMs: 7000, text: 'Signal Mesh. Causal Core. Context Engine. Workcell Engine.' },
    { startMs: 7000, endMs: 9800, text: 'Proof Chain. Covenant Layer. Replay.' },
  ],
  shot8: [
    { startMs: 500, endMs: 2500, text: 'SZL Holdings — Governed Operational Intelligence.' },
    { startMs: 2500, endMs: 5500, text: 'The era of AI without receipts is ending.', speaker: 'SZL Holdings' },
  ],
};

export const TRANSCRIPT_TEXT = Object.values(SCENE_CAPTIONS)
  .flat()
  .map((c) => c.text)
  .join(' ');
