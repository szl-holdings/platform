import { motion } from 'framer-motion';

export type SocialCut = 'full' | '60s' | '30s' | '15s';

export const SOCIAL_CUT_CONFIGS: Record<
  SocialCut,
  {
    label: string;
    duration: string;
    description: string;
    sceneRange: [number, number];
    durations: Record<string, number>;
  }
> = {
  full: {
    label: 'Full Demo',
    duration: '60s',
    description: 'Complete a11oy walkthrough',
    sceneRange: [0, 7],
    durations: { shot1: 6000, shot2: 6000, shot3: 8000, shot4: 8000, shot5: 8000, shot6: 8000, shot7: 10000, shot8: 6000 },
  },
  '60s': {
    label: '60s Cut',
    duration: '60s',
    description: 'Full launch video',
    sceneRange: [0, 7],
    durations: { shot1: 6000, shot2: 6000, shot3: 8000, shot4: 8000, shot5: 8000, shot6: 8000, shot7: 10000, shot8: 6000 },
  },
  '30s': {
    label: '30s Cut',
    duration: '30s',
    description: 'Hero + metrics + close',
    sceneRange: [0, 3],
    durations: { shot1: 6000, shot3: 8000, shot4: 8000, shot8: 8000 },
  },
  '15s': {
    label: '15s Cut',
    duration: '15s',
    description: 'Hook + brand',
    sceneRange: [0, 1],
    durations: { shot1: 8000, shot8: 7000 },
  },
};

interface SocialCutSelectorProps {
  activeCut: SocialCut;
  onSelect: (cut: SocialCut) => void;
}

export function SocialCutSelector({ activeCut, onSelect }: SocialCutSelectorProps) {
  const cuts: SocialCut[] = ['full', '60s', '30s', '15s'];

  return (
    <div className="absolute top-4 right-4 z-40 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/10">
      <span className="text-[9px] font-mono text-white/30 mr-1 uppercase tracking-widest">Cut</span>
      {cuts.map((cut) => {
        const config = SOCIAL_CUT_CONFIGS[cut];
        const isActive = activeCut === cut;
        return (
          <motion.button
            key={cut}
            onClick={() => onSelect(cut)}
            whileTap={{ scale: 0.95 }}
            className="relative text-[10px] font-mono px-2.5 py-1 rounded-lg transition-colors"
            style={{
              backgroundColor: isActive ? 'rgba(0, 212, 255, 0.15)' : 'transparent',
              color: isActive ? 'rgba(0, 212, 255, 0.9)' : 'rgba(255,255,255,0.4)',
              border: isActive ? '1px solid rgba(0,212,255,0.3)' : '1px solid transparent',
            }}
            title={config.description}
          >
            {config.label}
          </motion.button>
        );
      })}
    </div>
  );
}

export function CaptionToggle({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return (
    <div className="absolute top-4 left-4 z-40">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/10 text-[10px] font-mono transition-colors"
        style={{ color: visible ? 'rgba(0, 212, 255, 0.9)' : 'rgba(255,255,255,0.3)' }}
        title="Toggle captions"
      >
        <span className="text-[8px] uppercase tracking-widest">CC</span>
        <span>{visible ? 'ON' : 'OFF'}</span>
      </button>
    </div>
  );
}
