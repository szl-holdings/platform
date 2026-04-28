import { AnimatePresence, m } from 'framer-motion';
import {
  BarChart3,
  BookOpen,
  Brain,
  FileCheck,
  Layers,
  Radio,
  ShieldCheck,
  Target,
  Zap,
} from 'lucide-react';
import { useCallback, useState } from 'react';

const LOOP_STEPS = [
  {
    n: '01',
    label: 'Signal',
    icon: Radio,
    color: '#4d8fcc',
    body: 'Risk indicators, anomalies, and threshold breaches are detected, normalized, and routed by the Event Fabric — cross-domain context and correlation ID attached.',
    primitives: ['event-fabric'],
  },
  {
    n: '02',
    label: 'Context',
    icon: Layers,
    color: '#8b5cf6',
    body: 'Cross-domain enrichment via Event Fabric. A sanctions alert in SEXTANT triggers a legal flag in Counsel, a risk entry in KORA — full context assembled before any recommendation.',
    primitives: ['event-fabric', 'outcome-graph'],
  },
  {
    n: '03',
    label: 'Recommendation',
    icon: Brain,
    color: '#ec4899',
    body: 'An AI agent proposes an action with source citations, confidence score, and full provenance. No opaque verdicts. Every output traceable to its evidence.',
    primitives: ['proof-chain'],
  },
  {
    n: '04',
    label: 'Simulation',
    icon: BarChart3,
    color: '#f59e0b',
    body: 'The Monte Carlo engine models risk before action. Operators see expected outcomes, confidence intervals, and the variables that matter most — before committing.',
    primitives: ['simulation'],
  },
  {
    n: '05',
    label: 'Policy',
    icon: ShieldCheck,
    color: '#10b981',
    body: 'Covenant Policy enforces who can approve and what conditions apply — at the platform layer, not the UI. Approval gates are non-delegatable and audit-logged.',
    primitives: ['covenant-policy'],
  },
  {
    n: '06',
    label: 'Execution',
    icon: Zap,
    color: '#6366f1',
    body: 'Counsel orchestrates the approved action as a durable, multi-step process with checkpoint recovery and agent coordination. Failures are handled — not silently dropped.',
    primitives: ['workflow-engine'],
  },
  {
    n: '07',
    label: 'Proof',
    icon: FileCheck,
    color: '#14b8a6',
    body: 'The Proof Chain records the complete trail: signal, recommendation, simulation, policy decision, approval, execution. Immutable, queryable, and ready for audit.',
    primitives: ['proof-chain'],
  },
  {
    n: '08',
    label: 'Outcome',
    icon: Target,
    color: '#ef4444',
    body: 'The Outcome Graph records the real-world result. Was the action effective? The data feeds back into AI confidence calibration and simulation model accuracy.',
    primitives: ['outcome-graph'],
  },
  {
    n: '09',
    label: 'Learning',
    icon: BookOpen,
    color: '#f97316',
    body: 'Historical outcomes feed back into simulation models and agent confidence calibration. Every governed decision makes the next one sharper. The loop closes.',
    primitives: ['outcome-graph', 'simulation'],
  },
];

const PRIMITIVES: Record<string, { label: string; color: string }> = {
  'event-fabric': { label: 'Event Fabric', color: '#4d8fcc' },
  'outcome-graph': { label: 'Outcome Graph', color: '#ef4444' },
  'proof-chain': { label: 'Proof Chain', color: '#14b8a6' },
  simulation: { label: 'Decision Simulation', color: '#f59e0b' },
  'covenant-policy': { label: 'Covenant Policy', color: '#10b981' },
  'workflow-engine': { label: 'Workflow Engine', color: '#6366f1' },
};

const CX = 250;
const CY = 250;
const RING_R = 188;
const NODE_R = 22;
const STEPS = 9;

function stepAngle(i: number): number {
  return (i / STEPS) * 2 * Math.PI - Math.PI / 2;
}

function stepXY(i: number): { x: number; y: number } {
  const angle = stepAngle(i);
  return {
    x: CX + RING_R * Math.cos(angle),
    y: CY + RING_R * Math.sin(angle),
  };
}

export function GovernedLoopViz() {
  const [active, setActive] = useState<number>(0);

  const handleStep = useCallback((i: number) => {
    setActive(i);
  }, []);

  const step = LOOP_STEPS[active];
  const Icon = step.icon;

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2rem',
          alignItems: 'start',
        }}
        className="loop-grid"
      >
        {/* SVG Loop Diagram */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '500px', margin: '0 auto' }}>
          <svg
            viewBox="0 0 500 500"
            style={{ width: '100%', height: 'auto', overflow: 'visible' }}
            aria-label="Nine-step governance loop diagram"
            role="img"
          >
            <defs>
              <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background ring track */}
            <circle
              cx={CX}
              cy={CY}
              r={RING_R}
              fill="none"
              stroke="hsla(0,0%,100%,0.05)"
              strokeWidth="1"
            />

            {/* Arc segments between nodes */}
            {LOOP_STEPS.map((_s, i) => {
              const next = (i + 1) % STEPS;
              const from = stepXY(i);
              const to = stepXY(next);
              const isActive = i === active || next === active;
              const activeColor = i === active ? LOOP_STEPS[i].color : LOOP_STEPS[next].color;
              return (
                <line
                  key={`arc-${i}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={isActive ? activeColor : 'hsla(0,0%,100%,0.08)'}
                  strokeWidth={isActive ? 1.5 : 1}
                  style={{ transition: 'stroke 0.3s ease, stroke-width 0.3s ease' }}
                />
              );
            })}

            {/* Step nodes */}
            {LOOP_STEPS.map((s, i) => {
              const { x, y } = stepXY(i);
              const isActive = i === active;
              const _StepIcon = s.icon;
              return (
                <g
                  key={s.n}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleStep(i)}
                  onMouseEnter={() => handleStep(i)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Step ${s.n}: ${s.label}`}
                  aria-pressed={isActive}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleStep(i);
                    }
                  }}
                >
                  {/* Glow ring for active */}
                  {isActive && (
                    <circle
                      cx={x}
                      cy={y}
                      r={NODE_R + 8}
                      fill="none"
                      stroke={s.color}
                      strokeWidth="1"
                      opacity="0.25"
                      filter="url(#glow)"
                    />
                  )}
                  {/* Node background */}
                  <circle
                    cx={x}
                    cy={y}
                    r={NODE_R}
                    fill={isActive ? s.color : 'hsl(210,12%,8%)'}
                    stroke={isActive ? s.color : 'hsla(0,0%,100%,0.1)'}
                    strokeWidth={isActive ? 0 : 1}
                    style={{ transition: 'fill 0.25s ease, stroke 0.25s ease' }}
                  />
                  {/* Step number */}
                  <text
                    x={x}
                    y={y - 4}
                    textAnchor="middle"
                    fill={isActive ? 'hsl(210,12%,6%)' : s.color}
                    fontSize="7"
                    fontWeight="700"
                    fontFamily="'JetBrains Mono', monospace"
                    style={{ transition: 'fill 0.25s ease' }}
                  >
                    {s.n}
                  </text>
                  {/* Step label short */}
                  <text
                    x={x}
                    y={y + 7}
                    textAnchor="middle"
                    fill={isActive ? 'hsl(210,12%,6%)' : 'hsl(38,8%,78%)'}
                    fontSize="6.5"
                    fontWeight="600"
                    style={{ transition: 'fill 0.25s ease' }}
                  >
                    {s.label}
                  </text>
                </g>
              );
            })}

            {/* Center label */}
            <g>
              <text
                x={CX}
                y={CY - 10}
                textAnchor="middle"
                fill="hsl(38,8%,50%)"
                fontSize="9"
                fontWeight="600"
                letterSpacing="0.06em"
                fontFamily="sans-serif"
              >
                GOVERNED
              </text>
              <text
                x={CX}
                y={CY + 8}
                textAnchor="middle"
                fill="hsl(38,8%,50%)"
                fontSize="9"
                fontWeight="600"
                letterSpacing="0.06em"
              >
                DECISION LOOP
              </text>
              <circle
                cx={CX}
                cy={CY}
                r={44}
                fill="none"
                stroke="hsla(0,0%,100%,0.04)"
                strokeWidth="1"
                strokeDasharray="3 5"
              />
            </g>
          </svg>
        </div>

        {/* Detail Panel */}
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingTop: '0.5rem' }}
        >
          <AnimatePresence mode="wait">
            <m.div
              key={active}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Step header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.875rem',
                  marginBottom: '1rem',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: `${step.color}18`,
                    border: `1px solid ${step.color}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} style={{ color: step.color }} aria-hidden="true" />
                </div>
                <div>
                  <p
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: step.color,
                      marginBottom: '2px',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    Step {step.n}
                  </p>
                  <h3
                    style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: 'hsl(38,12%,94%)',
                      letterSpacing: '-0.02em',
                      lineHeight: 1.1,
                    }}
                  >
                    {step.label}
                  </h3>
                </div>
              </div>

              {/* Description */}
              <p
                style={{
                  fontSize: '0.9375rem',
                  lineHeight: 1.7,
                  color: 'hsl(210,5%,60%)',
                  marginBottom: '1.5rem',
                }}
              >
                {step.body}
              </p>

              {/* Primitive connections */}
              <div>
                <p
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'hsl(210,5%,38%)',
                    marginBottom: '0.625rem',
                  }}
                >
                  Platform primitive
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {step.primitives.map((pid) => {
                    const p = PRIMITIVES[pid];
                    return (
                      <span
                        key={pid}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          background: `${p.color}12`,
                          border: `1px solid ${p.color}35`,
                          fontSize: '12px',
                          fontWeight: 600,
                          color: p.color,
                          letterSpacing: '0.01em',
                        }}
                      >
                        <span
                          style={{
                            width: '5px',
                            height: '5px',
                            borderRadius: '50%',
                            background: p.color,
                            flexShrink: 0,
                          }}
                          aria-hidden="true"
                        />
                        {p.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            </m.div>
          </AnimatePresence>

          {/* Step navigator */}
          <div style={{ borderTop: '1px solid hsla(0,0%,100%,0.06)', paddingTop: '1.25rem' }}>
            <p
              style={{
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'hsl(210,5%,32%)',
                marginBottom: '0.75rem',
              }}
            >
              All steps
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
              {LOOP_STEPS.map((s, i) => {
                const isActive = i === active;
                return (
                  <button
                    key={s.n}
                    onClick={() => handleStep(i)}
                    style={{
                      padding: '6px 8px',
                      borderRadius: '4px',
                      background: isActive ? `${s.color}18` : 'transparent',
                      border: `1px solid ${isActive ? `${s.color}40` : 'hsla(0,0%,100%,0.06)'}`,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.18s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                    aria-label={`View step ${s.n}: ${s.label}`}
                    aria-pressed={isActive}
                  >
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        color: isActive ? s.color : 'hsl(210,5%,38%)',
                        fontFamily: "'JetBrains Mono', monospace",
                        lineHeight: 1,
                      }}
                    >
                      {s.n}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: isActive ? 'hsl(38,12%,88%)' : 'hsl(210,5%,50%)',
                      }}
                    >
                      {s.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* All 6 primitives reference strip */}
      <div
        style={{
          marginTop: '2.5rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid hsla(0,0%,100%,0.05)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.625rem',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'hsl(210,5%,32%)',
            flexShrink: 0,
            marginRight: '0.25rem',
          }}
        >
          Primitives:
        </span>
        {Object.entries(PRIMITIVES).map(([id, p]) => {
          const isHighlighted = step.primitives.includes(id);
          return (
            <span
              key={id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 9px',
                borderRadius: '4px',
                background: isHighlighted ? `${p.color}14` : 'transparent',
                border: `1px solid ${isHighlighted ? `${p.color}38` : 'hsla(0,0%,100%,0.07)'}`,
                fontSize: '11px',
                fontWeight: isHighlighted ? 600 : 400,
                color: isHighlighted ? p.color : 'hsl(210,5%,38%)',
                transition: 'all 0.22s ease',
              }}
            >
              {p.label}
            </span>
          );
        })}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .loop-grid {
            grid-template-columns: 1fr !important;
          }
        }
        svg g[role="button"]:focus-visible circle:nth-child(1),
        svg g[role="button"]:focus-visible circle:first-of-type {
          outline: none;
        }
        svg g[role="button"]:focus-visible {
          outline: none;
        }
        svg g[role="button"]:focus-visible > circle[r="22"] {
          stroke: hsla(38,60%,80%,0.9);
          stroke-width: 2;
        }
      `}</style>
    </div>
  );
}
