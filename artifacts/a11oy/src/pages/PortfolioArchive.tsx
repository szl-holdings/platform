/**
 * A11oy — Portfolio Archive.
 *
 * The honest registry of consolidated SZL portfolio assets.
 *
 * As of the consolidation pass (2026-04-29), the live SZL surface
 * is intentionally narrowed to seven products + the shared
 * `api-server` backend + the canvas `mockup-sandbox` design surface.
 * Everything below was archived rather than consolidated into a11oy
 * because (a) merging would dilute a11oy's brand-orchestration purpose
 * and (b) the archived assets do not carry a feature that isn't already
 * better represented in the live set. They are preserved verbatim under
 * `.archived/artifacts/<slug>/` for audit and resurrection.
 *
 * Live set (kept):
 *   - amaru (conduit)   — replay-grade governed loop visible surface
 *   - a11oy             — brand orchestration layer (this app)
 *   - sentra            — cyber resilience + replay attestation
 *   - counsel           — legal matter command
 *   - terra             — real-estate intelligence
 *   - carlota-jo        — consulting + advisory
 *   - vessels           — maritime intelligence
 *   - api-server        — shared backend (kept; live frontends depend on it)
 *   - mockup-sandbox    — workspace canvas tool (kept; not a product)
 */

import { useMemo, useState } from 'react';
import {
  Archive,
  Box,
  ExternalLink,
  Filter,
  GitCommitVertical,
  HardDrive,
  Info,
  Layers,
  ShieldCheck,
} from 'lucide-react';

type ArchiveKind = 'web' | 'mobile' | 'video' | 'orphan';

interface ArchivedArtifact {
  slug: string;
  title: string;
  kind: ArchiveKind;
  archivedPath: string;
  description: string;
  archiveReason: string;
  consolidationNote: string;
  approxSize: string;
}

const ARCHIVED: ArchivedArtifact[] = [
  {
    slug: 'szl-holdings',
    title: 'SZL Holdings Dashboard',
    kind: 'web',
    archivedPath: '.archived/artifacts/szl-holdings/',
    description:
      'The original parent-company dashboard. Investor-facing pages, technical-proof pages, and aggregate scorecards across the whole portfolio.',
    archiveReason:
      'Conduit (Amaru) now carries the canonical replay-grade proof surface; Sentra carries the attestation surface; A11oy carries the orchestration surface. The holdings dashboard duplicated the aggregation without adding kernel-grade evidence.',
    consolidationNote:
      'Not folded into a11oy. The valuable parts (proof, attestation, governance) already exist in the live trio in their canonical form.',
    approxSize: '12 MB',
  },
  {
    slug: 'szl-holdings-mobile',
    title: 'SZL Holdings — Mobile Command',
    kind: 'mobile',
    archivedPath: '.archived/artifacts/szl-holdings-mobile/',
    description:
      'Expo (React Native) companion app to the holdings dashboard. Push-notification triage for governance events on the go.',
    archiveReason:
      'Different platform (mobile) without an active mobile-first user. Consolidating an Expo bundle into a Vite web app is not technically meaningful — they share no runtime.',
    consolidationNote:
      'Not folded into a11oy. Preserved verbatim for resurrection if a mobile surface becomes a real requirement.',
    approxSize: '6 MB',
  },
  {
    slug: 'command',
    title: 'Unified Command',
    kind: 'web',
    archivedPath: '.archived/artifacts/command/',
    description:
      'A "command center" experiment with a triage inbox, SLO-management page, and routing dashboards. Largest of the archived set.',
    archiveReason:
      'Concept overlaps with Sentra (operations command) and a11oy (action rail / now-board / command-surface). Two production surfaces is one too many; this was the experimental third.',
    consolidationNote:
      'Not folded into a11oy. The command-surface page already exists in a11oy at /command and is the canonical version.',
    approxSize: '8 MB',
  },
  {
    slug: 'pulse',
    title: 'Pulse — AI Executive Briefing',
    kind: 'web',
    archivedPath: '.archived/artifacts/pulse/',
    description:
      'A short-form executive briefing surface — daily AI-generated narrative on governance and operational signal.',
    archiveReason:
      'A11oy already has an Executive Brief route at /brief and Now Board at /now. Pulse covered the same need with a different aesthetic; keeping both is redundant.',
    consolidationNote:
      'Not folded into a11oy. The /brief route in a11oy is the canonical executive-briefing surface.',
    approxSize: '0.5 MB',
  },
  {
    slug: 'lyte-command-center',
    title: 'Lyte — Decision Intelligence',
    kind: 'web',
    archivedPath: '.archived/artifacts/lyte-command-center/',
    description:
      'Decision-intelligence visualisations — model router outcomes, eval drilldowns, scoring of agent runs.',
    archiveReason:
      'A11oy already has /model-router, /evals (mirror eval), /agents, /workcells, /workcells/:id/replay, and /replay routes that cover this end-to-end with kernel-grade receipts. Lyte duplicated the surface without the kernel binding.',
    consolidationNote:
      'Not folded into a11oy. The kernel-bound routes in a11oy (/model-router, /evals, /workcells, /replay) are the canonical decision-intelligence surface.',
    approxSize: '0.8 MB',
  },
  {
    slug: 'szl-demo-video',
    title: 'SZL Holdings — Governed Autonomy Demo',
    kind: 'video',
    archivedPath: '.archived/artifacts/szl-demo-video/',
    description:
      'A short animated walkthrough of the governed-autonomy story (built with the video-js scaffold).',
    archiveReason:
      'A demo video is an output, not a product. The codex-kernel public release on GitHub is a stronger artifact than an internal animation that nobody can reproduce.',
    consolidationNote:
      'Not folded into a11oy. If a public demo becomes useful again it will be re-built fresh against the v1.0.1 canonical hashes, not resurrected from this draft.',
    approxSize: '0.1 MB',
  },
  {
    slug: 'pluginmesh',
    title: 'pluginmesh (orphaned)',
    kind: 'orphan',
    archivedPath: '.archived/artifacts/pluginmesh/',
    description:
      'Experimental plugin-mesh prototype. Was never registered as a real artifact (no `.replit-artifact/artifact.toml`).',
    archiveReason: 'Orphaned. Carried a workflow definition but no artifact registration.',
    consolidationNote: 'Not folded into a11oy. Archived for source preservation only.',
    approxSize: '<0.1 MB',
  },
  {
    slug: 'aegis',
    title: 'aegis (orphaned)',
    kind: 'orphan',
    archivedPath: '.archived/artifacts/aegis/',
    description: 'Orphaned directory with no artifact.toml registration.',
    archiveReason: 'Orphaned.',
    consolidationNote: 'Not folded into a11oy. Archived for source preservation only.',
    approxSize: '—',
  },
  {
    slug: 'helios',
    title: 'helios (orphaned)',
    kind: 'orphan',
    archivedPath: '.archived/artifacts/helios/',
    description: 'Orphaned directory with no artifact.toml registration.',
    archiveReason: 'Orphaned.',
    consolidationNote: 'Not folded into a11oy. Archived for source preservation only.',
    approxSize: '—',
  },
];

const LIVE = [
  { slug: 'amaru (conduit)', title: 'Amaru — The Andean Ouroboros', purpose: 'Replay-grade governed-loop visible surface', kept: 'kernel anchor' },
  { slug: 'a11oy', title: 'A11oy — Brand Orchestration Layer', purpose: 'Policy, receipts, agents, workcells, brand', kept: 'this app' },
  { slug: 'sentra', title: 'Sentra — Cyber Resilience Command', purpose: 'Replay attestation + posture', kept: 'auditor view' },
  { slug: 'counsel', title: 'Counsel — Legal Matter Command', purpose: 'Legal matter ops', kept: 'vertical' },
  { slug: 'terra', title: 'Terra — Real-Estate Intelligence', purpose: 'RE operations', kept: 'vertical' },
  { slug: 'carlota-jo', title: 'Carlota Jo Consulting', purpose: 'Consulting + advisory', kept: 'vertical' },
  { slug: 'vessels', title: 'Vessels — Maritime Intelligence', purpose: 'Maritime operations', kept: 'vertical' },
  { slug: 'api-server', title: 'API Server', purpose: 'Shared backend (Express)', kept: 'live frontends depend on it' },
  { slug: 'mockup-sandbox', title: 'NEXUS — Unified Agentic AI Layer', purpose: 'Canvas design tool', kept: 'workspace tool, not a product' },
];

type FilterKind = 'all' | ArchiveKind;

const KIND_CHIP: Record<ArchiveKind, { label: string; cls: string }> = {
  web: { label: 'web', cls: 'text-[var(--color-a11oy-blue)] border-[var(--color-a11oy-blue)]/30 bg-[var(--color-a11oy-blue)]/5' },
  mobile: { label: 'mobile (expo)', cls: 'text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/5' },
  video: { label: 'video', cls: 'text-[#a78bfa] border-[#a78bfa]/30 bg-[#a78bfa]/5' },
  orphan: { label: 'orphan', cls: 'text-[var(--color-a11oy-text-ghost)] border-[var(--color-a11oy-border)] bg-[var(--color-a11oy-surface)]' },
};

export function PortfolioArchive() {
  const [filter, setFilter] = useState<FilterKind>('all');

  const filtered = useMemo(
    () => (filter === 'all' ? ARCHIVED : ARCHIVED.filter(a => a.kind === filter)),
    [filter],
  );

  const stats = useMemo(() => {
    return {
      live: LIVE.length,
      archived: ARCHIVED.length,
      kinds: Array.from(new Set(ARCHIVED.map(a => a.kind))).length,
    };
  }, []);

  return (
    <div className="min-h-screen text-[var(--color-a11oy-text)]" style={{ backgroundColor: 'var(--color-a11oy-deep)' }}>
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-start gap-4 mb-2">
          <div
            className="w-10 h-10 rounded-md flex items-center justify-center border"
            style={{
              borderColor: 'var(--color-a11oy-border)',
              backgroundColor: 'var(--color-a11oy-surface)',
            }}
          >
            <Archive className="w-5 h-5 text-[#c9b787]" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-a11oy-text-ghost)]">
              SZL Portfolio · Consolidation Registry
            </div>
            <h1 className="text-2xl font-semibold tracking-tight mt-0.5">Portfolio Archive</h1>
            <p className="text-sm text-[var(--color-a11oy-text-sub)] mt-1 max-w-2xl">
              The honest record of what was kept live, what was archived, and why nothing
              was force-merged into a11oy. Sources preserved verbatim under{' '}
              <code className="text-[#c9b787]">.archived/artifacts/&lt;slug&gt;/</code>.
            </p>
          </div>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-3 gap-3 mt-8 mb-10">
          <StatCard icon={ShieldCheck} label="Live products" value={String(stats.live)} hint="kept on main" />
          <StatCard icon={Layers} label="Archived assets" value={String(stats.archived)} hint="moved to .archived/" />
          <StatCard icon={GitCommitVertical} label="Consolidated into a11oy" value="0" hint="by deliberate restraint" />
        </div>

        {/* Honesty card */}
        <div
          className="border rounded-md p-5 mb-10 flex gap-4"
          style={{
            borderColor: 'var(--color-a11oy-border)',
            backgroundColor: 'var(--color-a11oy-surface)',
          }}
        >
          <Info className="w-5 h-5 text-[#c9b787] shrink-0 mt-0.5" />
          <div className="text-sm text-[var(--color-a11oy-text-sub)] leading-relaxed">
            <span className="text-[var(--color-a11oy-text)] font-medium">Why "0 consolidated"?</span>{' '}
            The user authorised consolidation into a11oy "if you see fit". Each archive candidate
            was evaluated against an existing canonical surface in the live trio (a11oy, sentra,
            amaru). In every case, the canonical surface already covered the candidate's purpose
            with kernel-grade receipts. Force-merging duplicate UI into a11oy would have inflated
            it without adding evidence. The honest call was to archive verbatim and document
            why — exactly this page.
          </div>
        </div>

        {/* Live set table */}
        <Section title="Live set — kept on main" subtitle={`${LIVE.length} surfaces`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] font-mono uppercase tracking-widest text-[var(--color-a11oy-text-ghost)]">
                  <th className="py-2 pr-4">slug</th>
                  <th className="py-2 pr-4">title</th>
                  <th className="py-2 pr-4">purpose</th>
                  <th className="py-2 pr-4">why kept</th>
                </tr>
              </thead>
              <tbody>
                {LIVE.map(l => (
                  <tr key={l.slug} className="border-t" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                    <td className="py-2.5 pr-4 font-mono text-xs text-[#c9b787]">{l.slug}</td>
                    <td className="py-2.5 pr-4">{l.title}</td>
                    <td className="py-2.5 pr-4 text-[var(--color-a11oy-text-sub)]">{l.purpose}</td>
                    <td className="py-2.5 pr-4 text-[var(--color-a11oy-text-sub)]">{l.kept}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Filter chips */}
        <div className="flex items-center gap-3 mb-4 mt-12">
          <Filter className="w-4 h-4 text-[var(--color-a11oy-text-ghost)]" />
          <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-a11oy-text-ghost)]">
            Archived
          </div>
          <div className="flex gap-1.5 ml-2">
            {(['all', 'web', 'mobile', 'video', 'orphan'] as FilterKind[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={
                  'px-2.5 py-1 rounded text-[11px] font-mono uppercase tracking-wider border transition-colors ' +
                  (filter === f
                    ? 'text-[var(--color-a11oy-blue)] border-[var(--color-a11oy-blue)]/40 bg-[var(--color-a11oy-blue)]/10'
                    : 'text-[var(--color-a11oy-text-sub)] border-[var(--color-a11oy-border)] hover:bg-[var(--color-a11oy-surface)]')
                }
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Archived cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map(a => (
            <ArchiveCard key={a.slug} a={a} />
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-xs text-[var(--color-a11oy-text-ghost)] font-mono">
          consolidation pass · 2026-04-29 · main · all sources preserved verbatim
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint }: { icon: typeof Box; label: string; value: string; hint: string }) {
  return (
    <div
      className="border rounded-md p-4"
      style={{ borderColor: 'var(--color-a11oy-border)', backgroundColor: 'var(--color-a11oy-surface)' }}
    >
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[var(--color-a11oy-text-ghost)] mb-3">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className="text-3xl font-semibold tracking-tight">{value}</div>
      <div className="text-xs text-[var(--color-a11oy-text-sub)] mt-1">{hint}</div>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-base font-medium">{title}</h2>
        <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-a11oy-text-ghost)]">
          {subtitle}
        </div>
      </div>
      <div
        className="border rounded-md p-4"
        style={{ borderColor: 'var(--color-a11oy-border)', backgroundColor: 'var(--color-a11oy-surface)' }}
      >
        {children}
      </div>
    </div>
  );
}

function ArchiveCard({ a }: { a: ArchivedArtifact }) {
  const chip = KIND_CHIP[a.kind];
  return (
    <div
      className="border rounded-md p-5"
      style={{ borderColor: 'var(--color-a11oy-border)', backgroundColor: 'var(--color-a11oy-surface)' }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <div className="font-mono text-xs text-[#c9b787]">{a.slug}</div>
          <div className="text-base font-medium mt-0.5">{a.title}</div>
        </div>
        <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border ${chip.cls}`}>
          {chip.label}
        </span>
      </div>

      <p className="text-sm text-[var(--color-a11oy-text-sub)] leading-relaxed mb-3">{a.description}</p>

      <div className="space-y-2 text-xs">
        <Row label="Archive reason" value={a.archiveReason} />
        <Row label="Consolidation note" value={a.consolidationNote} />
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t" style={{ borderColor: 'var(--color-a11oy-border)' }}>
        <code className="text-[11px] font-mono text-[var(--color-a11oy-text-ghost)] flex items-center gap-1.5">
          <HardDrive className="w-3 h-3" />
          {a.archivedPath}
        </code>
        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-a11oy-text-ghost)] flex items-center gap-1">
          {a.approxSize}
          <ExternalLink className="w-3 h-3 opacity-40" />
        </span>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-a11oy-text-ghost)] mb-0.5">
        {label}
      </div>
      <div className="text-[var(--color-a11oy-text-sub)] leading-relaxed">{value}</div>
    </div>
  );
}
