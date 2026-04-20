import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Database,
  Eye,
  Info,
  Lock,
  Minus,
  Shield,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

function MetricCard({
  label,
  value,
  unit,
  sub,
  trend,
  icon: Icon,
  color = '#f59e0b',
  tooltip,
}: {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  trend?: 'up' | 'down' | 'flat';
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color?: string;
  tooltip?: string;
}) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : '#6b7280';
  return (
    <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl p-5 flex flex-col gap-3 group relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[#8b9ab0] uppercase tracking-widest font-mono">
            {label}
          </span>
          {tooltip && (
            <span title={tooltip} className="cursor-help">
              <Info size={10} className="text-[#8b9ab0]" />
            </span>
          )}
        </div>
        <Icon size={16} color={color} />
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-white font-mono">{value}</span>
        {unit && <span className="text-sm text-[#8b9ab0] font-mono">{unit}</span>}
      </div>
      {sub && (
        <div className="flex items-center gap-1.5 text-xs">
          <TrendIcon size={12} color={trendColor} />
          <span style={{ color: trendColor }}>{sub}</span>
        </div>
      )}
    </div>
  );
}

const SCHEMA_VALIDITY_DATA = [
  { week: 'W-6', invalid: 8.2, valid: 91.8 },
  { week: 'W-5', invalid: 7.1, valid: 92.9 },
  { week: 'W-4', invalid: 6.4, valid: 93.6 },
  { week: 'W-3', invalid: 5.8, valid: 94.2 },
  { week: 'W-2', invalid: 4.9, valid: 95.1 },
  { week: 'W-1', invalid: 4.2, valid: 95.8 },
  { week: 'Now', invalid: 3.6, valid: 96.4 },
];

const HALLUCINATION_DATA = [
  { week: 'W-6', unsupported: 5.8, supported: 94.2 },
  { week: 'W-5', unsupported: 5.2, supported: 94.8 },
  { week: 'W-4', unsupported: 4.6, supported: 95.4 },
  { week: 'W-3', unsupported: 4.1, supported: 95.9 },
  { week: 'W-2', unsupported: 3.7, supported: 96.3 },
  { week: 'W-1', unsupported: 3.2, supported: 96.8 },
  { week: 'Now', unsupported: 2.8, supported: 97.2 },
];

const RETRIEVAL_MISS_DATA = [
  { week: 'W-6', miss: 13.4, hit: 86.6 },
  { week: 'W-5', miss: 12.8, hit: 87.2 },
  { week: 'W-4', miss: 11.9, hit: 88.1 },
  { week: 'W-3', miss: 10.7, hit: 89.3 },
  { week: 'W-2', miss: 9.4, hit: 90.6 },
  { week: 'W-1', miss: 8.2, hit: 91.8 },
  { week: 'Now', miss: 7.7, hit: 92.3 },
];

const POLICY_BLOCK_DATA = [
  { week: 'W-6', blocked: 31, overridden: 4, honored: 27 },
  { week: 'W-5', blocked: 28, overridden: 3, honored: 25 },
  { week: 'W-4', blocked: 25, overridden: 5, honored: 20 },
  { week: 'W-3', blocked: 22, overridden: 2, honored: 20 },
  { week: 'W-2', blocked: 19, overridden: 3, honored: 16 },
  { week: 'W-1', blocked: 16, overridden: 1, honored: 15 },
  { week: 'Now', blocked: 22, overridden: 2, honored: 20 },
];

const OVERRIDE_DETAIL = [
  {
    id: 'OVR-012',
    action: 'Cross-tenant data query attempt',
    blockedBy: 'tenant_isolation',
    overriddenBy: 'M. Walsh',
    reason: 'Authorized cross-client IR engagement',
    at: '2h ago',
    riskRating: 'high',
  },
  {
    id: 'OVR-011',
    action: 'Direct DB write without proposal mode',
    blockedBy: 'execution_gate',
    overriddenBy: 'J. Chen',
    reason: 'Emergency containment action approved verbally',
    at: '6h ago',
    riskRating: 'critical',
  },
  {
    id: 'OVR-010',
    action: 'Model cost ceiling exceeded',
    blockedBy: 'cost_ceiling',
    overriddenBy: 'R. Patel',
    reason: 'Large evidence processing batch — approved by ops lead',
    at: '1d ago',
    riskRating: 'medium',
  },
];

const TRUST_POSTURE_ITEMS = [
  { label: 'Schema validation enforced on all tool outputs', status: 'active', since: 'Phase 2' },
  {
    label: 'Hallucination detection via claim-to-evidence matching',
    status: 'active',
    since: 'Phase 2',
  },
  { label: 'Retrieval confidence scored on all RAG responses', status: 'active', since: 'Phase 2' },
  {
    label: 'Policy-block audit logged on every enforcement action',
    status: 'active',
    since: 'Phase 3',
  },
  {
    label: 'Override requires human attestation with justification',
    status: 'active',
    since: 'Phase 3',
  },
  { label: 'Trust posture published and version-controlled', status: 'active', since: 'Phase 3' },
  {
    label: 'No fake certifications or vague military-grade claims',
    status: 'active',
    since: 'Phase 1',
  },
  {
    label: 'Current vs future capabilities clearly separated in all docs',
    status: 'active',
    since: 'Phase 3',
  },
  {
    label: 'SOC 2 Type II audit (in planning — not yet achieved)',
    status: 'planned',
    since: 'Roadmap',
  },
  {
    label: 'ISO 27001 certification (in planning — not yet achieved)',
    status: 'planned',
    since: 'Roadmap',
  },
];

export default function TrustAnalyticsPage() {
  return (
    <div className="min-h-screen bg-[#07090d] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Shield size={22} className="text-amber-400" />
            <h1 className="text-xl font-bold text-white font-mono tracking-tight">
              Trust Analytics
            </h1>
          </div>
          <p className="text-xs text-[#8b9ab0] font-mono">
            Schema validity · Hallucination/unsupported claim rate · Retrieval miss rate ·
            Policy-block rate · Override rate
          </p>
        </div>

        <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-4 flex items-start gap-3">
          <Info size={16} className="text-amber-400 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-xs text-amber-200/80 font-mono leading-relaxed">
              The trust posture checklist below reflects actual system capabilities. Trend charts
              use <strong>seeded pilot data</strong> — a live trust metrics pipeline (collecting
              schema validity, retrieval miss rate, and override rate from production API call logs)
              is on the Phase 4 roadmap.
            </p>
            <p className="text-xs text-amber-200/60 font-mono">
              No certifications are claimed that have not been achieved. SOC 2 and ISO 27001 are
              planned.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-amber-400/10 border border-amber-400/20 text-xs text-amber-400 font-mono">
          <Info size={12} />
          <span>
            Trend metrics below use seeded pilot data — live instrumentation is a Phase 4 roadmap
            item
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Invalid Schema Rate"
            value="3.6%"
            sub="Pilot trend data"
            trend="up"
            icon={AlertTriangle}
            color="#f59e0b"
            tooltip="% of tool call outputs failing schema validation"
          />
          <MetricCard
            label="Unsupported Claim Rate"
            value="2.8%"
            sub="Pilot trend data"
            trend="up"
            icon={Eye}
            color="#f59e0b"
            tooltip="% of AI assertions with no retrieval support"
          />
          <MetricCard
            label="Retrieval Miss Rate"
            value="7.7%"
            sub="Pilot trend data"
            trend="up"
            icon={Database}
            color="#f59e0b"
            tooltip="% of RAG queries returning no relevant chunks"
          />
          <MetricCard
            label="Policy Override Rate"
            value="9.1%"
            sub="Pilot trend data"
            trend="flat"
            icon={Lock}
            color="#ef4444"
            tooltip="% of policy blocks subsequently overridden by a human"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl p-5">
            <h3 className="text-xs text-[#8b9ab0] uppercase tracking-widest font-mono mb-1">
              Invalid Schema Rate — 7 Weeks (%)
            </h3>
            <p className="text-xs text-[#8b9ab0]/60 mb-4 font-mono">
              Lower is better. Target: &lt;2%
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={SCHEMA_VALIDITY_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                <XAxis dataKey="week" tick={{ fill: '#8b9ab0', fontSize: 10 }} />
                <YAxis tick={{ fill: '#8b9ab0', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0d1117',
                    border: '1px solid #1e2a3a',
                    borderRadius: 8,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="invalid"
                  stroke="#ef4444"
                  fill="#ef444422"
                  strokeWidth={2}
                  name="Invalid %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl p-5">
            <h3 className="text-xs text-[#8b9ab0] uppercase tracking-widest font-mono mb-1">
              Unsupported Claim Rate — 7 Weeks (%)
            </h3>
            <p className="text-xs text-[#8b9ab0]/60 mb-4 font-mono">
              Lower is better. Target: &lt;1%
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={HALLUCINATION_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                <XAxis dataKey="week" tick={{ fill: '#8b9ab0', fontSize: 10 }} />
                <YAxis tick={{ fill: '#8b9ab0', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0d1117',
                    border: '1px solid #1e2a3a',
                    borderRadius: 8,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="unsupported"
                  stroke="#f97316"
                  fill="#f9731622"
                  strokeWidth={2}
                  name="Unsupported %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl p-5">
            <h3 className="text-xs text-[#8b9ab0] uppercase tracking-widest font-mono mb-1">
              Retrieval Miss Rate — 7 Weeks (%)
            </h3>
            <p className="text-xs text-[#8b9ab0]/60 mb-4 font-mono">
              Lower is better. Target: &lt;5%
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={RETRIEVAL_MISS_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                <XAxis dataKey="week" tick={{ fill: '#8b9ab0', fontSize: 10 }} />
                <YAxis tick={{ fill: '#8b9ab0', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0d1117',
                    border: '1px solid #1e2a3a',
                    borderRadius: 8,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="miss"
                  stroke="#f59e0b"
                  fill="#f59e0b22"
                  strokeWidth={2}
                  name="Miss %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl p-5">
            <h3 className="text-xs text-[#8b9ab0] uppercase tracking-widest font-mono mb-1">
              Policy Blocks & Overrides — 7 Weeks
            </h3>
            <p className="text-xs text-[#8b9ab0]/60 mb-4 font-mono">
              Every override is logged with justification and reviewer
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={POLICY_BLOCK_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                <XAxis dataKey="week" tick={{ fill: '#8b9ab0', fontSize: 10 }} />
                <YAxis tick={{ fill: '#8b9ab0', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0d1117',
                    border: '1px solid #1e2a3a',
                    borderRadius: 8,
                  }}
                />
                <Bar
                  dataKey="honored"
                  fill="#22c55e"
                  stackId="a"
                  radius={[0, 0, 0, 0]}
                  name="Honored"
                />
                <Bar
                  dataKey="overridden"
                  fill="#ef4444"
                  stackId="a"
                  radius={[4, 4, 0, 0]}
                  name="Overridden"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl p-5">
          <h3 className="text-xs text-[#8b9ab0] uppercase tracking-widest font-mono mb-4">
            Override Detail Log
          </h3>
          <div className="space-y-3">
            {OVERRIDE_DETAIL.map((o) => (
              <div
                key={o.id}
                className="p-3 bg-[#0a0f16] border border-[#1e2a3a] rounded-lg space-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[#8b9ab0]">{o.id}</span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded font-mono font-bold ${o.riskRating === 'critical' ? 'bg-red-500/20 text-red-400' : o.riskRating === 'high' ? 'bg-orange-500/20 text-orange-400' : 'bg-amber-500/20 text-amber-400'}`}
                    >
                      {o.riskRating.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs text-[#8b9ab0] font-mono">{o.at}</span>
                </div>
                <p className="text-xs text-white">{o.action}</p>
                <div className="flex items-center gap-4 text-xs text-[#8b9ab0] font-mono">
                  <span>
                    blocked by: <span className="text-amber-400">{o.blockedBy}</span>
                  </span>
                  <span>
                    overridden by: <span className="text-white">{o.overriddenBy}</span>
                  </span>
                </div>
                <p className="text-xs text-[#8b9ab0] italic">"{o.reason}"</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl p-5">
          <h3 className="text-xs text-[#8b9ab0] uppercase tracking-widest font-mono mb-4">
            Trust Posture — Current State
          </h3>
          <div className="space-y-2">
            {TRUST_POSTURE_ITEMS.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#0a0f16] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  {item.status === 'active' ? (
                    <CheckCircle2 size={14} className="text-green-400 shrink-0" />
                  ) : (
                    <Info size={14} className="text-amber-400 shrink-0" />
                  )}
                  <span className="text-xs text-white">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-mono ${item.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}
                  >
                    {item.status === 'active' ? 'Active' : 'Planned'}
                  </span>
                  <span className="text-xs text-[#8b9ab0] font-mono">{item.since}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
