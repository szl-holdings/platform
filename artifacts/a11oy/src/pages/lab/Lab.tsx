import { Link } from 'wouter';
import {
  ArrowRight,
  Atom,
  Beaker,
  Brain,
  CircleDot,
  ExternalLink,
  FileText,
  GitBranch,
  Search,
  Sparkles,
} from 'lucide-react';
import type { ComponentType } from 'react';

const base = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');

interface LabCapability {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  praxisHash: string;
  nativePath?: string;
}

const CAPABILITIES: LabCapability[] = [
  {
    id: 'patterns',
    name: 'Pattern Atlas',
    tagline: 'Component & pattern catalog',
    description:
      'Curated catalog of governed UI patterns with live previews, tokens, and usage governance. The single source of truth for how the system speaks visually.',
    icon: Atom,
    praxisHash: 'patterns',
    nativePath: '/lab/patterns',
  },
  {
    id: 'prompt-registry',
    name: 'Prompt Registry',
    tagline: 'Versioned prompts · evals · promotions',
    description:
      'Every prompt is content-addressed, versioned, and evaluated before promotion. Inspect lineage, run regressions, and promote winners.',
    icon: FileText,
    praxisHash: 'prompt-registry',
    nativePath: '/lab/prompts',
  },
  {
    id: 'evals',
    name: 'Eval Console',
    tagline: 'Pulse evals · regression dashboard',
    description:
      'Live regression dashboard for prompts, models, and skills. Trigger pulse evals on demand, watch the deltas, and gate releases on the result.',
    icon: Beaker,
    praxisHash: 'eval-console',
    nativePath: '/lab/evals',
  },
  {
    id: 'skills',
    name: 'Skill Packs',
    tagline: 'Tool adapters & capability bundles',
    description:
      'Browse the skill catalog — finance.terminal, marketing.audit, seo.audit, and more — each governed by the same policy bridge as the rest of A11oy.',
    icon: Sparkles,
    praxisHash: 'skills',
  },
  {
    id: 'memory',
    name: 'Memory',
    tagline: 'Context store · embeddings · recall',
    description:
      'The shared memory layer — structured, embedded, and recallable. What the agents have learned, what they have forgotten, and why.',
    icon: Brain,
    praxisHash: 'memory',
  },
  {
    id: 'research',
    name: 'Research',
    tagline: 'Multi-source research console',
    description:
      'Govern multi-source research workflows: query plans, source attribution, and an audit trail of every claim that lands in a brief.',
    icon: Search,
    praxisHash: 'research',
  },
];

export function Lab() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-a11oy-text-ghost)] mb-1">
          Intelligence · Lab
        </div>
        <h1 className="text-2xl font-semibold text-[var(--color-a11oy-text)] tracking-tight flex items-center gap-3">
          <Beaker className="w-6 h-6 text-[var(--color-a11oy-gold)]" />
          A11oy Lab
        </h1>
        <p className="text-sm text-[var(--color-a11oy-text-sub)] mt-1 max-w-3xl">
          The agentic AI workbench — patterns, prompts, evals, skills, memory, and research.
          Every capability sits behind the same governance, observability, and provenance contract
          as the rest of A11oy. Native views are A11oy-themed; the deep tooling console (Praxis)
          remains available for power workflows.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--color-a11oy-border)] bg-[var(--color-a11oy-card)] px-5 py-4 flex items-center gap-3">
        <CircleDot className="w-3.5 h-3.5 text-[var(--color-a11oy-gold)] shrink-0" />
        <div className="flex-1">
          <p className="text-xs text-[var(--color-a11oy-text)]">
            Praxis is now ingested into A11oy as <span className="text-[var(--color-a11oy-gold)]">Lab</span>
          </p>
          <p className="text-[11px] text-[var(--color-a11oy-text-ghost)] mt-0.5">
            The deep Praxis console (17 surfaces) still lives at <code>/nexus</code> for
            engineering. A11oy Lab is the user-facing portal — curated, governed, and themed.
          </p>
        </div>
        <a
          href="/nexus/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-mono px-3 py-1.5 rounded-lg border border-[var(--color-a11oy-border)] text-[var(--color-a11oy-text-sub)] hover:text-[var(--color-a11oy-gold)] hover:border-[var(--color-a11oy-gold-dim)] transition-colors flex items-center gap-1.5"
        >
          Open Praxis console
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CAPABILITIES.map((cap) => {
          const Icon = cap.icon;
          return (
            <div
              key={cap.id}
              className="rounded-2xl border border-[var(--color-a11oy-border)] bg-[var(--color-a11oy-card)] p-5 flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-a11oy-gold-glow)] border border-[var(--color-a11oy-gold-dim)] flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[var(--color-a11oy-gold)]" />
                </div>
                {cap.nativePath && (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full border border-[var(--color-a11oy-gold-dim)] text-[var(--color-a11oy-gold)] bg-[var(--color-a11oy-gold-glow)]">
                    native
                  </span>
                )}
              </div>
              <p className="text-base font-semibold text-[var(--color-a11oy-text)]">{cap.name}</p>
              <p className="text-[11px] text-[var(--color-a11oy-text-ghost)] mt-0.5">
                {cap.tagline}
              </p>
              <p className="text-sm text-[var(--color-a11oy-text-sub)] mt-3 leading-relaxed flex-1">
                {cap.description}
              </p>
              <div className="mt-4 flex items-center gap-2">
                {cap.nativePath ? (
                  <Link
                    href={`${base}${cap.nativePath}`}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--color-a11oy-gold)] text-[var(--color-a11oy-navy)] text-xs font-semibold hover:bg-[var(--color-a11oy-gold-dim)] transition-colors"
                  >
                    Open
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                ) : (
                  <a
                    href={`/nexus/#${cap.praxisHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--color-a11oy-gold)] text-[var(--color-a11oy-navy)] text-xs font-semibold hover:bg-[var(--color-a11oy-gold-dim)] transition-colors"
                  >
                    Open in Praxis
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {cap.nativePath && (
                  <a
                    href={`/nexus/#${cap.praxisHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open in deep Praxis console"
                    className="px-2.5 py-2 rounded-lg border border-[var(--color-a11oy-border)] text-[var(--color-a11oy-text-ghost)] hover:text-[var(--color-a11oy-gold)] hover:border-[var(--color-a11oy-gold-dim)] transition-colors"
                  >
                    <GitBranch className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-[var(--color-a11oy-text-ghost)] font-mono text-center">
        a11oy lab v1 · backed by /api/nexus/* · /api/ai/prompts/* · /api/pulse-evals/*
      </p>
    </div>
  );
}
