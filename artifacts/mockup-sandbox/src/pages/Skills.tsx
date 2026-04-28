import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  FlaskConical,
  GitFork,
  Layers,
  Loader,
  Lock,
  RotateCcw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { praxisApi } from '../lib/api';
import type { Skill, ThirdPartyLeader } from '../lib/types';

function formatRelative(iso?: string): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 0) return '';
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

const PRIMITIVE_COLORS: Record<string, string> = {
  Skill: 'var(--gi-accent-blue)',
  Hook: 'var(--gi-accent-violet)',
  Command: 'var(--gi-accent-amber)',
  Agent: 'var(--gi-accent-green)',
  MemorySchema: '#f472b6',
  RAGStrategy: '#22d3ee',
  Tool: '#fb923c',
};

export default function Skills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [leaders, setLeaders] = useState<ThirdPartyLeader[]>([]);
  const [search, setSearch] = useState('');
  const [enabledFilter, setEnabledFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [customFilter, setCustomFilter] = useState<'all' | 'custom'>('all');
  const [loading, setLoading] = useState(true);
  const [leadersLoading, setLeadersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanding, setExpanding] = useState<string | null>(null);
  const [expandingLeader, setExpandingLeader] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetSummary, setResetSummary] = useState<string | null>(null);

  const fetchSkills = useCallback(async () => {
    try {
      const data = await praxisApi.listSkills({
        search: search || undefined,
        enabled:
          enabledFilter === 'enabled' ? true : enabledFilter === 'disabled' ? false : undefined,
      });
      setSkills(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load skills');
    } finally {
      setLoading(false);
    }
  }, [search, enabledFilter]);

  const fetchLeaders = useCallback(async () => {
    try {
      const data = await praxisApi.listLeaders();
      setLeaders(data);
    } catch {
      // Leaders are non-fatal — skills page still works without them
    } finally {
      setLeadersLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchSkills();
  }, [fetchSkills]);

  useEffect(() => {
    fetchLeaders();
  }, [fetchLeaders]);

  async function handleToggle(skill: Skill) {
    try {
      const updated = await praxisApi.toggleSkill(skill.id, !skill.enabled);
      setSkills((prev) => prev.map((s) => (s.id === skill.id ? updated : s)));
    } catch {}
  }

  async function handleLeaderToggle(leader: ThirdPartyLeader) {
    if (leader.policyState === 'blocked') return;
    try {
      const updated = await praxisApi.toggleLeader(leader.id, !leader.enabled);
      setLeaders((prev) => prev.map((l) => (l.id === leader.id ? updated : l)));
    } catch {}
  }

  const enabledCount = skills.filter((s) => s.enabled).length;
  const customCount = skills.filter((s) => s.isCustom).length;
  const modifiedCount = skills.filter((s) => !s.isCustom && s.lastModifiedAt).length;
  const visibleSkills =
    customFilter === 'custom' ? skills.filter((s) => s.isCustom || !!s.lastModifiedAt) : skills;

  async function handleReset() {
    if (resetting) return;
    if (
      typeof window !== 'undefined' &&
      !window.confirm(
        'Reset all your custom skills and clear toggle history? Seeded skills will be restored to their default state.',
      )
    )
      return;
    setResetting(true);
    setError(null);
    setResetSummary(null);
    try {
      const result = await praxisApi.resetCustomizations();
      setResetSummary(
        `Removed ${result.removedSkills} custom skill${result.removedSkills === 1 ? '' : 's'}, ` +
          `cleared modification history on ${result.resetSkills} seeded skill${result.resetSkills === 1 ? '' : 's'}, ` +
          `removed ${result.removedTools} custom tool${result.removedTools === 1 ? '' : 's'}, ` +
          `cleared ${result.resetTools} tool modification${result.resetTools === 1 ? '' : 's'}.`,
      );
      await fetchSkills();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="min-h-full bg-praxis-bg p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Layers className="w-5 h-5 text-praxis-cyan" />
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Skills Library</h1>
            <p className="text-xs text-muted-foreground">
              Adapted from 20+ public repos · Native PRAXIS primitives · {enabledCount} enabled
              {customCount > 0 && ` · ${customCount} custom`}
              {modifiedCount > 0 && ` · ${modifiedCount} modified`}
            </p>
          </div>
          <button
            onClick={handleReset}
            disabled={resetting || (customCount === 0 && modifiedCount === 0)}
            title="Remove your custom skills and clear toggle history on seeded skills"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-praxis text-muted-foreground hover:text-foreground hover:border-praxis-red/40 hover:text-praxis-red disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {resetting ? (
              <Loader className="w-3 h-3 animate-spin" />
            ) : (
              <RotateCcw className="w-3 h-3" />
            )}
            Reset to defaults
          </button>
        </div>

        <div className="mb-5 flex items-center gap-2 rounded-lg border border-praxis-amber/20 bg-praxis-amber/5 px-3 py-2">
          <FlaskConical className="w-3.5 h-3.5 text-praxis-amber shrink-0" />
          <span className="text-[11px] text-praxis-amber font-mono uppercase tracking-wide">
            Internal Tooling — Not Production
          </span>
          <span className="text-[10px] text-muted-foreground/60 ml-1">
            This module is for internal PRAXIS development only. Skill toggles affect the internal
            agent runtime only.
          </span>
        </div>

        {resetSummary && (
          <div className="mb-4 flex items-center gap-2 bg-praxis-cyan/5 border border-praxis-cyan/20 rounded-lg px-4 py-2">
            <Sparkles className="w-3.5 h-3.5 text-praxis-cyan shrink-0" />
            <p className="text-xs text-muted-foreground">{resetSummary}</p>
          </div>
        )}

        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
            <input
              type="search"
              placeholder="Search skills…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-praxis-surface border border-praxis rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-praxis-cyan/30 placeholder:text-muted-foreground/30"
            />
          </div>
          <div className="flex rounded-lg border border-praxis overflow-hidden text-xs">
            {(['all', 'enabled', 'disabled'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setEnabledFilter(f)}
                className={`px-3 py-2 transition-colors capitalize ${
                  enabledFilter === f
                    ? 'bg-praxis-cyan/10 text-praxis-cyan'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex rounded-lg border border-praxis overflow-hidden text-xs">
            {(['all', 'custom'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setCustomFilter(f)}
                className={`px-3 py-2 transition-colors capitalize ${
                  customFilter === f
                    ? 'bg-praxis-purple/10 text-praxis-purple'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f === 'custom' ? 'Yours' : f}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 bg-praxis-red/10 border border-praxis-red/30 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 text-praxis-red shrink-0" />
            <p className="text-xs text-praxis-red">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader className="w-6 h-6 animate-spin text-muted-foreground/40" />
          </div>
        ) : (
          <div className="space-y-2">
            {visibleSkills.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                onToggle={handleToggle}
                expanded={expanding === skill.id}
                onExpand={() => setExpanding((e) => (e === skill.id ? null : skill.id))}
              />
            ))}
            {visibleSkills.length === 0 && (
              <div className="text-center py-16 text-muted-foreground/40">
                <Layers className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-sm">No skills match your filters.</p>
                <p className="text-xs mt-1">
                  Try running an Ingest job to populate the Skills Library.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Third-Party Leaders Registry ────────────────────────────── */}
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-4 h-4 text-praxis-amber shrink-0" />
            <div className="flex-1">
              <h2 className="text-sm font-semibold">Third-Party Leaders</h2>
              <p className="text-xs text-muted-foreground">
                Vetted external agents and skill packs · License &amp; policy gated · Audit logged on every call
              </p>
            </div>
          </div>

          {leadersLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader className="w-5 h-5 animate-spin text-muted-foreground/40" />
            </div>
          ) : (
            <div className="space-y-2" data-testid="leaders-list">
              {leaders.map((leader) => (
                <LeaderCard
                  key={leader.id}
                  leader={leader}
                  onToggle={handleLeaderToggle}
                  expanded={expandingLeader === leader.id}
                  onExpand={() =>
                    setExpandingLeader((e) => (e === leader.id ? null : leader.id))
                  }
                />
              ))}
              {leaders.length === 0 && (
                <div className="text-center py-10 text-muted-foreground/40">
                  <Shield className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No leaders registered.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SkillCard({
  skill,
  onToggle,
  expanded,
  onExpand,
}: {
  skill: Skill;
  onToggle: (s: Skill) => void;
  expanded: boolean;
  onExpand: () => void;
}) {
  const primColor = PRIMITIVE_COLORS[skill.primitiveType] ?? 'var(--gi-accent-blue)';

  const modifiedRel = formatRelative(skill.lastModifiedAt);
  const modifiedTitle = skill.lastModifiedAt
    ? `Last toggled/edited ${new Date(skill.lastModifiedAt).toLocaleString()}` +
      (skill.lastModifiedBy ? ` by ${skill.lastModifiedBy}` : '')
    : '';

  return (
    <div
      className={`bg-praxis-surface border rounded-lg overflow-hidden transition-all ${
        skill.isCustom
          ? 'border-praxis-purple/30'
          : skill.enabled
            ? 'border-praxis-cyan/20'
            : 'border-praxis'
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={onExpand} className="flex items-center gap-3 flex-1 min-w-0 text-left">
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="text-sm font-semibold">{skill.name}</span>
              <span
                className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                style={{
                  color: primColor,
                  backgroundColor: `${primColor}15`,
                  border: `1px solid ${primColor}30`,
                }}
              >
                {skill.primitiveType}
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-praxis-bg border border-praxis text-muted-foreground/50 font-mono">
                {skill.license}
              </span>
              {skill.isCustom && (
                <span
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1"
                  style={{
                    color: 'var(--gi-accent-violet)',
                    backgroundColor: 'color-mix(in srgb, var(--gi-accent-violet) 10%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--gi-accent-violet) 25%, transparent)',
                  }}
                  title="You added this skill"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  custom
                </span>
              )}
              {!skill.isCustom && skill.lastModifiedAt && (
                <span
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1 text-praxis-amber bg-praxis-amber/10 border border-praxis-amber/30"
                  title={modifiedTitle}
                >
                  modified
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <p className="text-xs text-muted-foreground truncate">{skill.description}</p>
              <span className="text-[9px] font-mono text-muted-foreground/40 shrink-0 flex items-center gap-1">
                <GitFork className="w-2.5 h-2.5" />
                {skill.sourceRepo}
              </span>
              {modifiedRel && (
                <span
                  className="text-[9px] font-mono text-muted-foreground/40 shrink-0 flex items-center gap-1"
                  title={modifiedTitle}
                >
                  <Clock className="w-2.5 h-2.5" />
                  {modifiedRel}
                  {skill.lastModifiedBy && ` · ${skill.lastModifiedBy}`}
                </span>
              )}
            </div>
          </div>
        </button>

        <div className="flex items-center gap-3 shrink-0">
          {skill.usageCount > 0 && (
            <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground/50">
              <Zap className="w-3 h-3" />
              {skill.usageCount}
            </div>
          )}
          <button
            onClick={() => onToggle(skill)}
            className={`flex items-center gap-1.5 text-xs transition-colors ${
              skill.enabled
                ? 'text-praxis-cyan'
                : 'text-muted-foreground/40 hover:text-muted-foreground'
            }`}
          >
            {skill.enabled ? (
              <ToggleRight className="w-5 h-5" />
            ) : (
              <ToggleLeft className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-praxis space-y-4 pt-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest mb-1.5">
                Original ({skill.sourceRepo})
              </h4>
              <div className="bg-praxis-bg rounded-lg p-3 text-xs text-muted-foreground leading-relaxed">
                {skill.originalSummary}
              </div>
            </div>
            <div>
              <h4 className="text-[10px] font-mono text-praxis-cyan/70 uppercase tracking-widest mb-1.5">
                PRAXIS Adaptation
              </h4>
              <div
                className="bg-praxis-bg rounded-lg p-3 text-xs leading-relaxed"
                style={{ color: '#c8d8e8' }}
              >
                {skill.praxisAdaptation}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-wrap gap-1.5">
              {skill.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-praxis-bg border border-praxis text-muted-foreground/50"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground/40 font-mono">
                pattern: {skill.pattern}
              </span>
              <a
                href={skill.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-praxis-cyan hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                Source
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Policy state helpers ───────────────────────────────────────────────────────

const POLICY_META = {
  allowed: {
    icon: ShieldCheck,
    label: 'allowed',
    color: 'var(--gi-accent-green)',
    bg: 'color-mix(in srgb, var(--gi-accent-green) 10%, transparent)',
    border: 'color-mix(in srgb, var(--gi-accent-green) 25%, transparent)',
  },
  'requires-review': {
    icon: ShieldAlert,
    label: 'requires-review',
    color: 'var(--gi-accent-amber)',
    bg: 'color-mix(in srgb, var(--gi-accent-amber) 10%, transparent)',
    border: 'color-mix(in srgb, var(--gi-accent-amber) 25%, transparent)',
  },
  blocked: {
    icon: Lock,
    label: 'blocked',
    color: 'var(--gi-accent-red)',
    bg: 'color-mix(in srgb, var(--gi-accent-red) 10%, transparent)',
    border: 'color-mix(in srgb, var(--gi-accent-red) 25%, transparent)',
  },
} as const;

const MODE_LABEL: Record<string, string> = {
  'in-process': 'in-process',
  'external-service': 'external-service (remote MCP)',
  'pattern-reference': 'pattern-reference',
};

function LeaderCard({
  leader,
  onToggle,
  expanded,
  onExpand,
}: {
  leader: ThirdPartyLeader;
  onToggle: (l: ThirdPartyLeader) => void;
  expanded: boolean;
  onExpand: () => void;
}) {
  const policy = POLICY_META[leader.policyState];
  const PolicyIcon = policy.icon;
  const isBlocked = leader.policyState === 'blocked';
  const isAgpl = leader.licenseSpdx.startsWith('AGPL');

  return (
    <div
      className={`bg-praxis-surface border rounded-lg overflow-hidden transition-all ${
        isBlocked
          ? 'border-praxis-red/20'
          : leader.enabled
            ? 'border-praxis-amber/25'
            : 'border-praxis'
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={onExpand} className="flex items-center gap-3 flex-1 min-w-0 text-left">
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="text-sm font-semibold">{leader.name}</span>
              <span
                className="text-[9px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1"
                style={{
                  color: policy.color,
                  backgroundColor: policy.bg,
                  border: `1px solid ${policy.border}`,
                }}
              >
                <PolicyIcon className="w-2.5 h-2.5" />
                {policy.label}
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-praxis-bg border border-praxis text-muted-foreground/50 font-mono">
                {leader.licenseSpdx}
              </span>
              {isAgpl && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-praxis-red/10 border border-praxis-red/30 text-praxis-red">
                  external-service only
                </span>
              )}
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-praxis-bg border border-praxis text-muted-foreground/40 font-mono">
                {leader.integrationMode}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-xs text-muted-foreground truncate">{leader.capabilitySummary}</p>
              <span className="text-[9px] font-mono text-muted-foreground/40 shrink-0 flex items-center gap-1">
                <GitFork className="w-2.5 h-2.5" />
                {leader.sourceRepo}
              </span>
            </div>
          </div>
        </button>

        <div className="flex items-center gap-3 shrink-0">
          {leader.logicalCapability && (
            <span className="text-[9px] font-mono text-muted-foreground/40 bg-praxis-bg border border-praxis px-1.5 py-0.5 rounded">
              {leader.logicalCapability}
            </span>
          )}
          <button
            onClick={() => onToggle(leader)}
            disabled={isBlocked}
            title={
              isBlocked
                ? `Blocked by policy: ${leader.policyNote ?? ''}`
                : leader.integrationMode === 'pattern-reference'
                  ? 'Pattern reference — no runtime toggle'
                  : undefined
            }
            className={`flex items-center gap-1.5 text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
              leader.enabled
                ? 'text-praxis-amber'
                : 'text-muted-foreground/40 hover:text-muted-foreground'
            }`}
          >
            {leader.enabled ? (
              <ToggleRight className="w-5 h-5" />
            ) : (
              <ToggleLeft className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-praxis space-y-4 pt-3">
          {/* Third-Party Provenance Panel */}
          <div className="bg-praxis-bg rounded-lg p-3 space-y-2">
            <h4 className="text-[10px] font-mono text-praxis-amber/70 uppercase tracking-widest mb-2">
              Third-Party Provenance
            </h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground/60">
                <span className="font-mono text-[9px] uppercase tracking-wide w-28 shrink-0">License</span>
                <span className="text-foreground font-mono">{leader.licenseSpdx}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground/60">
                <span className="font-mono text-[9px] uppercase tracking-wide w-28 shrink-0">Mode</span>
                <span className="text-foreground">{MODE_LABEL[leader.integrationMode] ?? leader.integrationMode}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground/60">
                <span className="font-mono text-[9px] uppercase tracking-wide w-28 shrink-0">Last commit</span>
                <span className="text-foreground font-mono">{leader.lastFetchedCommit ?? '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground/60">
                <span className="font-mono text-[9px] uppercase tracking-wide w-28 shrink-0">Fetched</span>
                <span className="text-foreground font-mono">
                  {leader.lastFetchedAt ? formatRelative(leader.lastFetchedAt) : '—'}
                </span>
              </div>
              <div className="col-span-2 flex items-start gap-2 text-muted-foreground/60">
                <span className="font-mono text-[9px] uppercase tracking-wide w-28 shrink-0 mt-0.5">Policy gate</span>
                <span
                  className="leading-relaxed"
                  style={{ color: policy.color }}
                >
                  {leader.policyNote ?? policy.label}
                </span>
              </div>
            </div>
          </div>

          {/* Capability summary */}
          <div className="bg-praxis-bg rounded-lg p-3 text-xs text-muted-foreground leading-relaxed">
            {leader.capabilitySummary}
          </div>

          {/* Tags + link */}
          <div className="flex items-center gap-3">
            <div className="flex flex-wrap gap-1.5">
              {leader.capabilityTags.map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-praxis-bg border border-praxis text-muted-foreground/50"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="ml-auto">
              <a
                href={leader.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-praxis-cyan hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                Source
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
