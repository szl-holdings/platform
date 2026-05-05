import React from 'react';
import { useAdminUsage } from '@/lib/api-hooks';
import { Badge, Input } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { AlertTriangle, BellRing } from 'lucide-react';

function overageBadge(state: 'none' | 'warn' | 'over') {
  if (state === 'over') return <Badge variant="error">Over</Badge>;
  if (state === 'warn') return <Badge variant="partial">Warn</Badge>;
  return <span className="text-[#666] text-xs font-mono">—</span>;
}

function AlertSentBadge({
  lastAlertSentAt,
  alertThresholdsFired,
}: {
  lastAlertSentAt: string | null;
  alertThresholdsFired: { meterKey: string; threshold: number; notifiedAt: string }[];
}) {
  if (!lastAlertSentAt) {
    return <span className="text-[#666] text-xs font-mono">No alerts</span>;
  }

  const thresholds = Array.from(new Set(alertThresholdsFired.map((a) => a.threshold))).sort(
    (a, b) => b - a,
  );
  const visibleThresholds = thresholds.filter((t) => t >= 80);
  const labelThresholds = visibleThresholds.length > 0 ? visibleThresholds : thresholds;

  const tooltip = alertThresholdsFired
    .map((a) => `${a.threshold}% on ${a.meterKey} — ${formatDate(a.notifiedAt)}`)
    .join('\n');

  return (
    <div
      className="flex flex-col gap-1"
      title={tooltip}
    >
      <div className="inline-flex items-center gap-1.5 text-xs">
        <BellRing className="w-3.5 h-3.5 text-[#d4a853]" aria-hidden="true" />
        <span className="font-mono text-[#d4a853]">Alert sent</span>
      </div>
      <div className="text-[11px] font-mono text-[#8a8a8a]">
        {labelThresholds.map((t) => `${t}%`).join(' · ')} · {formatDate(lastAlertSentAt)}
      </div>
    </div>
  );
}

export default function AdminUsagePage() {
  const [orgSearch, setOrgSearch] = React.useState('');
  const [plan, setPlan] = React.useState<string>('');

  const { data, isLoading, error } = useAdminUsage({
    org: orgSearch || undefined,
    plan: plan || undefined,
    limit: 100,
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-[#f5f5f5]">
            Admin · Cross-Tenant Usage
          </h1>
          <p className="text-sm text-[#8a8a8a] mt-1">
            Per-org usage, quota status, and overage alert history for the current billing period.
          </p>
        </div>
        {data?.totals ? (
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-[#8a8a8a]">
              Orgs: <span className="text-[#f5f5f5]">{data.totals.orgs}</span>
            </span>
            <span className="text-[#8a8a8a]">
              Over: <span className="text-[#b85450]">{data.totals.overageCount}</span>
            </span>
            <span className="text-[#8a8a8a]">
              Warn: <span className="text-[#d4a853]">{data.totals.warnCount}</span>
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="Filter by org name or slug…"
          value={orgSearch}
          onChange={(e) => setOrgSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm text-[#f5f5f5]"
        >
          <option value="">All plans</option>
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="professional">Professional</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      {error ? (
        <div className="flex items-center gap-2 p-4 rounded-md border border-[#b85450]/30 bg-[#b85450]/5 text-sm text-[#b85450]">
          <AlertTriangle className="w-4 h-4" />
          Failed to load usage data: {(error as Error).message}
        </div>
      ) : null}

      <div className="border border-[rgba(255,255,255,0.06)] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#111] text-[11px] uppercase tracking-widest text-[#8a8a8a]">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Org</th>
              <th className="text-left px-4 py-3 font-medium">Plan</th>
              <th className="text-right px-4 py-3 font-medium">API calls</th>
              <th className="text-right px-4 py-3 font-medium">Members</th>
              <th className="text-right px-4 py-3 font-medium">Storage (MB)</th>
              <th className="text-left px-4 py-3 font-medium">Overage</th>
              <th className="text-left px-4 py-3 font-medium">Alert status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-[#8a8a8a] text-xs">
                  Loading…
                </td>
              </tr>
            ) : data?.rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-[#8a8a8a] text-xs">
                  No orgs match the current filters.
                </td>
              </tr>
            ) : (
              data?.rows.map((row) => (
                <tr key={row.orgId} className="border-t border-[rgba(255,255,255,0.04)] hover:bg-[#111]">
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#f5f5f5]">{row.orgName}</div>
                    <div className="text-[11px] font-mono text-[#666]">{row.orgSlug}</div>
                  </td>
                  <td className="px-4 py-3 text-[#c9b787] text-xs font-mono uppercase">{row.plan}</td>
                  <td className="px-4 py-3 text-right font-mono text-[#f5f5f5]">
                    {row.apiCalls.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[#f5f5f5]">{row.members}</td>
                  <td className="px-4 py-3 text-right font-mono text-[#f5f5f5]">
                    {row.storageMB.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {overageBadge(row.overages.apiCalls)}
                      {overageBadge(row.overages.members)}
                      {overageBadge(row.overages.storage)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <AlertSentBadge
                      lastAlertSentAt={row.lastAlertSentAt}
                      alertThresholdsFired={row.alertThresholdsFired}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
