import { ArrowRight, Brain, FlaskConical, Network, Shield, Workflow, Zap } from 'lucide-react';
import type { Page } from '../lib/types';

const PILLARS = [
  {
    id: 'research' as Page,
    icon: FlaskConical,
    name: 'Parallel Research Swarm',
    tagline: 'Feynman-style parallel agents',
    description:
      'Four specialized agents — Gatherer, Peer-Reviewer, Drafter, Verifier — run concurrently on every query. The Verifier HEAD-checks every cited URL and kills unverifiable claims before output reaches you.',
    accent: 'var(--gi-accent-blue)',
    bullets: [
      'Gatherer discovers sources in real time',
      'Peer-Reviewer challenges assumptions',
      'Drafter synthesizes a coherent brief',
      'Verifier kills dead links & unverifiable claims',
    ],
  },
  {
    id: 'memory' as Page,
    icon: Brain,
    name: 'Persistent Memory + Skills',
    tagline: 'Cross-session memory fabric',
    description:
      'Long-lived memory built on the memory-fabric multi-tier store (working → session → episodic → semantic). The Skills Library adapts 50+ patterns from public repos into native NEXUS capabilities.',
    accent: 'var(--gi-accent-violet)',
    bullets: [
      'Facts, preferences, entities persist across sessions',
      'Automatic memory write from Research Swarm',
      '50+ adapted skills from 20+ public repos',
      'Original-vs-NEXUS diff for every skill',
    ],
  },
  {
    id: 'bridge' as Page,
    icon: Network,
    name: 'Universal Protocol Bridge',
    tagline: 'MCP · A2A · ACP · ANP',
    description:
      'A single adapter layer that speaks MCP, A2A, ACP, and ANP. Any tool or agent in any protocol can be called from one place — built as a thin façade over our tool-mesh/tool-registry.',
    accent: 'var(--gi-accent-green)',
    bullets: [
      'Normalizes tool definitions across 4 protocols',
      'Single invokeTool(protocol, toolId, args) API',
      'Internal loopback for A2A / ACP / ANP demos',
      'Live call tester with response inspector',
    ],
  },
  {
    id: 'orchestrator' as Page,
    icon: Workflow,
    name: 'Cross-App Orchestrator',
    tagline: 'Agent of agents',
    description:
      'Routes user intents to the right artifact — PARAGON, SEXTANT, DOMAINE, Pulse, Command, SZL Holdings, Carlota Jo, KORA, Prism Counsel, Imperium — via the API server and stitches multi-app workflows together.',
    accent: 'var(--gi-accent-amber)',
    bullets: [
      'Knows capabilities of every SZL artifact',
      'Produces an execution plan as a graph',
      'Parallel or sequential cross-app calls',
      '3 pre-baked example intents to explore',
    ],
  },
];

const STATS = [
  { label: 'Protocols Bridged', value: '4', icon: Network, color: 'var(--gi-accent-green)' },
  { label: 'Adapted Skills', value: '50+', icon: Zap, color: 'var(--gi-accent-blue)' },
  { label: 'Source Repos', value: '20+', icon: Brain, color: 'var(--gi-accent-violet)' },
  { label: 'Connected Apps', value: '10', icon: Workflow, color: 'var(--gi-accent-amber)' },
];

export default function Home({ navigate }: { navigate: (p: Page) => void }) {
  return (
    <div className="min-h-full bg-praxis-bg">
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,212,255,0.06) 0%, transparent 70%)',
          }}
        />
        <div className="relative max-w-5xl mx-auto px-8 py-16">
          <div className="mb-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-praxis-cyan/10 border border-praxis-cyan/30 flex items-center justify-center">
              <span className="text-praxis-cyan font-mono font-bold text-sm">N</span>
            </div>
            <span className="text-xs font-mono text-praxis-cyan tracking-widest uppercase">
              SZL Portfolio · Agentic Layer
            </span>
          </div>

          <h1 className="text-5xl font-bold tracking-tight mb-3 font-mono">
            <span className="text-praxis-cyan">NEXUS</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-2 font-mono tracking-wide">One of One.</p>
          <p className="text-base text-muted-foreground/70 max-w-2xl leading-relaxed mb-10">
            The unified agentic AI layer across the entire SZL portfolio. Parallel-verified
            research, persistent cross-session memory, protocol-agnostic tool calls, and
            cross-product orchestration — behind one console. No competitor ships all four.
          </p>

          <div className="grid grid-cols-4 gap-4 mb-12">
            {STATS.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="bg-praxis-surface border border-praxis rounded-lg p-4 text-center"
                  style={{ borderColor: `${s.color}22` }}
                >
                  <Icon className="w-5 h-5 mx-auto mb-2" style={{ color: s.color }} />
                  <div className="text-2xl font-mono font-bold" style={{ color: s.color }}>
                    {s.value}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 pb-8">
        <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-6">
          Four Pillars — Integrated
        </h2>
        <div className="grid grid-cols-2 gap-5">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.id}
                className="bg-praxis-surface border border-praxis rounded-xl p-6 cursor-pointer group transition-all hover:border-opacity-50 relative overflow-hidden"
                style={{
                  borderColor: `${pillar.accent}33`,
                  background: `linear-gradient(135deg, rgba(${hexToRgb(pillar.accent)},0.04) 0%, transparent 60%)`,
                }}
                onClick={() => navigate(pillar.id)}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${pillar.accent}15`,
                      border: `1px solid ${pillar.accent}33`,
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color: pillar.accent }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-0.5">{pillar.name}</h3>
                    <p className="text-[11px] font-mono" style={{ color: pillar.accent }}>
                      {pillar.tagline}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground shrink-0 transition-all group-hover:translate-x-0.5" />
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                  {pillar.description}
                </p>

                <ul className="space-y-1.5">
                  {pillar.bullets.map((b) => (
                    <li
                      key={b}
                      className="flex items-start gap-2 text-[11px] text-muted-foreground/70"
                    >
                      <span style={{ color: pillar.accent }} className="shrink-0 mt-0.5">
                        ▸
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-8 bg-praxis-surface border border-praxis-cyan/20 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-praxis-cyan" />
            <h3 className="text-sm font-semibold text-praxis-cyan">Why NEXUS is One of One</h3>
          </div>
          <div className="grid grid-cols-3 gap-6 text-xs text-muted-foreground leading-relaxed">
            <div>
              <strong className="text-foreground/80">Competitors ship these separately.</strong>{' '}
              Perplexity has web research. Mem.ai has memory. LangSmith has observability. Claude
              has skills. No one combines all four — especially not with cross-product
              orchestration.
            </div>
            <div>
              <strong className="text-foreground/80">Protocol-agnostic from day one.</strong> MCP is
              today's standard. A2A, ACP, and ANP are tomorrow's. NEXUS speaks all four through a
              unified façade so your tools stay callable no matter how the landscape shifts.
            </div>
            <div>
              <strong className="text-foreground/80">Memory that learns from research.</strong>{' '}
              Every Research Swarm run automatically extracts entities, claims, and preferences into
              the memory fabric. Your next run starts smarter. It compounds.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
