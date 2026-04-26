import { useStandardQuery } from '@szl-holdings/api-client-react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Info,
  Minus,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '@/lib/api';

interface Incident {
  id: number;
  status: string;
  severity: string;
  assignedAnalyst?: string;
  title?: string;
}
interface Finding {
  id: number;
  severity: string;
  status: string;
}

function DemoDataBanner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#c9b787]/10 border border-[#c9b787]/20 text-xs text-[#c9b787] font-mono">
      <Info size={12} />
      <span>{label} — seeded pilot data, not yet wired to live pipeline</span>
    </div>
  );
}

function MetricCard({
  label,
  value,
  unit,
  sub,
  trend,
  icon: Icon,
  color = '#c9b787',
}: {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  trend?: 'up' | 'down' | 'flat';
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color?: string;
}) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? '#c9b787' : trend === 'down' ? '#f5f5f5' : '#6b7280';
  return (
    <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#8b9ab0] uppercase tracking-widest font-mono">{label}</span>
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

const MTTD_DATA = [
  { week: 'W-6', mttd: 42, mttr: 310 },
  { week: 'W-5', mttd: 38, mttr: 285 },
  { week: 'W-4', mttd: 35, mttr: 262 },
  { week: 'W-3', mttd: 31, mttr: 240 },
  { week: 'W-2', mttd: 29, mttr: 218 },
  { week: 'W-1', mttd: 24, mttr: 195 },
  { week: 'Now', mttd: 21, mttr: 178 },
];

const ESCALATION_DATA = [
  { week: 'W-6', escalated: 8, total: 18, rate: 44 },
  { week: 'W-5', escalated: 7, total: 20, rate: 35 },
  { week: 'W-4', escalated: 9, total: 22, rate: 41 },
  { week: 'W-3', escalated: 6, total: 19, rate: 32 },
  { week: 'W-2', escalated: 5, total: 21, rate: 24 },
  { week: 'W-1', escalated: 4, total: 17, rate: 24 },
  { week: 'Now', escalated: 3, total: 14, rate: 21 },
];

const APPROVAL_DELAY_DATA = [
  { severity: 'Critical', avgDelayMin: 18, slaMin: 30 },
  { severity: 'High', avgDelayMin: 47, slaMin: 60 },
  { severity: 'Medium', avgDelayMin: 112, slaMin: 240 },
  { severity: 'Low', avgDelayMin: 480, slaMin: 1440 },
];

const ANALYST_WORKLOAD = [
  { analyst: 'J. Chen', active: 5, closed: 23, escalated: 2, avgMttr: 165 },
  { analyst: 'L. Kim', active: 3, closed: 31, escalated: 1, avgMttr: 148 },
  { analyst: 'M. Walsh', active: 7, closed: 18, escalated: 4, avgMttr: 210 },
  { analyst: 'R. Patel', active: 4, closed: 27, escalated: 2, avgMttr: 172 },
  { analyst: 'S. Torres', active: 2, closed: 15, escalated: 0, avgMttr: 135 },
];

const RESOLUTION_BY_SEVERITY = [
  { name: 'Critical', value: 12, color: '#f5f5f5' },
  { name: 'High', value: 28, color: '#c9b787' },
  { name: 'Medium', value: 45, color: '#c9b787' },
  { name: 'Low', value: 15, color: '#c9b787' },
];

export default function IncidentAnalyticsPage() {
  const { data: incidents } = useStandardQuery<Incident[]>({
    queryKey: ['incidents'],
    queryFn: () => api.incidents.list(),
  });
  const { data: findings } = useStandardQuery<Finding[]>({
    queryKey: ['findings'],
    queryFn: () => api.findings.list(),
  });
  const closedIncidents = incidents?.filter((i) => i.status === 'closed') ?? [];
  const activeIncidents = incidents?.filter((i) => i.status !== 'closed') ?? [];
  const _criticalFindings =
    findings?.filter((f) => f.severity === 'critical' && f.status !== 'mitigated').length ?? 0;
  const totalIncidents = incidents?.length ?? 0;
  const resolutionRate =
    totalIncidents > 0 ? Math.round((closedIncidents.length / totalIncidents) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#07090d] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-3 mb-1">
          <Activity size={22} className="text-[#c9b787]" />
          <h1 className="text-xl font-bold text-white font-mono tracking-tight">
            Incident Analytics
          </h1>
        </div>
        <p className="text-xs text-[#8b9ab0] font-mono -mt-6">
          MTTD · MTTR · Escalation rate · Approval delay · Resolution rate · Analyst workload
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Mean Time to Detect"
            value="21"
            unit="min"
            sub="Pilot demo data"
            trend="up"
            icon={Clock}
            color="#c9b787"
          />
          <MetricCard
            label="Mean Time to Respond"
            value="178"
            unit="min"
            sub="Pilot demo data"
            trend="up"
            icon={Target}
            color="#c9b787"
          />
          <MetricCard
            label="Active Incidents"
            value={activeIncidents.length}
            unit=""
            sub={`${totalIncidents} total in system`}
            trend="flat"
            icon={AlertTriangle}
            color="#c9b787"
          />
          <MetricCard
            label="Resolution Rate"
            value={`${resolutionRate}%`}
            sub={`${closedIncidents.length} of ${totalIncidents} closed`}
            trend="up"
            icon={CheckCircle2}
            color="#c9b787"
          />
        </div>

        <DemoDataBanner label="MTTD/MTTR trends, escalation rates, approval delay, analyst workload" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl p-5">
            <h3 className="text-xs text-[#8b9ab0] uppercase tracking-widest font-mono mb-4">
              MTTD & MTTR Trend — 7 Weeks
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={MTTD_DATA}>
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
                <Line
                  type="monotone"
                  dataKey="mttd"
                  stroke="#c9b787"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="MTTD (min)"
                />
                <Line
                  type="monotone"
                  dataKey="mttr"
                  stroke="#c9b787"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="MTTR (min)"
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2">
              {[
                { label: 'MTTD (min)', color: '#c9b787' },
                { label: 'MTTR (min)', color: '#c9b787' },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1">
                  <div className="w-3 h-0.5" style={{ backgroundColor: l.color }} />
                  <span className="text-xs text-[#8b9ab0]">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl p-5">
            <h3 className="text-xs text-[#8b9ab0] uppercase tracking-widest font-mono mb-4">
              Escalation Rate — 7 Weeks (%)
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ESCALATION_DATA}>
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
                <Bar dataKey="rate" fill="#c9b787" radius={[4, 4, 0, 0]} name="Escalation %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl p-5">
            <h3 className="text-xs text-[#8b9ab0] uppercase tracking-widest font-mono mb-4">
              Approval Delay vs SLA (minutes)
            </h3>
            <div className="space-y-4">
              {APPROVAL_DELAY_DATA.map((d) => (
                <div key={d.severity} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-white">{d.severity}</span>
                    <span className="text-[#8b9ab0]">
                      {d.avgDelayMin}min avg / {d.slaMin}min SLA
                    </span>
                  </div>
                  <div className="h-2 bg-[#1e2a3a] rounded-full overflow-hidden relative">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (d.avgDelayMin / d.slaMin) * 100)}%`,
                        backgroundColor:
                          d.avgDelayMin > d.slaMin * 0.8
                            ? '#f5f5f5'
                            : d.avgDelayMin > d.slaMin * 0.5
                              ? '#c9b787'
                              : '#c9b787',
                      }}
                    />
                    <div
                      className="absolute top-0 bottom-0 border-r-2 border-white/30"
                      style={{ left: '80%' }}
                      title="80% SLA"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl p-5">
            <h3 className="text-xs text-[#8b9ab0] uppercase tracking-widest font-mono mb-4">
              Resolution by Severity
            </h3>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie
                    data={RESOLUTION_BY_SEVERITY}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                  >
                    {RESOLUTION_BY_SEVERITY.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {RESOLUTION_BY_SEVERITY.map((s) => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="text-xs text-[#8b9ab0]">{s.name}</span>
                    </div>
                    <span className="text-xs text-white font-mono">{s.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl p-5">
          <h3 className="text-xs text-[#8b9ab0] uppercase tracking-widest font-mono mb-4">
            Analyst Workload
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-[#1e2a3a]">
                  {['Analyst', 'Active Cases', 'Closed (30d)', 'Escalated', 'Avg MTTR'].map((h) => (
                    <th
                      key={h}
                      className="text-left text-[#8b9ab0] pb-3 pr-6 font-normal uppercase tracking-widest"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0d1117]">
                {ANALYST_WORKLOAD.map((a) => (
                  <tr key={a.analyst} className="hover:bg-[#0a0f16] transition-colors">
                    <td className="py-3 pr-6 text-white">{a.analyst}</td>
                    <td className="py-3 pr-6">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${a.active >= 6 ? 'bg-[#f5f5f5]/20 text-[#f5f5f5]' : a.active >= 4 ? 'bg-[#c9b787]/20 text-[#c9b787]' : 'bg-[#c9b787]/20 text-[#c9b787]'}`}
                      >
                        {a.active}
                      </span>
                    </td>
                    <td className="py-3 pr-6 text-[#8b9ab0]">{a.closed}</td>
                    <td className="py-3 pr-6">
                      <span className={a.escalated > 2 ? 'text-[#f5f5f5]' : 'text-[#8b9ab0]'}>
                        {a.escalated}
                      </span>
                    </td>
                    <td className="py-3 pr-6">
                      <span
                        className={
                          a.avgMttr > 200
                            ? 'text-[#f5f5f5]'
                            : a.avgMttr > 160
                              ? 'text-[#c9b787]'
                              : 'text-[#c9b787]'
                        }
                      >
                        {a.avgMttr}min
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
