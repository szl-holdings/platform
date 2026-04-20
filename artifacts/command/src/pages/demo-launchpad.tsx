import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  Crown,
  Database,
  Eye,
  GitBranch,
  Info,
  Layers,
  Lock,
  Map,
  Play,
  RotateCcw,
  Shield,
  Ship,
  Star,
  Target,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { useLocation } from 'wouter';

const BG = '#080c14';
const SURFACE = '#0c1018';
const ELEVATED = '#10141e';
const ACCENT = '#d4a054';
const ACCENT_DIM = 'rgba(212,160,84,0.15)';
const BORDER = 'rgba(255,255,255,0.06)';
const BORDER_ACCENT = 'rgba(212,160,84,0.25)';
const TEXT_PRIMARY = 'rgba(255,255,255,0.88)';
const TEXT_SECONDARY = 'rgba(255,255,255,0.5)';
const TEXT_MUTED = 'rgba(255,255,255,0.25)';

type Persona = 'ceo' | 'coo' | 'ciso' | 'investor' | 'analyst';
type DemoLength = 10 | 20 | 45;

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

interface DemoStop {
  id: string;
  label: string;
  domain: string;
  domainColor: string;
  description: string;
  href: string;
  external?: boolean;
  time: number;
  capability: string;
  tag?: string;
}

const ALL_STOPS: DemoStop[] = [
  {
    id: 'command-overview',
    label: 'Governed Decision Loop',
    domain: 'Command',
    domainColor: '#8b7ac8',
    description: 'Show the nine-step signal-to-action loop and live domain health.',
    href: `${BASE}/strategy`,
    time: 3,
    capability: 'Platform Architecture',
    tag: 'ANCHOR',
  },
  {
    id: 'lyte-signals',
    label: 'Signals Console',
    domain: 'Lyte',
    domainColor: ACCENT,
    description: '47 live signals surfaced, prioritized by impact and urgency.',
    href: '/lyte/signals',
    external: true,
    time: 3,
    capability: 'Signal Intelligence',
  },
  {
    id: 'lyte-decision-twin',
    label: 'Decision Twin',
    domain: 'Lyte',
    domainColor: ACCENT,
    description:
      'Simulate approve / delay / reroute / escalate with downstream impact and confidence bands.',
    href: '/lyte/decision-twin',
    external: true,
    time: 5,
    capability: 'Decision Simulation',
    tag: 'SIGNATURE',
  },
  {
    id: 'alloy-policy-compiler',
    label: 'Policy Compiler',
    domain: 'Alloy',
    domainColor: '#d4a054',
    description:
      'Plain-English → validated, versioned, rollback-able policy objects with workflow coverage.',
    href: `${BASE}/operations/alloy/policy-compiler`,
    time: 5,
    capability: 'Policy Governance',
    tag: 'SIGNATURE',
  },
  {
    id: 'terra-why-now',
    label: 'Why This Property Now',
    domain: 'Terra',
    domainColor: '#4ade80',
    description:
      'Ranked acquisition thesis combining liens, violations, ownership complexity, and neighborhood trend.',
    href: '/terra/why-this-property-now',
    external: true,
    time: 5,
    capability: 'Live Data Analysis',
    tag: 'SIGNATURE',
  },
  {
    id: 'terra-map',
    label: 'Property Intelligence Map',
    domain: 'Terra',
    domainColor: '#4ade80',
    description: 'NYC property opportunity map with distress scoring and ownership graph.',
    href: '/terra/property-map-page',
    external: true,
    time: 4,
    capability: 'Geospatial Intelligence',
  },
  {
    id: 'aegis-adversary',
    label: 'Adversary Narrative Engine',
    domain: 'Aegis',
    domainColor: '#f87171',
    description:
      'Readable incident storyline: attack chain, MITRE mapping, affected assets, confidence.',
    href: '/aegis/adversary-narrative-engine',
    external: true,
    time: 5,
    capability: 'Threat Intelligence',
    tag: 'SIGNATURE',
  },
  {
    id: 'vessels-voyage-risk',
    label: 'Voyage Risk Twin',
    domain: 'Vessels',
    domainColor: '#60a5fa',
    description:
      'Route-level risk: AIS gaps, sanctions, weather, voyage economics → explained risk + alternatives.',
    href: '/vessels/voyage-risk-twin',
    external: true,
    time: 5,
    capability: 'Maritime Intelligence',
    tag: 'SIGNATURE',
  },
  {
    id: 'carlota-concierge',
    label: 'White-Glove Command',
    domain: 'Carlota Jo',
    domainColor: '#9A7D52',
    description: 'VIP service lanes, preference memory, escalation playbooks, quiet activity log.',
    href: '/carlota-jo/concierge',
    external: true,
    time: 4,
    capability: 'Premium Operations',
    tag: 'SIGNATURE',
  },
  {
    id: 'alloy-audit',
    label: 'Alloy Audit Trail',
    domain: 'Alloy',
    domainColor: '#d4a054',
    description: 'Every decision, every agent action, every approval — immutable proof chain.',
    href: `${BASE}/operations/alloy/receipts`,
    time: 3,
    capability: 'Audit & Compliance',
  },
  {
    id: 'command-evidence',
    label: 'Evidence Explorer',
    domain: 'Command',
    domainColor: '#8b7ac8',
    description:
      'Cross-domain evidence registry — provenance, freshness, confidence on every claim.',
    href: `${BASE}/intelligence/evidence`,
    time: 3,
    capability: 'Evidence Provenance',
  },
  {
    id: 'prism-dashboard',
    label: 'PRISM Dashboard',
    domain: 'Command',
    domainColor: '#8b7ac8',
    description:
      'Pressure map, ownership drift, blocker board, and action debt across all domains.',
    href: `${BASE}/operations/prism`,
    time: 3,
    capability: 'Operational Overview',
  },
];

const PERSONA_CONFIGS: Record<
  Persona,
  {
    label: string;
    icon: React.ReactNode;
    color: string;
    description: string;
    focusIds: string[];
  }
> = {
  investor: {
    label: 'Investor',
    icon: <BarChart3 className="w-4 h-4" />,
    color: '#8b7ac8',
    description: 'Full platform story. Category, wedge, proof, differentiation.',
    focusIds: [
      'command-overview',
      'lyte-decision-twin',
      'alloy-policy-compiler',
      'terra-why-now',
      'aegis-adversary',
      'vessels-voyage-risk',
      'carlota-concierge',
    ],
  },
  ceo: {
    label: 'CEO',
    icon: <Star className="w-4 h-4" />,
    color: ACCENT,
    description: 'Strategy, outcomes, business impact, risk governance.',
    focusIds: [
      'command-overview',
      'lyte-signals',
      'lyte-decision-twin',
      'terra-why-now',
      'carlota-concierge',
      'alloy-audit',
    ],
  },
  coo: {
    label: 'COO',
    icon: <Activity className="w-4 h-4" />,
    color: '#4ade80',
    description: 'Operations, workflow automation, approval chains, execution.',
    focusIds: [
      'lyte-signals',
      'lyte-decision-twin',
      'alloy-policy-compiler',
      'prism-dashboard',
      'alloy-audit',
      'command-evidence',
    ],
  },
  ciso: {
    label: 'CISO',
    icon: <Shield className="w-4 h-4" />,
    color: '#f87171',
    description: 'Threat intelligence, incident response, compliance, audit.',
    focusIds: [
      'aegis-adversary',
      'alloy-audit',
      'command-evidence',
      'alloy-policy-compiler',
      'prism-dashboard',
    ],
  },
  analyst: {
    label: 'Analyst',
    icon: <Brain className="w-4 h-4" />,
    color: '#60a5fa',
    description: 'Data depth, evidence quality, signal intelligence, domain analysis.',
    focusIds: [
      'lyte-signals',
      'terra-why-now',
      'terra-map',
      'vessels-voyage-risk',
      'command-evidence',
      'aegis-adversary',
    ],
  },
};

const DEMO_PATHS: Record<DemoLength, { label: string; description: string; stopIds: string[] }> = {
  10: {
    label: '10-Minute',
    description: 'The investor hook. Platform story + two signature innovations.',
    stopIds: ['command-overview', 'lyte-decision-twin', 'alloy-policy-compiler'],
  },
  20: {
    label: '20-Minute',
    description: 'Full wedge. Lyte + Alloy + Terra as the live-data proof.',
    stopIds: [
      'command-overview',
      'lyte-signals',
      'lyte-decision-twin',
      'alloy-policy-compiler',
      'terra-why-now',
      'alloy-audit',
    ],
  },
  45: {
    label: '45-Minute',
    description:
      'Complete platform tour. All six domain packs, six innovations, full governance proof.',
    stopIds: [
      'command-overview',
      'lyte-signals',
      'lyte-decision-twin',
      'alloy-policy-compiler',
      'terra-why-now',
      'terra-map',
      'aegis-adversary',
      'vessels-voyage-risk',
      'carlota-concierge',
      'command-evidence',
      'alloy-audit',
    ],
  },
};

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        fontSize: 9,
        fontFamily: 'monospace',
        letterSpacing: '0.1em',
        color,
        background: `${color}18`,
        border: `1px solid ${color}40`,
        borderRadius: 4,
        padding: '2px 6px',
        fontWeight: 700,
      }}
    >
      {label}
    </span>
  );
}

function DomainBadge({ domain, color }: { domain: string; color: string }) {
  return (
    <span
      style={{
        fontSize: 9,
        fontFamily: 'monospace',
        color,
        background: `${color}12`,
        border: `1px solid ${color}30`,
        borderRadius: 4,
        padding: '2px 6px',
      }}
    >
      {domain.toUpperCase()}
    </span>
  );
}

function StopCard({
  stop,
  index,
  active,
  completed,
  onNavigate,
}: {
  stop: DemoStop;
  index: number;
  active: boolean;
  completed: boolean;
  onNavigate: (href: string, external?: boolean) => void;
}) {
  return (
    <div
      onClick={() => onNavigate(stop.href, stop.external)}
      style={{
        background: active
          ? `${stop.domainColor}10`
          : completed
            ? `rgba(255,255,255,0.02)`
            : SURFACE,
        border: `1px solid ${active ? stop.domainColor + '40' : completed ? 'rgba(255,255,255,0.08)' : BORDER}`,
        borderRadius: 10,
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        opacity: completed && !active ? 0.6 : 1,
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: completed
              ? `${stop.domainColor}20`
              : active
                ? `${stop.domainColor}25`
                : 'rgba(255,255,255,0.05)',
            border: `1px solid ${stop.domainColor}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: completed || active ? stop.domainColor : TEXT_MUTED,
            fontSize: 11,
            fontFamily: 'monospace',
            fontWeight: 700,
          }}
        >
          {completed ? <CheckCircle2 size={13} /> : String(index + 1).padStart(2, '0')}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{stop.label}</span>
            <DomainBadge domain={stop.domain} color={stop.domainColor} />
            {stop.tag && (
              <Tag
                label={stop.tag}
                color={stop.tag === 'SIGNATURE' ? stop.domainColor : '#c9a227'}
              />
            )}
          </div>
          <p style={{ fontSize: 11, color: TEXT_SECONDARY, marginTop: 4, lineHeight: 1.5 }}>
            {stop.description}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
            <span style={{ fontSize: 10, color: TEXT_MUTED, fontFamily: 'monospace' }}>
              <Clock
                size={10}
                style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }}
              />
              {stop.time} min
            </span>
            <span style={{ fontSize: 10, color: TEXT_MUTED }}>{stop.capability}</span>
          </div>
        </div>
        <ArrowRight size={14} style={{ color: TEXT_MUTED, flexShrink: 0, marginTop: 4 }} />
      </div>
    </div>
  );
}

export function DemoLaunchpad() {
  const [, navigate] = useLocation();
  const [selectedLength, setSelectedLength] = useState<DemoLength>(20);
  const [selectedPersona, setSelectedPersona] = useState<Persona>('investor');
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [resetKey, setResetKey] = useState(0);
  const [showReset, setShowReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetResult, setResetResult] = useState<null | {
    ops: Array<{ operation: string; status: string; detail?: string }>;
  }>(null);
  const resetResultTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const personaConfig = PERSONA_CONFIGS[selectedPersona];
  const demoPath = DEMO_PATHS[selectedLength];

  const effectiveStopIds =
    selectedPersona !== 'investor'
      ? demoPath.stopIds.filter((id) => personaConfig.focusIds.includes(id))
      : demoPath.stopIds;

  const activeStops = effectiveStopIds
    .map((id) => ALL_STOPS.find((s) => s.id === id)!)
    .filter(Boolean);
  const totalTime = activeStops.reduce((sum, s) => sum + s.time, 0);

  const handleNavigate = useCallback(
    (href: string, external?: boolean) => {
      if (external) {
        window.location.href = href;
      } else {
        navigate(href.replace(BASE, '') || '/');
      }
    },
    [navigate],
  );

  const handleReset = useCallback(async () => {
    setResetting(true);
    setShowReset(false);
    setResetResult(null);

    try {
      const res = await fetch('/api/demo/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        setResetResult({
          ops: [
            {
              operation: 'api_error',
              status: 'skipped',
              detail: `Server returned ${res.status} — UI state cleared locally`,
            },
          ],
        });
      } else {
        const data = await res.json();
        if (data?.operations) {
          setResetResult({ ops: data.operations });
        } else {
          setResetResult({
            ops: [
              {
                operation: 'reset_complete',
                status: 'done',
                detail: 'Demo state reset — all stops, persona, and track cleared',
              },
            ],
          });
        }
      }
    } catch {
      setResetResult({
        ops: [
          {
            operation: 'server_unreachable',
            status: 'skipped',
            detail: 'API server not reachable — UI state cleared locally',
          },
        ],
      });
    }

    setCompletedIds(new Set());
    setSelectedPersona('investor');
    setSelectedLength(20);
    setResetKey((k) => k + 1);
    setResetting(false);

    if (resetResultTimer.current) clearTimeout(resetResultTimer.current);
    resetResultTimer.current = setTimeout(() => setResetResult(null), 5000);
  }, []);

  const markCompleted = useCallback((id: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: BG,
        color: TEXT_PRIMARY,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: ACCENT_DIM,
                  border: `1px solid ${BORDER_ACCENT}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Play size={16} color={ACCENT} />
              </div>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: TEXT_PRIMARY, margin: 0 }}>
                  Demo Launchpad
                </h1>
                <p style={{ fontSize: 11, color: TEXT_MUTED, margin: 0, fontFamily: 'monospace' }}>
                  SZL HOLDINGS — GOVERNED INTELLIGENCE PLATFORM
                </p>
              </div>
            </div>
            <p
              style={{
                fontSize: 13,
                color: TEXT_SECONDARY,
                maxWidth: 580,
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              A single presenter control surface for investor demos. Select your audience, choose a
              time track, and launch each stop in sequence. One-click reset returns to clean state.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {showReset && (
              <div
                style={{
                  background: ELEVATED,
                  border: `1px solid rgba(239,68,68,0.3)`,
                  borderRadius: 10,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  position: 'absolute',
                  right: 24,
                  top: 80,
                  zIndex: 100,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                }}
              >
                <AlertTriangle size={14} color="#f87171" />
                <span style={{ fontSize: 12, color: TEXT_PRIMARY }}>Reset all progress?</span>
                <button
                  onClick={handleReset}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#f87171',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 6,
                    padding: '4px 10px',
                    cursor: 'pointer',
                  }}
                >
                  Reset
                </button>
                <button
                  onClick={() => setShowReset(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: TEXT_MUTED,
                    padding: 2,
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            )}
            <button
              onClick={() => setShowReset(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                color: TEXT_SECONDARY,
                background: ELEVATED,
                border: `1px solid ${BORDER}`,
                borderRadius: 8,
                padding: '8px 14px',
                cursor: 'pointer',
                fontFamily: 'monospace',
              }}
            >
              <RotateCcw size={13} />
              Reset
            </button>
          </div>
        </div>

        {/* Reset feedback */}
        {(resetting || resetResult) && (
          <div
            style={{
              background: resetting ? ELEVATED : 'rgba(0,0,0,0.85)',
              border: `1px solid ${resetting ? BORDER : 'rgba(52,211,153,0.3)'}`,
              borderRadius: 10,
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {resetting ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <RotateCcw
                  size={13}
                  color={ACCENT}
                  style={{ animation: 'spin 1s linear infinite' }}
                />
                <span style={{ fontSize: 12, color: TEXT_SECONDARY, fontFamily: 'monospace' }}>
                  Resetting demo state…
                </span>
              </div>
            ) : (
              resetResult && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={13} color="#34d399" />
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#34d399',
                        fontFamily: 'monospace',
                      }}
                    >
                      RESET COMPLETE — Vantex scenario fresh
                    </span>
                  </div>
                  {resetResult.ops.map((op, i) => (
                    <div
                      key={i}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 8, paddingLeft: 20 }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          color: op.status === 'done' ? '#34d399' : TEXT_MUTED,
                          fontFamily: 'monospace',
                          minWidth: 40,
                          marginTop: 1,
                        }}
                      >
                        {op.status.toUpperCase()}
                      </span>
                      <span style={{ fontSize: 10, color: TEXT_MUTED, fontFamily: 'monospace' }}>
                        {op.detail ?? op.operation}
                      </span>
                    </div>
                  ))}
                </>
              )
            )}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
          {/* Left: Persona + Time + Stops */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Persona Selector */}
            <div
              style={{
                background: SURFACE,
                border: `1px solid ${BORDER}`,
                borderRadius: 12,
                padding: 20,
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontFamily: 'monospace',
                  color: TEXT_MUTED,
                  letterSpacing: '0.12em',
                  marginBottom: 12,
                }}
              >
                AUDIENCE PERSONA
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(
                  Object.entries(PERSONA_CONFIGS) as [Persona, (typeof PERSONA_CONFIGS)[Persona]][]
                ).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedPersona(key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      fontSize: 12,
                      fontWeight: 600,
                      color: selectedPersona === key ? cfg.color : TEXT_SECONDARY,
                      background: selectedPersona === key ? `${cfg.color}15` : 'transparent',
                      border: `1px solid ${selectedPersona === key ? cfg.color + '40' : BORDER}`,
                      borderRadius: 8,
                      padding: '8px 14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ color: selectedPersona === key ? cfg.color : TEXT_MUTED }}>
                      {cfg.icon}
                    </span>
                    {cfg.label}
                  </button>
                ))}
              </div>
              {selectedPersona !== 'investor' && (
                <p style={{ fontSize: 11, color: TEXT_SECONDARY, marginTop: 10 }}>
                  {personaConfig.description}
                </p>
              )}
            </div>

            {/* Time Track */}
            <div
              style={{
                background: SURFACE,
                border: `1px solid ${BORDER}`,
                borderRadius: 12,
                padding: 20,
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontFamily: 'monospace',
                  color: TEXT_MUTED,
                  letterSpacing: '0.12em',
                  marginBottom: 12,
                }}
              >
                DEMO TRACK
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {([10, 20, 45] as DemoLength[]).map((len) => (
                  <button
                    key={len}
                    onClick={() => setSelectedLength(len)}
                    style={{
                      background: selectedLength === len ? ACCENT_DIM : 'transparent',
                      border: `1px solid ${selectedLength === len ? BORDER_ACCENT : BORDER}`,
                      borderRadius: 10,
                      padding: '14px 12px',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Clock size={12} color={selectedLength === len ? ACCENT : TEXT_MUTED} />
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: selectedLength === len ? ACCENT : TEXT_PRIMARY,
                        }}
                      >
                        {DEMO_PATHS[len].label}
                      </span>
                    </div>
                    <p style={{ fontSize: 10, color: TEXT_SECONDARY, margin: 0, lineHeight: 1.4 }}>
                      {DEMO_PATHS[len].description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Stop Sequence */}
            <div
              style={{
                background: SURFACE,
                border: `1px solid ${BORDER}`,
                borderRadius: 12,
                padding: 20,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: 10,
                      fontFamily: 'monospace',
                      color: TEXT_MUTED,
                      letterSpacing: '0.12em',
                      margin: 0,
                    }}
                  >
                    STOP SEQUENCE
                  </p>
                  <p style={{ fontSize: 11, color: TEXT_SECONDARY, margin: '4px 0 0' }}>
                    {activeStops.length} stops · ~{totalTime} minutes total · {completedIds.size}{' '}
                    completed
                  </p>
                </div>
                {completedIds.size > 0 && (
                  <div
                    style={{
                      fontSize: 10,
                      fontFamily: 'monospace',
                      color: '#4ade80',
                      background: 'rgba(74,222,128,0.1)',
                      border: '1px solid rgba(74,222,128,0.25)',
                      borderRadius: 6,
                      padding: '4px 10px',
                    }}
                  >
                    {Math.round((completedIds.size / activeStops.length) * 100)}% THROUGH
                  </div>
                )}
              </div>

              <div key={resetKey} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activeStops.map((stop, i) => (
                  <div key={stop.id} onClick={() => markCompleted(stop.id)}>
                    <StopCard
                      stop={stop}
                      index={i}
                      active={i === completedIds.size && !completedIds.has(stop.id)}
                      completed={completedIds.has(stop.id)}
                      onNavigate={handleNavigate}
                    />
                  </div>
                ))}
              </div>

              {activeStops.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: TEXT_MUTED }}>
                  <Info size={20} style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 12 }}>No stops match this persona + time combination.</p>
                  <p style={{ fontSize: 11 }}>
                    Try switching to Investor persona for the full path.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Quick-Access Panel + Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Platform Status */}
            <div
              style={{
                background: SURFACE,
                border: `1px solid ${BORDER}`,
                borderRadius: 12,
                padding: 18,
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontFamily: 'monospace',
                  color: TEXT_MUTED,
                  letterSpacing: '0.12em',
                  marginBottom: 14,
                }}
              >
                PLATFORM STATUS
              </p>
              {[
                {
                  label: 'Lyte — Decision Intelligence',
                  color: '#4ade80',
                  href: '/lyte/',
                  status: 'LIVE',
                },
                {
                  label: 'Alloy — Policy Compiler',
                  color: '#4ade80',
                  href: `${BASE}/operations/alloy/policy-compiler`,
                  status: 'LIVE',
                },
                {
                  label: 'Terra — Real Estate Intelligence',
                  color: '#4ade80',
                  href: '/terra/',
                  status: 'LIVE',
                },
                {
                  label: 'Aegis — Cyber Resilience',
                  color: '#4ade80',
                  href: '/aegis/',
                  status: 'LIVE',
                },
                {
                  label: 'Vessels — Maritime Intelligence',
                  color: '#4ade80',
                  href: '/vessels/',
                  status: 'LIVE',
                },
                {
                  label: 'Carlota Jo — Concierge',
                  color: '#4ade80',
                  href: '/carlota-jo/',
                  status: 'LIVE',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  onClick={() => (window.location.href = item.href)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '7px 0',
                    borderBottom: `1px solid ${BORDER}`,
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: item.color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ flex: 1, fontSize: 11, color: TEXT_SECONDARY, lineHeight: 1.3 }}>
                    {item.label}
                  </span>
                  <span style={{ fontSize: 9, fontFamily: 'monospace', color: item.color }}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Six Signature Innovations */}
            <div
              style={{
                background: SURFACE,
                border: `1px solid ${BORDER}`,
                borderRadius: 12,
                padding: 18,
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontFamily: 'monospace',
                  color: TEXT_MUTED,
                  letterSpacing: '0.12em',
                  marginBottom: 14,
                }}
              >
                SIX SIGNATURE INNOVATIONS
              </p>
              {[
                {
                  label: 'Decision Twin',
                  domain: 'Lyte',
                  color: ACCENT,
                  href: '/lyte/decision-twin',
                },
                {
                  label: 'Policy Compiler',
                  domain: 'Alloy',
                  color: ACCENT,
                  href: `${BASE}/operations/alloy/policy-compiler`,
                },
                {
                  label: 'Why This Property Now',
                  domain: 'Terra',
                  color: '#4ade80',
                  href: '/terra/why-this-property-now',
                },
                {
                  label: 'Adversary Narrative Engine',
                  domain: 'Aegis',
                  color: '#f87171',
                  href: '/aegis/adversary-narrative-engine',
                },
                {
                  label: 'Voyage Risk Twin',
                  domain: 'Vessels',
                  color: '#60a5fa',
                  href: '/vessels/voyage-risk-twin',
                },
                {
                  label: 'White-Glove Command',
                  domain: 'Carlota Jo',
                  color: '#9A7D52',
                  href: '/carlota-jo/concierge',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  onClick={() => {
                    if (item.href.startsWith(BASE)) {
                      navigate(item.href.replace(BASE, '') || '/');
                    } else {
                      window.location.href = item.href;
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 0',
                    borderBottom: `1px solid ${BORDER}`,
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: item.color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ flex: 1, fontSize: 11, color: TEXT_PRIMARY }}>{item.label}</span>
                  <span style={{ fontSize: 9, fontFamily: 'monospace', color: item.color }}>
                    {item.domain.toUpperCase()}
                  </span>
                  <ChevronRight size={11} style={{ color: TEXT_MUTED }} />
                </div>
              ))}
            </div>

            {/* Demo Scenario */}
            <div
              style={{
                background: ELEVATED,
                border: `1px solid ${BORDER_ACCENT}`,
                borderRadius: 12,
                padding: 18,
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontFamily: 'monospace',
                  color: ACCENT,
                  letterSpacing: '0.12em',
                  marginBottom: 10,
                }}
              >
                DEMO SCENARIO — LABELED
              </p>
              <p style={{ fontSize: 11, color: TEXT_SECONDARY, lineHeight: 1.6, margin: 0 }}>
                All data in this demo is seeded scenario data. The central narrative is the{' '}
                <strong style={{ color: TEXT_PRIMARY }}>Vantex Acquisition</strong> — a $4.2M /
                47-day stalled approval chain used to demonstrate the governed decision loop
                end-to-end.
              </p>
              <div
                style={{
                  marginTop: 12,
                  padding: '8px 12px',
                  background: 'rgba(212,160,84,0.06)',
                  border: `1px solid ${BORDER_ACCENT}`,
                  borderRadius: 6,
                  fontSize: 10,
                  fontFamily: 'monospace',
                  color: ACCENT,
                }}
              >
                SCENARIO: LYTE-SEED-v2 · Vantex Corp Acquisition Decision Chain
              </div>
            </div>

            {/* Presenter Notes */}
            <div
              style={{
                background: SURFACE,
                border: `1px solid ${BORDER}`,
                borderRadius: 12,
                padding: 18,
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontFamily: 'monospace',
                  color: TEXT_MUTED,
                  letterSpacing: '0.12em',
                  marginBottom: 12,
                }}
              >
                PRESENTER NOTES
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  'Open this page, then launch each stop — mark complete as you go.',
                  'Decision Twin runs in full simulation mode — no live write-back.',
                  'Policy Compiler shows real compilation with sandbox validation.',
                  'Terra data is NYC Open Data (city-provided, CC0 licensed).',
                  'Aegis incidents are labeled SCENARIO throughout all views.',
                  'Use Reset to restore clean state before a fresh audience.',
                ].map((note, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: 'monospace',
                        color: TEXT_MUTED,
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p style={{ fontSize: 11, color: TEXT_SECONDARY, margin: 0, lineHeight: 1.5 }}>
                      {note}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
