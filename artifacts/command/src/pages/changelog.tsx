import { useStandardQuery } from '@szl-holdings/api-client-react';
import { AlertTriangle, CheckCircle2, Clock, Rocket, Search, Tag } from 'lucide-react';
import { useState } from 'react';
import { OpsLayout } from '../components/ops-layout';

type ChangeType = 'deploy' | 'feature' | 'fix' | 'security' | 'config' | 'breaking';
type ChangeSeverity = 'major' | 'minor' | 'patch';

interface ApiReleasesResponse {
  releases: ChangeEntry[];
  summary: { total: number; deploysToday: number; rolledBack: number };
  generatedAt: string;
  dataSource: string;
}

interface ChangeEntry {
  id: string;
  domain: string;
  domainColor: string;
  type: ChangeType;
  severity: ChangeSeverity;
  title: string;
  description: string;
  version: string;
  author: string;
  timestamp: string;
  date: string;
  tags: string[];
  status: 'live' | 'rolling' | 'rolled-back';
}

const FALLBACK_CHANGES: ChangeEntry[] = [
  {
    id: 'c1',
    domain: 'SEXTANT',
    domainColor: '#0ea5e9',
    type: 'security',
    severity: 'major',
    title: 'Emergency patch: AIS transponder authentication bypass',
    description:
      'Critical vulnerability in transponder authentication. All vessel OT systems updated. No data compromise detected. CVE-2026-0441.',
    version: 'v4.2.1',
    author: 'PARAGON SOC',
    timestamp: '14:23',
    date: 'Apr 15',
    tags: ['security', 'critical', 'patch'],
    status: 'live',
  },
  {
    id: 'c2',
    domain: 'KORA',
    domainColor: '#f97316',
    type: 'feature',
    severity: 'minor',
    title: 'Route optimization v2 — ML-powered scheduling',
    description:
      'New ML model for predictive driver-route matching. Expected 18% improvement in on-time deliveries. Rolled out to 30% of traffic.',
    version: 'v3.8.0',
    author: 'KORA Eng Team',
    timestamp: '09:41',
    date: 'Apr 15',
    tags: ['ml', 'optimization', 'feature'],
    status: 'rolling',
  },
  {
    id: 'c3',
    domain: 'DOMAINE',
    domainColor: '#22c55e',
    type: 'deploy',
    severity: 'patch',
    title: 'Valuation model update — Q2 2026 comparable data',
    description:
      'Refreshed comparable transaction database with 1,240 new Q1 2026 transactions. Affects all portfolio valuations.',
    version: 'v2.11.4',
    author: 'DOMAINE Data Team',
    timestamp: '08:00',
    date: 'Apr 15',
    tags: ['data', 'valuation'],
    status: 'live',
  },
  {
    id: 'c4',
    domain: 'PARAGON',
    domainColor: '#ef4444',
    type: 'config',
    severity: 'minor',
    title: 'SOC playbook update — nation-state TTP signatures',
    description:
      'Added 47 new MITRE ATT&CK TTP signatures targeting maritime and energy sectors based on Q1 threat intel.',
    version: 'v5.1.2',
    author: 'James Okafor',
    timestamp: '07:15',
    date: 'Apr 15',
    tags: ['threat-intel', 'detection'],
    status: 'live',
  },
  {
    id: 'c5',
    domain: 'PRAXIS',
    domainColor: '#a855f7',
    type: 'feature',
    severity: 'major',
    title: 'Contract timeline automation — deadline tracking AI',
    description:
      'Governed contract lifecycle management. Auto-extracts deadlines, obligations, and renewal dates from uploaded agreements.',
    version: 'v2.4.0',
    author: 'PRISM Dev Team',
    timestamp: '16:30',
    date: 'Apr 14',
    tags: ['ai', 'contracts', 'automation'],
    status: 'live',
  },
  {
    id: 'c6',
    domain: 'SEXTANT',
    domainColor: '#0ea5e9',
    type: 'fix',
    severity: 'patch',
    title: 'Fuel consumption reporting precision fix',
    description:
      'Fixed rounding error causing ±0.3% variance in daily fuel consumption reports. Affects historical data from Jan–Mar 2026.',
    version: 'v4.2.0',
    author: 'Marcus Chen',
    timestamp: '14:55',
    date: 'Apr 14',
    tags: ['fix', 'reporting', 'data'],
    status: 'live',
  },
  {
    id: 'c7',
    domain: 'KORA',
    domainColor: '#f97316',
    type: 'breaking',
    severity: 'major',
    title: 'API v2 deprecation — legacy scheduler endpoints',
    description:
      'Deprecated /api/v1/schedule/* endpoints removed. All integrations must use v2 API. Migration guide published.',
    version: 'v3.7.0',
    author: 'KORA Platform Team',
    timestamp: '10:00',
    date: 'Apr 13',
    tags: ['breaking', 'api', 'deprecation'],
    status: 'live',
  },
  {
    id: 'c8',
    domain: 'Command',
    domainColor: '#8b7ac8',
    type: 'feature',
    severity: 'major',
    title: 'Ops Center launch — Alerts, Costs, SLA, Governance',
    description:
      'New operational workspaces added: Alert Inbox, Cost Analytics, SLA Dashboard, Governance Workflows, Health Score, and Smart Digest.',
    version: 'v2.0.0',
    author: 'Command Dev Team',
    timestamp: '09:00',
    date: 'Apr 13',
    tags: ['feature', 'ops', 'launch'],
    status: 'live',
  },
  {
    id: 'c9',
    domain: 'PARAGON',
    domainColor: '#ef4444',
    type: 'feature',
    severity: 'minor',
    title: 'Legal workspace — case management integration',
    description:
      'New Legal workspace added to PARAGON sidebar. Case file management, compliance tracking, and legal hold workflows.',
    version: 'v5.1.0',
    author: 'PARAGON Dev Team',
    timestamp: '15:00',
    date: 'Apr 12',
    tags: ['feature', 'legal'],
    status: 'live',
  },
  {
    id: 'c10',
    domain: 'DOMAINE',
    domainColor: '#22c55e',
    type: 'fix',
    severity: 'patch',
    title: 'Map overlay rendering fix for high-DPI displays',
    description:
      'Fixed property boundary rendering artifacts on Retina displays. Coordinate precision improved to 7 decimal places.',
    version: 'v2.11.3',
    author: 'DOMAINE Frontend',
    timestamp: '11:20',
    date: 'Apr 12',
    tags: ['fix', 'ui', 'maps'],
    status: 'live',
  },
  {
    id: 'c11',
    domain: 'SZL Holdings',
    domainColor: '#f59e0b',
    type: 'feature',
    severity: 'minor',
    title: 'FORGE entity added to navigation',
    description:
      'Forge client engagement module added to SZL Holdings navigation alongside Leadership workspace.',
    version: 'v1.9.0',
    author: 'SZL Dev Team',
    timestamp: '16:00',
    date: 'Apr 11',
    tags: ['feature', 'nav'],
    status: 'live',
  },
  {
    id: 'c12',
    domain: 'SEXTANT',
    domainColor: '#0ea5e9',
    type: 'config',
    severity: 'patch',
    title: 'Route watchlist expanded to 12 straits',
    description:
      'Added monitoring coverage for Lombok Strait, Torres Strait, and 2 additional high-risk zones per updated PARAGON threat assessment.',
    version: 'v4.1.9',
    author: 'Maritime Ops',
    timestamp: '09:30',
    date: 'Apr 10',
    tags: ['config', 'watchlist'],
    status: 'live',
  },
];

const TYPE_ICONS: Record<ChangeType, React.ElementType> = {
  deploy: Rocket,
  feature: Tag,
  fix: CheckCircle2,
  security: AlertTriangle,
  config: Clock,
  breaking: AlertTriangle,
};

const TYPE_COLORS: Record<ChangeType, string> = {
  deploy: '#8b7ac8',
  feature: '#22c55e',
  fix: '#0ea5e9',
  security: 'var(--color-critical)',
  config: 'var(--color-medium)',
  breaking: 'var(--color-high)',
};

const SEVERITY_COLORS: Record<ChangeSeverity, string> = {
  major: 'var(--color-high)',
  minor: '#8b7ac8',
  patch: 'var(--color-fg-muted)',
};

export default function ChangelogPage() {
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<ChangeType | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<ChangeSeverity | 'all'>('all');

  const { data: apiData } = useStandardQuery<ApiReleasesResponse>({
    queryKey: ['command-releases'],
    queryFn: async () => {
      const res = await fetch('/api/command/releases', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load releases');
      const json = await res.json();
      return (json?.data ?? json) as ApiReleasesResponse;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const CHANGES: ChangeEntry[] = apiData?.releases ?? FALLBACK_CHANGES;
  const domains = Array.from(new Set(CHANGES.map((c) => c.domain)));

  const filtered = CHANGES.filter((c) => {
    const s = search.toLowerCase();
    if (s && !c.title.toLowerCase().includes(s) && !c.description.toLowerCase().includes(s))
      return false;
    if (domainFilter !== 'all' && c.domain !== domainFilter) return false;
    if (typeFilter !== 'all' && c.type !== typeFilter) return false;
    if (severityFilter !== 'all' && c.severity !== severityFilter) return false;
    return true;
  });

  const grouped: Record<string, ChangeEntry[]> = {};
  filtered.forEach((c) => {
    if (!grouped[c.date]) grouped[c.date] = [];
    grouped[c.date].push(c);
  });

  return (
    <OpsLayout title="Release Feed">
      <div className="flex flex-col gap-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Deploys Today',
              value:
                apiData?.summary.deploysToday ??
                CHANGES.filter(
                  (c) =>
                    c.date ===
                    new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                ).length,
              color: '#8b7ac8',
            },
            {
              label: 'Total Releases',
              value: apiData?.summary.total ?? CHANGES.length,
              color: 'var(--color-low)',
            },
            {
              label: 'Security Updates',
              value: CHANGES.filter((c) => c.type === 'security').length,
              color: 'var(--color-critical)',
            },
            {
              label: 'Rolled Back',
              value:
                apiData?.summary.rolledBack ??
                CHANGES.filter((c) => c.status === 'rolled-back').length,
              color: 'var(--color-high)',
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="p-4 rounded-xl"
              style={{
                backgroundColor: 'var(--color-surface-base)',
                border: '1px solid var(--color-surface-border)',
              }}
            >
              <div className="text-2xl font-bold font-mono" style={{ color }}>
                {value}
              </div>
              <div
                className="text-[10px] font-mono uppercase tracking-wider mt-0.5"
                style={{ color: 'var(--color-fg-muted)' }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
              style={{ color: 'var(--color-fg-muted)' }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search changes..."
              className="w-full pl-9 pr-3 py-2 rounded-lg text-xs"
              style={{
                backgroundColor: 'var(--color-surface-base)',
                border: '1px solid var(--color-surface-border)',
                color: 'var(--color-fg-primary)',
              }}
            />
          </div>
          {[
            {
              value: domainFilter,
              onChange: (v: string) => setDomainFilter(v),
              options: [['all', 'All Domains'], ...domains.map((d) => [d, d])],
            },
            {
              value: typeFilter,
              onChange: (v: string) => setTypeFilter(v as ChangeType | 'all'),
              options: [
                ['all', 'All Types'],
                ['deploy', 'Deploy'],
                ['feature', 'Feature'],
                ['fix', 'Fix'],
                ['security', 'Security'],
                ['config', 'Config'],
                ['breaking', 'Breaking'],
              ],
            },
            {
              value: severityFilter,
              onChange: (v: string) => setSeverityFilter(v as ChangeSeverity | 'all'),
              options: [
                ['all', 'All Severity'],
                ['major', 'Major'],
                ['minor', 'Minor'],
                ['patch', 'Patch'],
              ],
            },
          ].map(({ value, onChange, options }, i) => (
            <select
              key={i}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="px-2 py-2 rounded-lg text-xs"
              style={{
                backgroundColor: 'var(--color-surface-base)',
                border: '1px solid var(--color-surface-border)',
                color: 'var(--color-fg-muted)',
              }}
            >
              {options.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          ))}
          <span className="text-xs font-mono ml-auto" style={{ color: 'var(--color-fg-muted)' }}>
            {filtered.length} entries
          </span>
        </div>

        {/* Timeline */}
        <div className="flex flex-col gap-8">
          {Object.entries(grouped).map(([date, entries]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: '#8b7ac8' }}
                >
                  {date}
                </div>
                <div
                  className="flex-1 h-px"
                  style={{ backgroundColor: 'var(--color-surface-border)' }}
                />
                <span className="text-[10px] font-mono" style={{ color: 'var(--color-fg-muted)' }}>
                  {entries.length} change{entries.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {entries.map((entry) => {
                  const TypeIcon = TYPE_ICONS[entry.type];
                  return (
                    <div
                      key={entry.id}
                      className="rounded-xl p-4 flex gap-4"
                      style={{
                        backgroundColor: 'var(--color-surface-base)',
                        border: '1px solid var(--color-surface-border)',
                        borderLeftWidth: '3px',
                        borderLeftColor: TYPE_COLORS[entry.type],
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${TYPE_COLORS[entry.type]} 12%, transparent)`,
                          border: `1px solid color-mix(in srgb, ${TYPE_COLORS[entry.type]} 25%, transparent)`,
                        }}
                      >
                        <TypeIcon
                          className="w-3.5 h-3.5"
                          style={{ color: TYPE_COLORS[entry.type] }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span
                            className="text-[10px] font-mono uppercase tracking-wider"
                            style={{ color: entry.domainColor }}
                          >
                            {entry.domain}
                          </span>
                          <span
                            className="text-[10px] font-mono"
                            style={{ color: 'var(--color-fg-muted)' }}
                          >
                            {entry.version}
                          </span>
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${TYPE_COLORS[entry.type]} 12%, transparent)`,
                              color: TYPE_COLORS[entry.type],
                            }}
                          >
                            {entry.type}
                          </span>
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${SEVERITY_COLORS[entry.severity]} 12%, transparent)`,
                              color: SEVERITY_COLORS[entry.severity],
                            }}
                          >
                            {entry.severity}
                          </span>
                          {entry.status === 'rolling' && (
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase animate-pulse"
                              style={{
                                backgroundColor:
                                  'color-mix(in srgb, var(--color-medium) 12%, transparent)',
                                color: 'var(--color-medium)',
                              }}
                            >
                              Rolling
                            </span>
                          )}
                        </div>
                        <div
                          className="text-sm font-semibold mb-1"
                          style={{ color: 'var(--color-fg-primary)' }}
                        >
                          {entry.title}
                        </div>
                        <div
                          className="text-xs leading-relaxed mb-2"
                          style={{ color: 'var(--color-fg-muted)' }}
                        >
                          {entry.description}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex flex-wrap gap-1">
                            {entry.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[9px] px-1.5 py-0.5 rounded"
                                style={{
                                  backgroundColor: 'var(--color-bg-elevated)',
                                  border: '1px solid var(--color-surface-border)',
                                  color: 'var(--color-fg-muted)',
                                }}
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                          <span
                            className="text-[10px] font-mono ml-auto"
                            style={{ color: 'var(--color-fg-muted)' }}
                          >
                            {entry.timestamp} · {entry.author}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </OpsLayout>
  );
}
