import { useStandardQuery } from '@szl-holdings/api-client-react';
import { HelpTip } from '@szl-holdings/shared-ui/onboarding';
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  GitMerge,
  RefreshCw,
  Shield,
  Tag,
} from 'lucide-react';
import { useState } from 'react';

const ACCENT = '#40856a';
const API = '/api';

function fetchCovenants() {
  return fetch(`${API}/terra/cognitive/covenants`)
    .then((r) => r.json())
    .then((d) => d.data ?? d);
}

async function runScan() {
  const r = await fetch(`${API}/terra/cognitive/covenants/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  return r.json();
}

const STATUS_CONFIG: Record<string, { color: string; Icon: typeof CheckCircle; label: string }> = {
  breach: { color: '#c04a2a', Icon: AlertTriangle, label: 'Breach' },
  watch: { color: '#c8a060', Icon: Clock, label: 'Watch' },
  compliant: { color: '#40856a', Icon: CheckCircle, label: 'Compliant' },
};

function ConfidencePill({ value }: { value: number }) {
  const color = value >= 0.85 ? '#40856a' : value >= 0.65 ? '#c8a060' : '#c04a2a';
  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-mono"
      style={{ background: `${color}18`, border: `1px solid ${color}30`, color }}
    >
      {(value * 100).toFixed(0)}% conf
    </span>
  );
}

function CovenantCard({ covenant }: { covenant: any }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[covenant.status] ?? STATUS_CONFIG.compliant;
  const Icon = cfg.Icon;
  const isBreachOrWatch = covenant.status === 'breach' || covenant.status === 'watch';
  const pct = covenant.current / covenant.threshold;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        border: `1px solid ${covenant.status === 'breach' ? 'rgba(192,74,42,0.25)' : covenant.status === 'watch' ? 'rgba(200,160,96,0.2)' : 'rgba(255,255,255,0.06)'}`,
      }}
    >
      <div
        className="p-4"
        style={{
          background:
            covenant.status === 'breach' ? 'rgba(192,74,42,0.05)' : 'rgba(255,255,255,0.02)',
        }}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg flex-shrink-0" style={{ background: `${cfg.color}18` }}>
            <Icon className="w-4 h-4" style={{ color: cfg.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <div className="text-sm font-semibold" style={{ color: '#e8edf8' }}>
                  {covenant.property}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {covenant.lender} · {covenant.label}
                </div>
              </div>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                style={{ background: `${cfg.color}18`, color: cfg.color }}
              >
                {cfg.label}
              </span>
            </div>

            <div className="mt-3 mb-2">
              <div
                className="flex justify-between text-[10px] mb-1"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                <span>
                  Current:{' '}
                  <span
                    className="font-mono font-semibold"
                    style={{ color: isBreachOrWatch ? cfg.color : '#e8edf8' }}
                  >
                    {covenant.type === 'ltv' || covenant.type === 'occupancy'
                      ? `${(covenant.current * 100).toFixed(0)}%`
                      : covenant.current.toFixed(2) + 'x'}
                  </span>
                </span>
                <span>
                  Threshold:{' '}
                  <span className="font-mono font-semibold" style={{ color: '#e8edf8' }}>
                    {covenant.type === 'ltv' || covenant.type === 'occupancy'
                      ? `${(covenant.threshold * 100).toFixed(0)}%`
                      : covenant.threshold.toFixed(2) + 'x'}
                  </span>
                </span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(pct * 100, 100)}%`,
                    background:
                      covenant.status === 'breach'
                        ? '#c04a2a'
                        : covenant.status === 'watch'
                          ? '#c8a060'
                          : ACCENT,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {covenant.breachDate && (
                <span className="flex items-center gap-1 text-[9px]" style={{ color: '#c04a2a' }}>
                  <AlertTriangle className="w-2.5 h-2.5" />
                  Breach: {covenant.breachDate}
                </span>
              )}
              {covenant.remedyDeadline && (
                <span className="flex items-center gap-1 text-[9px]" style={{ color: '#c8a060' }}>
                  <Clock className="w-2.5 h-2.5" />
                  Remedy by: {covenant.remedyDeadline}
                </span>
              )}
              {covenant.pendingApproval && (
                <span
                  className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(74,125,200,0.15)', color: '#4a7dc8' }}
                >
                  <GitMerge className="w-2.5 h-2.5" />
                  Approval pending
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mt-3 text-[10px] transition-colors"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          Evidence chain ({covenant.evidence?.length ?? 0})
        </button>
      </div>

      {expanded && covenant.evidence?.length > 0 && (
        <div
          className="p-4 space-y-2"
          style={{ background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.04)' }}
        >
          {covenant.evidence.map((ev: any, i: number) => (
            <div
              key={i}
              className="flex items-start gap-2 p-2 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              <FileText className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: ACCENT }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-medium" style={{ color: '#e8edf8' }}>
                    {ev.source}
                  </span>
                  <ConfidencePill value={ev.confidence} />
                </div>
                <div
                  className="text-[10px] mt-0.5 italic"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  {ev.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CovenantMonitoringPage() {
  const { data, isLoading, refetch } = useStandardQuery({
    queryKey: ['terra-covenants'],
    queryFn: fetchCovenants,
  });

  const covenants: any[] = data?.covenants ?? [];
  const summary = data?.summary;
  const skill = data?.scheduledSkill;
  const prov = data?.provenance;

  return (
    <div style={{ padding: '28px 28px 40px', maxWidth: 1280, margin: '0 auto' }}>
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4" style={{ color: ACCENT }} />
            <h1
              className="text-xl font-semibold flex items-center gap-1.5"
              style={{ color: '#e8edf8' }}
            >
              Covenant Monitoring
              <HelpTip
                tipId="terra.covenant-monitoring"
                platform="terra"
                title="Covenant Monitoring"
                content="A scheduled skill that re-evaluates loan covenants — DSCR, LTV, occupancy, payment status — across every active position. Any breach automatically opens a guardian approval, never a silent override."
                accentColor="#84cc16"
                iconSize={13}
              />
            </h1>
          </div>
          <p className="text-sm" style={{ color: '#94a3b8' }}>
            Scheduled skill tracks loan covenants across all active positions. Violations
            automatically create guardian approvals.
          </p>
        </div>
        <button
          onClick={async () => {
            try {
              await runScan();
            } catch {
              /* swallowed; refetch will reflect cached state */
            }
            refetch();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}30`, color: ACCENT }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Run Check
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div
            className="w-5 h-5 border-2 rounded-full animate-spin"
            style={{ borderColor: `${ACCENT}30`, borderTopColor: ACCENT }}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Covenants', value: summary?.total ?? 0, color: '#64748b' },
              { label: 'In Breach', value: summary?.breach ?? 0, color: '#c04a2a' },
              { label: 'Watch', value: summary?.watch ?? 0, color: '#c8a060' },
              {
                label: 'Pending Approvals',
                value: summary?.pendingApprovals ?? 0,
                color: '#4a7dc8',
              },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded-xl p-4"
                style={{ background: `${m.color}08`, border: `1px solid ${m.color}20` }}
              >
                <Bell className="w-3.5 h-3.5 mb-2" style={{ color: m.color }} />
                <div
                  className="text-2xl font-bold font-mono"
                  style={{
                    color: m.value > 0 && m.label !== 'Total Covenants' ? m.color : '#e8edf8',
                  }}
                >
                  {m.value}
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {m.label}
                </div>
              </div>
            ))}
          </div>

          {skill && (
            <div
              className="rounded-xl p-4"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: ACCENT }}
                  />
                  <span className="text-xs font-semibold" style={{ color: ACCENT }}>
                    Scheduled Skill Active
                  </span>
                </div>
                <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {skill.name}
                </span>
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  · {skill.cadence}
                </span>
                <div
                  className="ml-auto flex items-center gap-3 text-[10px]"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  <span>Last: {new Date(skill.lastRun).toLocaleString()}</span>
                  <span>Next: {new Date(skill.nextRun).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-3">
              {covenants.map((c) => (
                <CovenantCard key={c.id} covenant={c} />
              ))}
            </div>

            <div className="space-y-4">
              <div
                className="rounded-xl p-4"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  className="text-xs font-semibold mb-3 uppercase tracking-wider"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  Covenant Types Monitored
                </div>
                {[
                  {
                    label: 'DSCR (Debt Service Coverage)',
                    desc: 'Minimum cash flow vs debt payments',
                    active: true,
                  },
                  {
                    label: 'LTV (Loan-to-Value)',
                    desc: 'Property value vs outstanding debt',
                    active: true,
                  },
                  { label: 'Occupancy', desc: 'Minimum physical/economic occupancy', active: true },
                  {
                    label: 'Debt Yield',
                    desc: 'NOI divided by outstanding loan balance',
                    active: true,
                  },
                  {
                    label: 'Capital Reserve',
                    desc: 'Required reserve fund maintenance',
                    active: false,
                  },
                ].map((t) => (
                  <div
                    key={t.label}
                    className="flex items-start gap-2 py-2"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                      style={{ background: t.active ? ACCENT : 'rgba(255,255,255,0.15)' }}
                    />
                    <div>
                      <div
                        className="text-xs font-medium"
                        style={{ color: t.active ? '#e8edf8' : 'rgba(255,255,255,0.3)' }}
                      >
                        {t.label}
                      </div>
                      <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        {t.desc}
                      </div>
                    </div>
                    <span
                      className="ml-auto text-[9px]"
                      style={{ color: t.active ? ACCENT : 'rgba(255,255,255,0.2)' }}
                    >
                      {t.active ? 'Active' : 'Soon'}
                    </span>
                  </div>
                ))}
              </div>

              {prov && (
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                    <span
                      className="text-xs font-semibold"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                      Provenance
                    </span>
                  </div>
                  <div
                    className="text-[10px] font-mono mb-1"
                    style={{ color: 'rgba(255,255,255,0.3)' }}
                  >
                    {prov.source}
                  </div>
                  <div className="text-[9px]" style={{ color: 'rgba(64,133,106,0.5)' }}>
                    {prov.traceRef}
                  </div>
                  <div className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    {prov.runtime}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
