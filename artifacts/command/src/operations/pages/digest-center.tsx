import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  FileText,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

const BG = { page: '#080c14', surface: '#0c1018', elevated: '#10141e' };
const BORDER = { subtle: 'rgba(255,255,255,0.04)', muted: 'rgba(255,255,255,0.06)' };
const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.55)',
  tertiary: 'rgba(255,255,255,0.28)',
  muted: 'rgba(255,255,255,0.14)',
};
const ELECTRIC = '#2dd4bf';

interface Digest {
  id: string;
  title: string;
  period: string;
  generatedAt: string;
  status: 'ready' | 'generating' | 'scheduled';
  summary: string;
  highlights: string[];
  packsCovered: string[];
  wordCount: number;
}

const DIGESTS: Digest[] = [
  {
    id: 'DIG-0412',
    title: 'Executive Weekly Digest — Week of April 6',
    period: 'Apr 6–12, 2026',
    generatedAt: 'Apr 12, 2026 · 7:00 AM',
    status: 'ready',
    summary:
      'Portfolio performance held steady this week across 4 active packs. Vessels pack reported elevated pressure due to ETA compliance gaps affecting 3 vessels. PRISM flagged an ownership conflict in accounts receivable requiring executive resolution. Aegis delivered a clean security posture audit at 94% score. Terra completed its Q1 appraisal cycle with 6 assets reviewed.',
    highlights: [
      'Vessels: 3 vessels outside SLA — fuel surcharge approval stalled (22h)',
      'PRISM: Q2 pricing revision pending executive sign-off (31h overdue)',
      'Aegis: Security audit completed — 94% score, 0 critical findings',
      'Terra: Lease renewal at risk — exhibit B missing signature',
      'Portfolio: $15.3M total value at risk across open items',
    ],
    packsCovered: ['PRAXIS', 'Terra', 'Vessels', 'Aegis'],
    wordCount: 412,
  },
  {
    id: 'DIG-0405',
    title: 'Executive Weekly Digest — Week of March 30',
    period: 'Mar 30 – Apr 5, 2026',
    generatedAt: 'Apr 5, 2026 · 7:00 AM',
    status: 'ready',
    summary:
      'Moderate portfolio health across Q1 close period. Vessels completed 4 successful port calls. PRISM Q1 reporting cycle closed. Terra completed 3 asset reviews. Aegis initiated security vendor onboarding process.',
    highlights: [
      'PRISM: Q1 executive reporting cycle closed — 14 items resolved',
      'Vessels: 4 successful port calls — Cape Town, Singapore, Rotterdam, Santos',
      'Terra: 3 asset reviews completed — Building 7A refinancing initiated',
      'Aegis: Security vendor onboarding initiated — 2 vendors under review',
    ],
    packsCovered: ['PRAXIS', 'Terra', 'Vessels', 'Aegis'],
    wordCount: 388,
  },
  {
    id: 'DIG-0329',
    title: 'Executive Weekly Digest — Week of March 23',
    period: 'Mar 23–29, 2026',
    generatedAt: 'Mar 29, 2026 · 7:00 AM',
    status: 'ready',
    summary:
      'Stable week. Portfolio health at 82% aggregate. No critical items. Vessels initiated Q2 charter contract cycle. PRISM ownership review completed.',
    highlights: [
      'Portfolio: 82% aggregate health — highest in 6 weeks',
      'Vessels: Q2 charter contract cycle initiated — 7 vessels',
      'PRISM: Ownership review completed — 3 conflicts resolved',
    ],
    packsCovered: ['PRAXIS', 'Vessels', 'Terra'],
    wordCount: 301,
  },
  {
    id: 'DIG-NEXT',
    title: 'Executive Weekly Digest — Week of April 13',
    period: 'Apr 13–19, 2026',
    generatedAt: 'Scheduled: Apr 19, 2026 · 7:00 AM',
    status: 'scheduled',
    summary: '',
    highlights: [],
    packsCovered: ['PRAXIS', 'Terra', 'Vessels', 'Aegis'],
    wordCount: 0,
  },
];

function StatusPill({ status }: { status: Digest['status'] }) {
  const cfg = {
    ready: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', label: 'Ready' },
    generating: { color: ELECTRIC, bg: 'rgba(45,212,191,0.08)', label: 'Generating…' },
    scheduled: { color: TEXT.tertiary, bg: 'rgba(255,255,255,0.04)', label: 'Scheduled' },
  }[status];
  return (
    <span
      className="text-[8px] font-medium px-2 py-0.5 rounded-full"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      {cfg.label}
    </span>
  );
}

function DigestCard({ digest }: { digest: Digest }) {
  const [expanded, setExpanded] = useState(false);
  const isPending = digest.status === 'scheduled';

  return (
    <div
      className="rounded-md overflow-hidden"
      style={{
        background: BG.surface,
        border: `1px solid ${BORDER.subtle}`,
        opacity: isPending ? 0.7 : 1,
      }}
    >
      <button
        onClick={() => !isPending && setExpanded((e) => !e)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-white/[0.01] transition-colors"
      >
        <div
          className="w-8 h-8 rounded flex items-center justify-center shrink-0 mt-0.5"
          style={{
            background: isPending ? 'rgba(255,255,255,0.04)' : 'rgba(45,212,191,0.08)',
            border: `1px solid ${isPending ? BORDER.subtle : 'rgba(45,212,191,0.14)'}`,
          }}
        >
          <FileText className="w-3.5 h-3.5" style={{ color: isPending ? TEXT.muted : ELECTRIC }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <StatusPill status={digest.status} />
            <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>
              {digest.id}
            </span>
          </div>
          <h3 className="text-[12px] font-medium leading-snug" style={{ color: TEXT.primary }}>
            {digest.title}
          </h3>
          <p className="text-[9px] mt-0.5" style={{ color: TEXT.tertiary }}>
            {digest.period}
          </p>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-2">
          <div className="flex items-center gap-1 text-[8px]" style={{ color: TEXT.muted }}>
            <Clock className="w-2.5 h-2.5" />
            {digest.generatedAt}
          </div>
          {!isPending &&
            (expanded ? (
              <ChevronDown className="w-3.5 h-3.5" style={{ color: TEXT.tertiary }} />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" style={{ color: TEXT.tertiary }} />
            ))}
        </div>
      </button>

      {expanded && !isPending && (
        <div className="px-4 pb-4" style={{ borderTop: `1px solid ${BORDER.subtle}` }}>
          <div className="pt-3 space-y-3">
            <div>
              <span
                className="text-[8px] uppercase tracking-widest font-medium mb-1.5 block"
                style={{ color: TEXT.muted }}
              >
                Executive Summary
              </span>
              <p className="text-[11px] leading-relaxed" style={{ color: TEXT.secondary }}>
                {digest.summary}
              </p>
            </div>

            <div>
              <span
                className="text-[8px] uppercase tracking-widest font-medium mb-1.5 block"
                style={{ color: TEXT.muted }}
              >
                Key Highlights
              </span>
              <ul className="space-y-1.5">
                {digest.highlights.map((h, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-[10px]"
                    style={{ color: TEXT.secondary }}
                  >
                    <CheckCircle2
                      className="w-2.5 h-2.5 mt-0.5 shrink-0"
                      style={{ color: ELECTRIC }}
                    />
                    {h}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3 text-[9px]">
                <span style={{ color: TEXT.muted }}>
                  Packs:{' '}
                  <span style={{ color: TEXT.tertiary }}>{digest.packsCovered.join(', ')}</span>
                </span>
                <span style={{ color: TEXT.muted }}>{digest.wordCount} words</span>
              </div>
              <button
                className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[9px] font-medium transition-all hover:opacity-80"
                style={{
                  background: 'rgba(45,212,191,0.1)',
                  border: '1px solid rgba(45,212,191,0.18)',
                  color: ELECTRIC,
                }}
              >
                <Download className="w-2.5 h-2.5" /> Export PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DigestCenterPage() {
  return (
    <div className="p-4 md:p-5 space-y-5" style={{ background: BG.page }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-3.5 h-3.5" style={{ color: ELECTRIC }} />
            <span
              className="text-[9px] font-mono uppercase tracking-widest"
              style={{ color: ELECTRIC }}
            >
              Digest Center
            </span>
          </div>
          <h1 className="text-lg font-bold tracking-tight" style={{ color: TEXT.primary }}>
            Executive Summary Generation
          </h1>
          <p className="text-[11px] mt-0.5" style={{ color: TEXT.secondary }}>
            Portfolio-wide executive digests generated weekly and on-demand
          </p>
        </div>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[9px] font-medium transition-all hover:opacity-80 shrink-0"
          style={{
            background: 'rgba(45,212,191,0.1)',
            border: '1px solid rgba(45,212,191,0.18)',
            color: ELECTRIC,
          }}
        >
          <Zap className="w-3 h-3" /> Generate Now
        </button>
      </div>

      {/* Schedule info */}
      <div
        className="rounded-md p-3 flex items-center gap-3"
        style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}
      >
        <RefreshCw className="w-3.5 h-3.5 shrink-0" style={{ color: TEXT.tertiary }} />
        <p className="text-[10px]" style={{ color: TEXT.secondary }}>
          Digests are generated automatically every{' '}
          <strong style={{ color: TEXT.primary }}>Sunday at 7:00 AM</strong> covering the prior
          week's portfolio signals across all packs. On-demand generation is available above.
        </p>
      </div>

      {/* Digest list */}
      <div className="space-y-2.5">
        {DIGESTS.map((d) => (
          <DigestCard key={d.id} digest={d} />
        ))}
      </div>
    </div>
  );
}
