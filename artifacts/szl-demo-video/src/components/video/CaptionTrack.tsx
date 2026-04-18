import { motion, AnimatePresence } from 'framer-motion';

export interface Caption {
  startMs: number;
  endMs: number;
  text: string;
  speaker?: string;
}

interface CaptionTrackProps {
  captions: Caption[];
  totalElapsedMs: number;
  visible: boolean;
}

export function CaptionTrack({ captions, totalElapsedMs, visible }: CaptionTrackProps) {
  if (!visible) return null;

  const current = captions.find(
    (c) => totalElapsedMs >= c.startMs && totalElapsedMs < c.endMs
  );

  return (
    <div className="absolute bottom-16 left-0 right-0 z-25 flex justify-center px-8 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {current && (
          <motion.div
            key={`${current.startMs}-${current.text.slice(0, 10)}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="max-w-2xl text-center"
          >
            {current.speaker && (
              <div className="text-[9px] font-mono text-white/40 mb-1 uppercase tracking-widest">
                {current.speaker}
              </div>
            )}
            <div
              className="text-sm font-medium leading-relaxed px-4 py-2 rounded-lg"
              style={{
                background: 'rgba(0,0,0,0.72)',
                backdropFilter: 'blur(8px)',
                color: 'rgba(255,255,255,0.92)',
                textShadow: '0 1px 4px rgba(0,0,0,0.8)',
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

export const FULL_CAPTIONS: Caption[] = [
  { startMs: 1000, endMs: 4000, text: "Every autonomous AI system faces the same dilemma:" },
  { startMs: 4200, endMs: 7500, text: "give agents enough freedom to be useful, or enough control to be safe." },
  { startMs: 7800, endMs: 11000, text: "SZL Holdings has solved this — with governed autonomy." },

  { startMs: 12500, endMs: 16000, text: "Pulse delivers executive intelligence across your entire portfolio." },
  { startMs: 16200, endMs: 20000, text: "Vessels monitors your fleet in real-time, surfacing risk before it becomes loss." },
  { startMs: 20200, endMs: 24000, text: "Terra detects distressed assets and turns signals into acquisition briefs." },
  { startMs: 24200, endMs: 28000, text: "Aegis unifies your security posture from SOC to boardroom." },
  { startMs: 28200, endMs: 30500, text: "Carlota Jo coordinates your strategic advisory layer." },

  { startMs: 31000, endMs: 35000, text: "The Alloy Fabric is the agentic backbone connecting every surface." },
  { startMs: 35200, endMs: 39000, text: "Agents collaborate, delegate, and verify — without human bottlenecks." },
  { startMs: 39200, endMs: 44000, text: "Every action is logged with full reasoning: why it ran, what it chose, what it rejected." },
  { startMs: 44200, endMs: 48500, text: "The audit trail is immutable. Governance isn't an afterthought — it's the architecture." },

  { startMs: 49500, endMs: 53500, text: "Cortex intelligence learns from every decision across the portfolio." },
  { startMs: 53700, endMs: 57500, text: "Cross-domain correlations surface what siloed systems miss." },
  { startMs: 57700, endMs: 59500, text: "Confidence scores, not black boxes." },

  { startMs: 60500, endMs: 64000, text: "This is the future of enterprise AI: decisive, auditable, and governed." },
  { startMs: 64200, endMs: 67500, text: "Autonomous enough to act. Controlled enough to trust." },
  { startMs: 67800, endMs: 70000, text: "SZL Holdings — governed autonomy at enterprise scale." },
];

export const TRANSCRIPT_TEXT = FULL_CAPTIONS.map((c) => c.text).join(' ');
