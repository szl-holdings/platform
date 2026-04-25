import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { DataStateBadge } from '@szl-holdings/shared-ui/data-state-badge';
import { useQueryClient } from '@tanstack/react-query';
import {
  BarChart2,
  ChevronDown,
  ChevronUp,
  Clock,
  Filter,
  Layers,
  Pause,
  Play,
  Radio,
  RefreshCw,
  Shield,
  Tag,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

interface Skill {
  id: number;
  name: string;
  slug: string;
  version: string;
  category: string;
  description: string;
  approvalClass: 'auto' | 'review' | 'admin_only';
  isInternal: boolean;
  isEnabled: boolean;
  dryRunSupported: boolean;
  inputSchema: Record<string, unknown> | null;
  outputSchema: Record<string, unknown> | null;
  tags: string[];
  usageCount: number;
  lastUsedAt: string | null;
  createdAt: string;
  deprecatedAt: string | null;
}

const DEMO_SKILLS: Skill[] = [
  {
    id: 1,
    name: 'Web Research',
    slug: 'web-research',
    version: '2.1.0',
    category: 'Research',
    description:
      'Deep web research with source attribution, relevance scoring, and citation management. Supports multi-source synthesis.',
    approvalClass: 'auto',
    isInternal: true,
    isEnabled: true,
    dryRunSupported: true,
    inputSchema: { query: 'string', maxSources: 'number', domains: 'string[]' },
    outputSchema: { summary: 'string', sources: 'Source[]', confidence: 'number' },
    tags: ['research', 'web', 'synthesis'],
    usageCount: 847,
    lastUsedAt: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
    deprecatedAt: null,
  },
  {
    id: 2,
    name: 'Artifact Generator',
    slug: 'artifact-generator',
    version: '1.4.0',
    category: 'Output',
    description:
      'Generates structured artifacts (reports, briefs, summaries) with versioning, approval routing, and template support.',
    approvalClass: 'review',
    isInternal: true,
    isEnabled: true,
    dryRunSupported: true,
    inputSchema: {
      type: 'string',
      content: 'string',
      template: 'string?',
      requiresApproval: 'boolean',
    },
    outputSchema: { artifactId: 'number', status: 'string', approvalRequired: 'boolean' },
    tags: ['artifacts', 'documents', 'reports'],
    usageCount: 412,
    lastUsedAt: new Date(Date.now() - 7200000).toISOString(),
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    deprecatedAt: null,
  },
  {
    id: 3,
    name: 'Workflow Launch',
    slug: 'workflow-launch',
    version: '1.2.1',
    category: 'Orchestration',
    description:
      'Programmatically launch workflows with input parameters, signal triggers, and concurrency controls.',
    approvalClass: 'review',
    isInternal: true,
    isEnabled: true,
    dryRunSupported: true,
    inputSchema: { workflowId: 'number', input: 'object', triggerSource: 'string' },
    outputSchema: { runId: 'number', state: 'string' },
    tags: ['workflow', 'orchestration', 'trigger'],
    usageCount: 229,
    lastUsedAt: new Date(Date.now() - 14400000).toISOString(),
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    deprecatedAt: null,
  },
  {
    id: 4,
    name: 'Send Notification',
    slug: 'send-notification',
    version: '2.0.0',
    category: 'Messaging',
    description:
      'Multi-channel notification delivery — Slack, email, webhook. Supports templating, batching, and delivery tracking.',
    approvalClass: 'auto',
    isInternal: true,
    isEnabled: true,
    dryRunSupported: true,
    inputSchema: {
      channel: 'string',
      message: 'string',
      recipients: 'string[]',
      template: 'string?',
    },
    outputSchema: { deliveryId: 'string', status: 'string', channelsAttempted: 'string[]' },
    tags: ['notifications', 'messaging', 'slack', 'email'],
    usageCount: 1284,
    lastUsedAt: new Date(Date.now() - 1800000).toISOString(),
    createdAt: new Date(Date.now() - 120 * 86400000).toISOString(),
    deprecatedAt: null,
  },
  {
    id: 5,
    name: 'Admin Action',
    slug: 'admin-action',
    version: '1.0.0',
    category: 'Admin',
    description:
      'Privileged system administration actions. Restricted to admin-only agents with full audit trail.',
    approvalClass: 'admin_only',
    isInternal: true,
    isEnabled: true,
    dryRunSupported: false,
    inputSchema: { action: 'string', target: 'string', params: 'object' },
    outputSchema: { result: 'object', auditId: 'string' },
    tags: ['admin', 'privileged', 'system'],
    usageCount: 23,
    lastUsedAt: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    deprecatedAt: null,
  },
  {
    id: 6,
    name: 'Data Extraction',
    slug: 'data-extraction',
    version: '1.3.0',
    category: 'Processing',
    description:
      'Structured data extraction from documents, APIs, and databases. Schema validation and transformation support.',
    approvalClass: 'auto',
    isInternal: true,
    isEnabled: true,
    dryRunSupported: true,
    inputSchema: { source: 'string', schema: 'object', filters: 'object?' },
    outputSchema: { records: 'object[]', count: 'number', schema: 'object' },
    tags: ['data', 'extraction', 'etl'],
    usageCount: 563,
    lastUsedAt: new Date(Date.now() - 5400000).toISOString(),
    createdAt: new Date(Date.now() - 75 * 86400000).toISOString(),
    deprecatedAt: null,
  },
  {
    id: 7,
    name: 'Browser Task',
    slug: 'browser-task',
    version: '0.9.0',
    category: 'Browsing',
    description:
      'Headless browser automation for web scraping, form filling, and UI interaction. Beta — requires review.',
    approvalClass: 'review',
    isInternal: true,
    isEnabled: false,
    dryRunSupported: true,
    inputSchema: { url: 'string', actions: 'BrowserAction[]', timeout: 'number' },
    outputSchema: { result: 'string', screenshots: 'string[]', logs: 'string[]' },
    tags: ['browser', 'automation', 'scraping', 'beta'],
    usageCount: 12,
    lastUsedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    deprecatedAt: null,
  },
];

const APPROVAL_CONFIG: Record<
  string,
  { color: string; bg: string; border: string; label: string; icon: React.ReactNode }
> = {
  auto: {
    color: '#10b981',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.2)',
    label: 'Auto',
    icon: <Zap className="w-2.5 h-2.5" />,
  },
  review: {
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
    label: 'Review Required',
    icon: <Clock className="w-2.5 h-2.5" />,
  },
  admin_only: {
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.2)',
    label: 'Admin Only',
    icon: <Shield className="w-2.5 h-2.5" />,
  },
};

const CATEGORY_COLORS: Record<string, string> = {
  Research: '#4B8BDB',
  Output: '#10b981',
  Orchestration: '#8b5cf6',
  Messaging: '#f59e0b',
  Admin: '#ef4444',
  Processing: '#0ea5e9',
  Browsing: '#6b7280',
};

function formatRelative(ts: string | null) {
  if (!ts) return 'Never';
  const ms = Date.now() - new Date(ts).getTime();
  if (ms < 60000) return 'just now';
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
  return `${Math.floor(ms / 86400000)}d ago`;
}

function SkillCard({
  skill,
  onToggle,
}: {
  skill: Skill;
  onToggle: (id: number, enabled: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const approval = APPROVAL_CONFIG[skill.approvalClass] ?? APPROVAL_CONFIG.auto;
  const catColor = CATEGORY_COLORS[skill.category] ?? '#4B8BDB';

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all"
      style={{
        borderColor: skill.isEnabled ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
        background: skill.isEnabled ? 'rgba(12,18,30,0.95)' : 'rgba(8,12,20,0.8)',
      }}
    >
      <div className="p-4 cursor-pointer" onClick={() => setExpanded((e) => !e)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                style={{ color: catColor, background: `${catColor}15` }}
              >
                {skill.category}
              </span>
              <span
                className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border"
                style={{
                  color: approval.color,
                  background: approval.bg,
                  borderColor: approval.border,
                }}
              >
                {approval.icon} {approval.label}
              </span>
              <span
                className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                style={{ color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)' }}
              >
                v{skill.version}
              </span>
              {!skill.isEnabled && (
                <span
                  className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                  style={{ color: '#6b7280', background: 'rgba(107,114,128,0.1)' }}
                >
                  Disabled
                </span>
              )}
              {skill.deprecatedAt && (
                <span
                  className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                  style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}
                >
                  Deprecated
                </span>
              )}
            </div>
            <div
              className="text-sm font-semibold"
              style={{ color: skill.isEnabled ? '#fff' : 'rgba(255,255,255,0.5)' }}
            >
              {skill.name}
            </div>
            <div
              className="text-[10px] mt-0.5 line-clamp-1"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              {skill.description}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-1 text-[9px]"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                <BarChart2 className="w-2.5 h-2.5" /> {skill.usageCount.toLocaleString()}
              </div>
              {expanded ? (
                <ChevronUp className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2.5 flex-wrap">
          {skill.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded font-mono"
              style={{
                color: 'rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <Tag className="w-2 h-2" />
              {tag}
            </span>
          ))}
          {skill.dryRunSupported && (
            <span
              className="text-[9px] px-1.5 py-0.5 rounded"
              style={{
                color: 'rgba(75,139,219,0.6)',
                background: 'rgba(75,139,219,0.06)',
                border: '1px solid rgba(75,139,219,0.1)',
              }}
            >
              dry-run
            </span>
          )}
          {!skill.isInternal && (
            <span
              className="text-[9px] px-1.5 py-0.5 rounded"
              style={{
                color: 'rgba(16,185,129,0.6)',
                background: 'rgba(16,185,129,0.06)',
                border: '1px solid rgba(16,185,129,0.1)',
              }}
            >
              tenant-defined
            </span>
          )}
        </div>
      </div>

      {expanded && (
        <div
          className="border-t px-4 pb-4 pt-3 space-y-3"
          style={{ borderColor: 'rgba(255,255,255,0.05)' }}
        >
          <div className="grid grid-cols-2 gap-3">
            {skill.inputSchema && (
              <div>
                <div
                  className="text-[9px] uppercase tracking-widest mb-1.5"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  Input Contract
                </div>
                <pre
                  className="text-[9px] rounded-lg p-2.5 overflow-auto"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    color: 'rgba(75,139,219,0.8)',
                    border: '1px solid rgba(75,139,219,0.1)',
                    maxHeight: 100,
                  }}
                >
                  {JSON.stringify(skill.inputSchema, null, 2)}
                </pre>
              </div>
            )}
            {skill.outputSchema && (
              <div>
                <div
                  className="text-[9px] uppercase tracking-widest mb-1.5"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  Output Contract
                </div>
                <pre
                  className="text-[9px] rounded-lg p-2.5 overflow-auto"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    color: 'rgba(16,185,129,0.8)',
                    border: '1px solid rgba(16,185,129,0.1)',
                    maxHeight: 100,
                  }}
                >
                  {JSON.stringify(skill.outputSchema, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div
              className="rounded-lg p-2.5"
              style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)' }}
            >
              <div
                className="text-[9px] uppercase tracking-widest mb-1"
                style={{ color: 'rgba(255,255,255,0.25)' }}
              >
                Slug
              </div>
              <div className="text-[10px] font-mono text-white">{skill.slug}</div>
            </div>
            <div
              className="rounded-lg p-2.5"
              style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)' }}
            >
              <div
                className="text-[9px] uppercase tracking-widest mb-1"
                style={{ color: 'rgba(255,255,255,0.25)' }}
              >
                Last Used
              </div>
              <div className="text-[10px] text-white">{formatRelative(skill.lastUsedAt)}</div>
            </div>
            <div
              className="rounded-lg p-2.5"
              style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)' }}
            >
              <div
                className="text-[9px] uppercase tracking-widest mb-1"
                style={{ color: 'rgba(255,255,255,0.25)' }}
              >
                Uses
              </div>
              <div className="text-[10px] font-mono text-white">
                {skill.usageCount.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle(skill.id, !skill.isEnabled);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:opacity-80"
              style={
                skill.isEnabled
                  ? {
                      borderColor: 'rgba(245,158,11,0.3)',
                      background: 'rgba(245,158,11,0.1)',
                      color: '#f59e0b',
                    }
                  : {
                      borderColor: 'rgba(16,185,129,0.3)',
                      background: 'rgba(16,185,129,0.1)',
                      color: '#10b981',
                    }
              }
            >
              {skill.isEnabled ? (
                <>
                  <Pause className="w-3 h-3" /> Disable
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" /> Enable
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SkillRegistry() {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [approvalFilter, setApprovalFilter] = useState('all');
  const qc = useQueryClient();

  const {
    data: apiSkills,
    isLoading,
    isError,
  } = useStandardQuery({
    queryKey: ['alloySkills', categoryFilter, approvalFilter],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({ limit: '50' });
        if (categoryFilter !== 'all') params.set('category', categoryFilter);
        if (approvalFilter !== 'all') params.set('approvalClass', approvalFilter);
        const r = await apiFetch<{ data: Skill[] } | Skill[]>(`/alloy/skills?${params}`);
        if (r && 'data' in r) return r.data;
        return r as Skill[];
      } catch {
        return null;
      }
    },
    refetchInterval: 60000,
    retry: 1,
  });

  const toggleSkill = useStandardMutation({
    mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) => {
      try {
        return await apiFetch(`/alloy/skills/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ isEnabled: enabled }),
        });
      } catch {
        return null;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alloySkills'] }),
  });

  const isDemo = isError || (!isLoading && (!apiSkills || apiSkills.length === 0));
  const skills = isDemo ? DEMO_SKILLS : (apiSkills ?? []);

  const filtered = skills.filter((s) => {
    const catOk = categoryFilter === 'all' || s.category === categoryFilter;
    const approvalOk = approvalFilter === 'all' || s.approvalClass === approvalFilter;
    return catOk && approvalOk;
  });

  const categories = Array.from(new Set(skills.map((s) => s.category)));

  const stats = {
    total: skills.length,
    enabled: skills.filter((s) => s.isEnabled).length,
    auto: skills.filter((s) => s.approvalClass === 'auto').length,
    review: skills.filter((s) => s.approvalClass === 'review').length,
    admin: skills.filter((s) => s.approvalClass === 'admin_only').length,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-3.5 h-3.5" style={{ color: '#4B8BDB' }} />
            <span
              className="text-[10px] font-bold uppercase tracking-widest font-mono"
              style={{ color: '#4B8BDB' }}
            >
              Counsel · Skill Registry
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Skill Registry</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Formal registry of agent capabilities — versioned, approved, and audited.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDemo && <DataStateBadge state="demo" />}
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ['alloySkills'] })}
            className="flex items-center gap-1.5 text-[11px] border px-3 py-1.5 rounded-lg transition-colors hover:bg-white/5 shrink-0"
            style={{ color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      {isDemo && (
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-medium"
          style={{
            background: 'rgba(75,139,219,0.04)',
            border: '1px solid rgba(75,139,219,0.1)',
            color: 'rgba(75,139,219,0.6)',
          }}
        >
          <Radio className="w-3 h-3 shrink-0 animate-pulse" />
          Demo Environment — Showing registered skills. Connect the Counsel API for live data.
        </div>
      )}

      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)' }}
      >
        <div className="flex items-stretch">
          {[
            { label: 'Total Skills', value: stats.total, color: 'rgba(255,255,255,0.6)' },
            { label: 'Enabled', value: stats.enabled, color: '#10b981' },
            { label: 'Auto-Approved', value: stats.auto, color: '#10b981' },
            { label: 'Review Required', value: stats.review, color: '#f59e0b' },
            { label: 'Admin Only', value: stats.admin, color: '#ef4444' },
          ].map((c, i) => (
            <div
              key={c.label}
              className="flex-1 px-3 py-3 text-center"
              style={{ borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
            >
              <div className="text-xl font-bold font-mono mb-0.5" style={{ color: c.color }}>
                {c.value}
              </div>
              <div
                className="text-[8px] font-medium uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                {c.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className="flex items-center gap-1 text-[10px]"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            <Filter className="w-3 h-3" /> Category:
          </div>
          {['all', ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className="text-[10px] px-2.5 py-1 rounded-lg border capitalize transition-all"
              style={{
                background:
                  categoryFilter === cat ? 'rgba(75,139,219,0.08)' : 'rgba(255,255,255,0.02)',
                borderColor:
                  categoryFilter === cat ? 'rgba(75,139,219,0.3)' : 'rgba(255,255,255,0.06)',
                color: categoryFilter === cat ? '#4B8BDB' : 'rgba(255,255,255,0.35)',
              }}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className="flex items-center gap-1 text-[10px]"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            <Shield className="w-3 h-3" /> Approval:
          </div>
          {['all', 'auto', 'review', 'admin_only'].map((a) => (
            <button
              key={a}
              onClick={() => setApprovalFilter(a)}
              className="text-[10px] px-2.5 py-1 rounded-lg border transition-all"
              style={{
                background:
                  approvalFilter === a ? 'rgba(75,139,219,0.08)' : 'rgba(255,255,255,0.02)',
                borderColor:
                  approvalFilter === a ? 'rgba(75,139,219,0.3)' : 'rgba(255,255,255,0.06)',
                color: approvalFilter === a ? '#4B8BDB' : 'rgba(255,255,255,0.35)',
              }}
            >
              {a === 'all'
                ? 'All'
                : a === 'admin_only'
                  ? 'Admin Only'
                  : a === 'review'
                    ? 'Review'
                    : 'Auto'}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
          {filtered.length} skills
        </span>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl border border-white/5 animate-pulse" />
          ))}
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((skill) => (
          <SkillCard
            key={skill.id}
            skill={skill}
            onToggle={(id, enabled) => toggleSkill.mutate({ id, enabled })}
          />
        ))}
        {!isLoading && filtered.length === 0 && (
          <div
            className="rounded-xl border p-12 text-center"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <Layers className="w-8 h-8 mx-auto mb-3" style={{ color: 'rgba(75,139,219,0.3)' }} />
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
              No skills found
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
