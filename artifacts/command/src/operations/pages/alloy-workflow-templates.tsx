import {
  Activity,
  Archive,
  CheckCircle2,
  ChevronRight,
  Clock,
  Edit3,
  Play,
  Plus,
  Users,
  Workflow,
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
const ALLOY = '#4B8BDB';
const ALLOY_DIM = 'rgba(75,139,219,0.12)';

interface WorkflowTemplate {
  id: number;
  name: string;
  description: string;
  pack: string;
  packColor: string;
  trigger: string;
  requiresApproval: boolean;
  approverRole: string;
  runCount: number;
  lastRunAt: string;
  isActive: boolean;
  steps: string[];
  outputType: string;
}

const TEMPLATES: WorkflowTemplate[] = [
  {
    id: 1,
    name: 'Executive Report Generation',
    description:
      'Generates structured executive reports from portfolio signals and delivers to the digest center. Requires exec sign-off before distribution.',
    pack: 'PRAXIS',
    packColor: '#d4a054',
    trigger: 'scheduled',
    requiresApproval: true,
    approverRole: 'exec',
    runCount: 42,
    lastRunAt: '6h ago',
    isActive: true,
    steps: [
      'Aggregate portfolio signals',
      'Score and rank items',
      'Generate narrative',
      'Route for approval',
      'Distribute digest',
    ],
    outputType: 'report',
  },
  {
    id: 2,
    name: 'Fleet ETA Compliance Check',
    description:
      'Polls fleet position data and checks vessel ETAs against SLA windows. Flags compliance gaps with impact estimates.',
    pack: 'SEXTANT',
    packColor: '#38bdf8',
    trigger: 'interval',
    requiresApproval: false,
    approverRole: 'ops',
    runCount: 316,
    lastRunAt: '4m ago',
    isActive: true,
    steps: [
      'Poll AIS positions',
      'Calculate ETAs',
      'Compare against SLAs',
      'Score exposure',
      'Emit signals',
    ],
    outputType: 'signal',
  },
  {
    id: 3,
    name: 'Security Posture Audit',
    description:
      'Comprehensive security posture assessment across physical, digital, and personnel dimensions. Produces a scored audit report.',
    pack: 'PARAGON',
    packColor: '#4f6ef7',
    trigger: 'manual',
    requiresApproval: true,
    approverRole: 'compliance',
    runCount: 8,
    lastRunAt: '6h ago',
    isActive: true,
    steps: [
      'Enumerate security controls',
      'Assess each dimension',
      'Score controls',
      'Identify gaps',
      'Generate recommendation set',
    ],
    outputType: 'report',
  },
  {
    id: 4,
    name: 'Asset Valuation Batch',
    description:
      'Runs batch valuation models across the real estate portfolio using current market comps and income data.',
    pack: 'DOMAINE',
    packColor: '#a07848',
    trigger: 'scheduled',
    requiresApproval: false,
    approverRole: 'analyst',
    runCount: 24,
    lastRunAt: '8h ago',
    isActive: true,
    steps: [
      'Pull asset records',
      'Fetch market comps',
      'Run valuation models',
      'Update NAV',
      'Publish report',
    ],
    outputType: 'report',
  },
  {
    id: 5,
    name: 'Ownership Conflict Detector',
    description:
      'Scans portfolio data for overlapping ownership assignments, unassigned items, and handoff gaps. Routes conflicts for resolution.',
    pack: 'PRAXIS',
    packColor: '#d4a054',
    trigger: 'signal',
    requiresApproval: false,
    approverRole: 'ops',
    runCount: 91,
    lastRunAt: '2m ago',
    isActive: true,
    steps: [
      'Load ownership graph',
      'Detect overlaps',
      'Score conflicts',
      'Match resolution paths',
      'Emit resolution signals',
    ],
    outputType: 'signal',
  },
  {
    id: 6,
    name: 'Fuel Surcharge Rate Calculator',
    description:
      'Calculates updated fuel surcharge rates based on current Brent crude index. Requires finance approval before applying to charter rates.',
    pack: 'SEXTANT',
    packColor: '#38bdf8',
    trigger: 'signal',
    requiresApproval: true,
    approverRole: 'finance',
    runCount: 12,
    lastRunAt: '22h ago',
    isActive: false,
    steps: [
      'Fetch Brent crude price',
      'Apply surcharge formula',
      'Calculate fleet impact',
      'Route for finance approval',
      'Apply approved rates',
    ],
    outputType: 'decision',
  },
];

function TriggerBadge({ trigger }: { trigger: string }) {
  const cfg: Record<string, { color: string; label: string }> = {
    scheduled: { color: '#8b7ac8', label: 'Scheduled' },
    interval: { color: ALLOY, label: 'Interval' },
    manual: { color: TEXT.tertiary, label: 'Manual' },
    signal: { color: '#c8953c', label: 'Signal-triggered' },
  };
  const c = cfg[trigger] ?? cfg.manual;
  return (
    <span
      className="text-[7px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider"
      style={{ color: c.color, background: `${c.color}10` }}
    >
      {c.label}
    </span>
  );
}

export default function AlloyWorkflowTemplatesPage() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const filtered = TEMPLATES.filter((t) => {
    if (filter === 'active') return t.isActive;
    if (filter === 'inactive') return !t.isActive;
    return true;
  });

  return (
    <div className="p-4 md:p-5 space-y-5" style={{ background: BG.page }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Workflow className="w-3.5 h-3.5" style={{ color: ALLOY }} />
            <span
              className="text-[9px] font-mono uppercase tracking-widest"
              style={{ color: ALLOY }}
            >
              Alloy
            </span>
          </div>
          <h1 className="text-lg font-bold tracking-tight" style={{ color: TEXT.primary }}>
            Workflow Templates
          </h1>
          <p className="text-[11px] mt-0.5" style={{ color: TEXT.secondary }}>
            Reusable workflow definitions across all packs
          </p>
        </div>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[9px] font-medium shrink-0"
          style={{ background: ALLOY_DIM, border: `1px solid ${ALLOY}30`, color: ALLOY }}
        >
          <Plus className="w-3 h-3" /> New Template
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: 'Active Templates',
            value: TEMPLATES.filter((t) => t.isActive).length,
            color: '#22c55e',
          },
          {
            label: 'Total Runs',
            value: TEMPLATES.reduce((s, t) => s + t.runCount, 0),
            color: ALLOY,
          },
          {
            label: 'Approval Required',
            value: TEMPLATES.filter((t) => t.requiresApproval).length,
            color: '#d4a054',
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-md p-3 text-center"
            style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
          >
            <div className="text-lg font-bold font-mono" style={{ color: s.color }}>
              {s.value}
            </div>
            <div className="text-[8px] uppercase tracking-widest" style={{ color: TEXT.muted }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-0.5" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
        {(['all', 'active', 'inactive'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-2 text-[9px] font-medium uppercase tracking-widest capitalize transition-colors"
            style={{
              color: filter === f ? TEXT.primary : TEXT.tertiary,
              borderBottom: filter === f ? `2px solid ${ALLOY}` : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Template list */}
      <div className="space-y-2.5">
        {filtered.map((t) => {
          const isExpanded = expanded === t.id;
          return (
            <div
              key={t.id}
              className="rounded-md overflow-hidden"
              style={{
                background: BG.surface,
                border: `1px solid ${BORDER.subtle}`,
                opacity: t.isActive ? 1 : 0.65,
              }}
            >
              <button
                onClick={() => setExpanded(isExpanded ? null : t.id)}
                className="w-full flex items-start gap-3 p-4 text-left hover:bg-white/[0.015] transition-colors"
              >
                <div
                  className="w-8 h-8 rounded flex items-center justify-center shrink-0"
                  style={{ background: `${t.packColor}10` }}
                >
                  <Workflow className="w-4 h-4" style={{ color: t.packColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest"
                      style={{ color: t.packColor, background: `${t.packColor}14` }}
                    >
                      {t.pack}
                    </span>
                    <TriggerBadge trigger={t.trigger} />
                    {t.requiresApproval && (
                      <span
                        className="text-[7px] px-1.5 py-0.5 rounded"
                        style={{ color: '#d4a054', background: 'rgba(212,160,84,0.08)' }}
                      >
                        Approval Required
                      </span>
                    )}
                    {!t.isActive && (
                      <span
                        className="text-[7px] px-1.5 py-0.5 rounded"
                        style={{ color: TEXT.muted, background: 'rgba(255,255,255,0.04)' }}
                      >
                        Inactive
                      </span>
                    )}
                  </div>
                  <h3 className="text-[12px] font-medium" style={{ color: TEXT.primary }}>
                    {t.name}
                  </h3>
                  <p
                    className="text-[9px] mt-0.5 leading-relaxed"
                    style={{ color: TEXT.secondary }}
                  >
                    {t.description}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-[8px]">
                    <span style={{ color: TEXT.muted }}>{t.runCount} runs</span>
                    <span style={{ color: TEXT.muted }}>Last: {t.lastRunAt}</span>
                    <span style={{ color: TEXT.muted }}>Approver: {t.approverRole}</span>
                  </div>
                </div>
                <ChevronRight
                  className={`w-3.5 h-3.5 shrink-0 mt-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  style={{ color: TEXT.muted }}
                />
              </button>

              {isExpanded && (
                <div className="px-4 pb-4" style={{ borderTop: `1px solid ${BORDER.subtle}` }}>
                  <div className="pt-3 space-y-3">
                    <div>
                      <span
                        className="text-[8px] uppercase tracking-widest font-medium mb-2 block"
                        style={{ color: TEXT.muted }}
                      >
                        Execution Steps
                      </span>
                      <div className="flex flex-col gap-1.5">
                        {t.steps.map((step, i) => (
                          <div key={i} className="flex items-center gap-2 text-[10px]">
                            <span
                              className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-mono font-bold shrink-0"
                              style={{ background: ALLOY_DIM, color: ALLOY }}
                            >
                              {i + 1}
                            </span>
                            <span style={{ color: TEXT.secondary }}>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        className="flex items-center gap-1 px-2.5 py-1 rounded text-[9px] font-medium"
                        style={{
                          background: ALLOY_DIM,
                          border: `1px solid ${ALLOY}30`,
                          color: ALLOY,
                        }}
                      >
                        <Play className="w-2.5 h-2.5" /> Run Now
                      </button>
                      <button
                        className="flex items-center gap-1 px-2.5 py-1 rounded text-[9px] font-medium"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: `1px solid ${BORDER.subtle}`,
                          color: TEXT.secondary,
                        }}
                      >
                        <Edit3 className="w-2.5 h-2.5" /> Edit
                      </button>
                      <button
                        className="flex items-center gap-1 px-2.5 py-1 rounded text-[9px] font-medium"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: `1px solid ${BORDER.subtle}`,
                          color: TEXT.tertiary,
                        }}
                      >
                        <Archive className="w-2.5 h-2.5" /> {t.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
