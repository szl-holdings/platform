import { ArrowLeft, Brain, Eye, FileText, Lock, Shield, Target, Zap } from 'lucide-react';
import { Link } from 'wouter';

const FIVE_MOVES = [
  {
    icon: <Shield className="w-4 h-4 text-amber-300" />,
    title: 'Proof-chain on every card',
    body: 'Every decision card carries a replayable evidence record: model run, tool calls, adversarial checks, policy evaluation, and approver identity. No other vendor ships this end-to-end. Competitors offer observability dashboards; Lyte ships an attestation trail that survives a compliance review.',
  },
  {
    icon: <Target className="w-4 h-4 text-amber-300" />,
    title: 'Adversarial validation before promotion',
    body: "Six structured challenges run against every recommendation before it reaches a human: contradiction, stale-data, missing-evidence, policy-compliance, confidence-floor, and falsification. Cards that don't pass all six never reach the decision queue. Palantir AIP recommends; Lyte challenges before surfacing.",
  },
  {
    icon: <Lock className="w-4 h-4 text-amber-300" />,
    title: 'Constitution-as-code governance',
    body: "A machine-readable workspace constitution governs every card: who may approve, what autonomy mode is permitted, what confidence floor is required, and what policy rules apply per domain. This operationalises Anthropic's Constitutional AI principle as a per-tenant policy DSL — not a model-level filter but a full governance layer.",
  },
  {
    icon: <Brain className="w-4 h-4 text-amber-300" />,
    title: 'Entity-first ontology',
    body: 'Every decision card is anchored to a typed entity from the Entity Graph — company, vessel, asset, person, workflow. This produces a navigable evidence graph, not a flat log. Palantir Foundry pioneered entity-first operations; Lyte brings that model to mid-market operators without a six-figure contract.',
  },
  {
    icon: <Eye className="w-4 h-4 text-amber-300" />,
    title: 'Autonomy modes with operator control',
    body: 'Five modes — Auto-Execute, Exec + Approval, Draft, Recommend, Observe — let operators dial autonomy per domain and per card type. The mode is enforced at the policy engine, not just labelled in the UI. No competitor ships a multi-mode autonomy model that is both machine-enforced and human-auditable.',
  },
];

const COMPETITORS = [
  {
    name: 'Anthropic',
    strength: 'Constitutional AI, MCP, agentic patterns',
    gap: 'No per-tenant policy DSL, no proof-chain, no decision card system — must be assembled by the operator.',
  },
  {
    name: 'New Relic AI Monitoring',
    strength: 'Golden signals (latency, cost, tokens) on LLM calls',
    gap: 'Retrospective observability only — does not govern what is allowed to happen, no evidence graph, no approval workflow.',
  },
  {
    name: 'Palantir AIP',
    strength: 'Entity-first ontology, policy-gated action types',
    gap: 'Closed platform, government/defense sales motion, no adversarial validation before recommendation promotion.',
  },
  {
    name: 'Vertex AI Agent Builder',
    strength: 'Managed infra for multi-agent pipelines at scale',
    gap: 'Infrastructure play — no decision governance layer, no approval workflow, no proof-chain.',
  },
  {
    name: 'AWS Bedrock Agents',
    strength: 'IAM integration, guardrails, managed LLM access',
    gap: 'Cloud primitive — governance is IAM-only, no decision semantics, no audit trail beyond CloudTrail.',
  },
];

const ROADMAP = [
  {
    phase: 'Days 1–30',
    items: [
      'Decision Center GA (Postgres-backed, 12-card seed)',
      'Policy DSL v1 with domain-scoped rules',
      'Adversarial validation across all six check types',
      'Audit event stream per workspace',
    ],
  },
  {
    phase: 'Days 31–60',
    items: [
      'Real-time policy evaluation endpoint',
      'Entity Graph integration (cards anchor to ontology objects)',
      'Autonomy mode enforcement at API layer',
      'Webhook fan-out for approved decisions',
    ],
  },
  {
    phase: 'Days 61–90',
    items: [
      'Multi-workspace constitution editor',
      'AI-assisted card drafting with evidence pre-fill',
      'Investor-grade audit report export',
      'SOC 2 evidence collection hooks',
    ],
  },
];

export default function BriefPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-[10px] text-amber-400/50 hover:text-amber-300 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> Overview
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-amber-100 font-display">
                Lyte Differentiation Brief
              </h1>
              <p className="text-[11px] text-amber-400/50 mt-0.5">
                v1.0 · April 19, 2026 · Strategy — investor diligence, enterprise sales, engineering
                alignment
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="proof-badge">
            <Shield className="w-2.5 h-2.5" />
            LYTE-PROOF-BRIEF-v1
          </span>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="cockpit-panel p-5 border border-amber-500/15">
        <p className="text-[10px] font-mono text-amber-400/40 uppercase tracking-wider mb-3">
          Executive Summary
        </p>
        <p className="text-sm text-amber-300/80 leading-relaxed">
          Every "AI ops" vendor ships observability or automation. None ship governed decision
          infrastructure. Lyte's moat is the combination that none of them have packaged cleanly: a{' '}
          <strong className="text-amber-200">proof-chain on every card</strong>,{' '}
          <strong className="text-amber-200">adversarial validation before promotion</strong>,{' '}
          <strong className="text-amber-200">constitution-as-code governance</strong>,{' '}
          <strong className="text-amber-200">entity-first ontology</strong>, and{' '}
          <strong className="text-amber-200">autonomy modes</strong> that let operators dial between
          observe-only and auto-execute. This brief maps the competitive landscape, names the five
          moves only Lyte makes, and sets a 90-day roadmap for deepening the moat.
        </p>
      </div>

      {/* Five Moves */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <p className="text-xs font-semibold text-amber-100">Five Moves Only Lyte Makes</p>
        </div>
        <div className="space-y-2">
          {FIVE_MOVES.map((m, i) => (
            <div key={i} className="cockpit-panel p-4 border border-amber-500/10">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  {m.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-100 mb-1">{m.title}</p>
                  <p className="text-xs text-amber-400/70 leading-relaxed">{m.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Competitive Landscape */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Target className="w-3.5 h-3.5 text-amber-400" />
          <p className="text-xs font-semibold text-amber-100">Competitive Landscape</p>
        </div>
        <div className="cockpit-panel divide-y divide-amber-500/5">
          {COMPETITORS.map((c, i) => (
            <div key={i} className="px-4 py-3 grid grid-cols-[100px_1fr_1fr] gap-4">
              <p className="text-xs font-semibold text-amber-200 pt-0.5">{c.name}</p>
              <div>
                <p className="text-[10px] font-mono text-amber-400/40 uppercase mb-1">Strength</p>
                <p className="text-xs text-amber-400/70">{c.strength}</p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-amber-400/40 uppercase mb-1">
                  Lyte's Delta
                </p>
                <p className="text-xs text-amber-400/70">{c.gap}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 90-Day Roadmap */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Brain className="w-3.5 h-3.5 text-amber-400" />
          <p className="text-xs font-semibold text-amber-100">90-Day Moat Roadmap</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {ROADMAP.map((phase, i) => (
            <div key={i} className="cockpit-panel p-4 border border-amber-500/10">
              <p className="text-[10px] font-mono text-amber-400/40 uppercase tracking-wider mb-3">
                {phase.phase}
              </p>
              <ul className="space-y-1.5">
                {phase.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-amber-400/40 mt-1.5 shrink-0" />
                    <p className="text-xs text-amber-400/70 leading-snug">{item}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="cockpit-panel p-5 border border-amber-500/20 bg-amber-500/5 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-amber-100">See the proof in action</p>
          <p className="text-xs text-amber-400/50 mt-0.5">
            Every claim in this brief is backed by live decision cards in the Decision Center.
          </p>
        </div>
        <Link
          href="/decisions"
          className="px-4 py-2 rounded border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/15 text-xs font-semibold text-amber-300 transition-colors"
        >
          Open Decision Center →
        </Link>
      </div>
    </div>
  );
}
