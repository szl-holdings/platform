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
  open: [
    { startMs: 1000, endMs: 4500, text: 'The era of AI without receipts is ending.' },
    {
      startMs: 4500,
      endMs: 9000,
      text: 'Every action carries a trace ID, source, freshness, and citation.',
    },
    { startMs: 9000, endMs: 12000, text: 'Provenance is not optional.' },
  ],
  reel: [
    { startMs: 0, endMs: 2500, text: 'LUMINA — executive briefing, principal eyes only.' },
    { startMs: 2500, endMs: 5000, text: 'SEXTANT — maritime intelligence with human approval.' },
    { startMs: 5000, endMs: 7500, text: 'DOMAINE — real estate intelligence across $4.2B+ AUM.' },
    {
      startMs: 7500,
      endMs: 10000,
      text: 'PARAGON — defense and intel, blocked by policy until cleared.',
    },
    { startMs: 10000, endMs: 12500, text: 'Carlota Jo — private advisory, judgment-led.' },
    { startMs: 12500, endMs: 15000, text: 'TENAX — cyber posture under guardian approval.' },
    { startMs: 15000, endMs: 17500, text: 'KORA — decision intelligence with confidence scores.' },
    {
      startMs: 17500,
      endMs: 20000,
      text: 'Counsel — legal exposure surfaced before crisis.',
    },
    {
      startMs: 20000,
      endMs: 22500,
      text: 'Counsel — every obligation tracked, every deadline locked.',
    },
    { startMs: 22500, endMs: 25000, text: 'Unified Command — ten surfaces, one governed fabric.' },
  ],
  fabric: [
    {
      startMs: 500,
      endMs: 4000,
      text: 'The Decision Fabric — a governed substrate beneath every surface.',
    },
    { startMs: 4000, endMs: 10000, text: 'Constellation, Trace, Guardian, Eval, Memory, Tools.' },
    { startMs: 10000, endMs: 18000, text: 'Six systems. One explainable runtime.' },
  ],
  cortex: [
    { startMs: 500, endMs: 2000, text: 'APEX Mobile — the pocket-cockpit.' },
    { startMs: 2000, endMs: 3500, text: 'Maritime risk surfaces in real time.' },
    {
      startMs: 3500,
      endMs: 5000,
      text: 'Cross-domain correlation links exposure across the portfolio.',
    },
    { startMs: 5000, endMs: 10000, text: 'Human approval mandatory before consequential action.' },
  ],
  close: [
    { startMs: 1000, endMs: 3000, text: 'SZL Holdings — the Governed Decision Operating System.' },
    { startMs: 3000, endMs: 5000, text: '"The era of AI-without-receipts is ending."' },
    { startMs: 5000, endMs: 6500, text: 'Ten surfaces. One governed fabric.' },
    {
      startMs: 6500,
      endMs: 12000,
      text: 'Stephen Lutar, Founder & CEO — szl.com',
      speaker: 'SZL Holdings',
    },
  ],
};

export const TRANSCRIPT_TEXT = Object.values(SCENE_CAPTIONS)
  .flat()
  .map((c) => c.text)
  .join(' ');
