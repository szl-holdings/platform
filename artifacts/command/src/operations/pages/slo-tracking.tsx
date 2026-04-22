import { MetricTimeSeriesSimulator, seededRng } from '@szl-holdings/observability';
import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@szl-holdings/shared-ui/ui/card';
import { AlertTriangle, CheckCircle, Flame, Target, TrendingDown, Zap } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const sim = new MetricTimeSeriesSimulator(0x5010dead);
const _NOW = Date.now();

const sloStatuses = sim.generateSloStatuses([
  'api-gateway',
  'payment-service',
  'auth-service',
  'search-service',
  'checkout-api',
  'notification-worker',
  'inventory-api',
  'ml-inference',
]);

function burnRateSeries(slo: ReturnType<typeof sim.generateSloStatuses>[0], points = 24) {
  const seed = slo.service.split('').reduce((a, c) => a + c.charCodeAt(0), 0x1234);
  const rng = seededRng(seed);
  return Array.from({ length: points }, (_, i) => {
    const base = slo.errorBudgetConsumedPct;
    const burn = slo.burnRate1h;
    const budgetLeft = Math.max(0, 100 - base - (burn - 1) * i * 1.5 + rng.gauss(0, 3));
    return {
      hour: `${i}:00`,
      budget: parseFloat(budgetLeft.toFixed(1)),
      burnRate: parseFloat((burn * (1 + rng.gauss(0, 0.1))).toFixed(2)),
    };
  });
}

const burnData = sloStatuses.slice(0, 4).map((slo) => ({
  slo,
  series: burnRateSeries(slo),
}));

const statusColors: Record<string, { text: string; bg: string; border: string; badge: string }> = {
  healthy: {
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    badge: 'text-emerald-400 border-emerald-500/20',
  },
  at_risk: {
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    badge: 'text-amber-400 border-amber-500/20',
  },
  burning: {
    text: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    badge: 'text-orange-400 border-orange-500/20',
  },
  exhausted: {
    text: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    badge: 'text-red-400 border-red-500/20',
  },
};

const burnRateLineColors = ['#c45a4a', '#c8953c', '#6b8f71', '#4a90b8'];

export default function SLOTracking() {
  const critical = sloStatuses.filter((s) => s.status === 'exhausted').length;
  const burning = sloStatuses.filter((s) => s.status === 'burning').length;
  const atRisk = sloStatuses.filter((s) => s.status === 'at_risk').length;
  const healthy = sloStatuses.filter((s) => s.status === 'healthy').length;
  const avgCompliance = sloStatuses.reduce((s, slo) => s + slo.current, 0) / sloStatuses.length;

  const burnChartData = Array.from({ length: 24 }, (_, i) => {
    const obj: Record<string, number | string> = { hour: `${i}:00` };
    burnData.forEach(({ slo, series }, _idx) => {
      obj[slo.service] = series[i]?.budget ?? 0;
    });
    return obj;
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Target className="w-6 h-6 text-cyan-400" />
          SLA / SLO Tracking — Error Budget Observatory
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Error budget consumption, multi-window burn rates, and SLO compliance per microservice
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          {
            label: 'Budget Exhausted',
            value: critical,
            color: 'text-[#c45a4a]',
            icon: <Flame className="w-4 h-4 text-[#c45a4a]" />,
          },
          {
            label: 'Burning Fast',
            value: burning,
            color: 'text-[#c8953c]',
            icon: <AlertTriangle className="w-4 h-4 text-[#c8953c]" />,
          },
          {
            label: 'At Risk',
            value: atRisk,
            color: 'text-amber-400',
            icon: <TrendingDown className="w-4 h-4 text-amber-400" />,
          },
          {
            label: 'Healthy SLOs',
            value: healthy,
            color: 'text-[#6b8f71]',
            icon: <CheckCircle className="w-4 h-4 text-[#6b8f71]" />,
          },
          {
            label: 'Avg SLO',
            value: `${avgCompliance.toFixed(3)}%`,
            color: 'text-cyan-400',
            icon: <Zap className="w-4 h-4 text-cyan-400" />,
          },
        ].map(({ label, value, color, icon }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                {icon}
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            Error Budget Remaining — 24h Window (top 4 services)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={burnChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#94a3b8' }} interval={3} />
              <YAxis
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  fontSize: 11,
                }}
                formatter={(v: number, name: string) => [`${v.toFixed(1)}%`, name]}
              />
              <ReferenceLine
                y={0}
                stroke="#c45a4a"
                strokeDasharray="3 3"
                label={{ value: 'Budget Exhausted', fill: '#c45a4a', fontSize: 9 }}
              />
              <ReferenceLine
                y={20}
                stroke="#c8953c"
                strokeDasharray="3 2"
                label={{ value: 'Danger Zone (20%)', fill: '#c8953c', fontSize: 9 }}
              />
              {burnData.map(({ slo }, i) => (
                <Line
                  key={slo.service}
                  type="monotone"
                  dataKey={slo.service}
                  stroke={burnRateLineColors[i]}
                  dot={false}
                  strokeWidth={2}
                  name={slo.service}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2">
            {burnData.map(({ slo }, i) => (
              <div key={slo.service} className="flex items-center gap-1.5">
                <div
                  className="w-3 h-1 rounded-full"
                  style={{ background: burnRateLineColors[i] }}
                />
                <span className="text-[10px] text-muted-foreground">{slo.service}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          All SLOs — Multi-Window Burn Rates
        </h2>
        {sloStatuses.map((slo) => {
          const sc = statusColors[slo.status];
          return (
            <Card
              key={slo.service}
              className={
                slo.status !== 'healthy'
                  ? `border-${slo.status === 'exhausted' ? '[#c45a4a]' : slo.status === 'burning' ? '[#c8953c]' : 'amber-500'}/20`
                  : ''
              }
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm">{slo.service}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {slo.sloName} · {slo.target}%
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] capitalize ${sc.badge}`}>
                        {slo.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span>
                        Current:{' '}
                        <span
                          className={
                            slo.status !== 'healthy'
                              ? 'text-[#c45a4a] font-bold'
                              : 'text-foreground'
                          }
                        >
                          {slo.current.toFixed(4)}%
                        </span>
                      </span>
                      <span>
                        Budget:{' '}
                        <span
                          className={
                            slo.errorBudgetConsumedPct > 100
                              ? 'text-[#c45a4a] font-bold'
                              : 'text-foreground'
                          }
                        >
                          {slo.errorBudgetConsumedPct.toFixed(1)}% consumed
                        </span>
                      </span>
                      <span>
                        {slo.windowDays}d window · {slo.errorBudgetMinutes.toFixed(1)} min total
                        budget
                      </span>
                    </div>
                    <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          slo.errorBudgetConsumedPct >= 100
                            ? 'bg-[#c45a4a]'
                            : slo.errorBudgetConsumedPct >= 80
                              ? 'bg-[#c8953c]'
                              : slo.errorBudgetConsumedPct >= 50
                                ? 'bg-amber-500'
                                : 'bg-[#6b8f71]'
                        }`}
                        style={{ width: `${Math.min(100, slo.errorBudgetConsumedPct)}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 shrink-0">
                    {[
                      { label: '1h burn', value: slo.burnRate1h, warn: 1.0 },
                      { label: '6h burn', value: slo.burnRate6h, warn: 1.0 },
                      { label: '24h burn', value: slo.burnRate24h, warn: 1.0 },
                    ].map(({ label, value, warn }) => (
                      <div key={label} className="text-center">
                        <p
                          className={`text-sm font-bold font-mono ${value > warn * 2 ? 'text-[#c45a4a]' : value > warn ? 'text-[#c8953c]' : 'text-[#6b8f71]'}`}
                        >
                          {value.toFixed(2)}x
                        </p>
                        <p className="text-[9px] text-muted-foreground">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
