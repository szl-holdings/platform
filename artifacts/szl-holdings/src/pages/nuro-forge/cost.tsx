import { m } from 'framer-motion';
import { AlertTriangle, ArrowRight, BarChart3, DollarSign, TrendingDown, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { routeOptimalModel } from '@/lib/nuro-forge-service';

const MODEL_COSTS = [
  {
    model: 'Claude 4 Sonnet',
    provider: 'Anthropic',
    requests: 45280,
    totalCost: 135.84,
    avgCost: 0.003,
    color: '#8b5cf6',
    trend: -12,
  },
  {
    model: 'GPT-5.2',
    provider: 'OpenAI',
    requests: 32100,
    totalCost: 160.5,
    avgCost: 0.005,
    color: '#10b981',
    trend: -8,
  },
  {
    model: 'Qwen3-8B',
    provider: 'Alibaba',
    requests: 68400,
    totalCost: 34.2,
    avgCost: 0.0005,
    color: '#06b6d4',
    trend: -22,
  },
  {
    model: 'Gemini 2.5 Pro',
    provider: 'Google',
    requests: 21300,
    totalCost: 74.55,
    avgCost: 0.0035,
    color: '#3b82f6',
    trend: -15,
  },
  {
    model: 'Llama 4 Scout',
    provider: 'Meta',
    requests: 54200,
    totalCost: 10.84,
    avgCost: 0.0002,
    color: '#f59e0b',
    trend: -34,
  },
  {
    model: 'Mistral Large',
    provider: 'Mistral',
    requests: 18700,
    totalCost: 14.96,
    avgCost: 0.0008,
    color: '#d4a054',
    trend: -19,
  },
];

const DOMAIN_BUDGETS = [
  { domain: 'Cybersecurity', budget: 500, spent: 187.4, color: '#3b82f6' },
  { domain: 'Legal', budget: 400, spent: 142.8, color: '#8b5cf6' },
  { domain: 'Maritime', budget: 350, spent: 98.6, color: '#06b6d4' },
  { domain: 'Financial', budget: 300, spent: 124.3, color: '#10b981' },
  { domain: 'Real Estate', budget: 250, spent: 67.2, color: '#d4a054' },
  { domain: 'Advisory', budget: 200, spent: 43.5, color: '#c4a265' },
  { domain: 'Operations', budget: 400, spent: 156.7, color: '#f59e0b' },
  { domain: 'Research', budget: 300, spent: 89.4, color: '#ec4899' },
];

export default function CostIntelligencePage() {
  const [costs, setCosts] = useState(MODEL_COSTS);
  const totalSpend = costs.reduce((a, c) => a + c.totalCost, 0);
  const totalRequests = costs.reduce((a, c) => a + c.requests, 0);
  const avgCostPerReq = totalSpend / totalRequests;

  const optimalByDomain = [
    { domain: 'Legal', model: routeOptimalModel('Legal') },
    { domain: 'Maritime', model: routeOptimalModel('Maritime') },
    { domain: 'Cybersecurity', model: routeOptimalModel('Cybersecurity') },
    { domain: 'Financial', model: routeOptimalModel('Financial') },
    { domain: 'Real Estate', model: routeOptimalModel('Real Estate') },
  ].filter((d) => d.model);

  useEffect(() => {
    const t = setInterval(() => {
      setCosts((prev) =>
        prev.map((c) => ({
          ...c,
          requests: c.requests + Math.floor(Math.random() * 10),
          totalCost: +(c.totalCost + Math.random() * 0.05).toFixed(2),
        })),
      );
    }, 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: '#070a10' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <m.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-6"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: 'rgba(16,185,129,0.12)',
              border: '1px solid rgba(16,185,129,0.2)',
            }}
          >
            <DollarSign className="w-4 h-4" style={{ color: '#10b981' }} />
          </div>
          <div>
            <h1
              className="text-xl font-bold tracking-tight"
              style={{ color: 'rgba(255,255,255,0.9)' }}
            >
              Cost Intelligence
            </h1>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Per-request tracking · Optimal routing · Budget forecasting
            </p>
          </div>
        </m.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            {
              label: 'Total Spend (MTD)',
              value: `$${totalSpend.toFixed(2)}`,
              color: '#d4a054',
              icon: DollarSign,
            },
            {
              label: 'Total Requests',
              value: totalRequests.toLocaleString(),
              color: '#8b5cf6',
              icon: Zap,
            },
            {
              label: 'Avg Cost/Request',
              value: `$${avgCostPerReq.toFixed(4)}`,
              color: '#10b981',
              icon: BarChart3,
            },
            { label: 'Cost Savings', value: '-34%', color: '#06b6d4', icon: TrendingDown },
          ].map((s) => (
            <m.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg p-3"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {s.label}
                </span>
              </div>
              <div className="text-lg font-bold tabular-nums" style={{ color: s.color }}>
                {s.value}
              </div>
            </m.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <m.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-lg p-4"
            style={{
              background: 'rgba(255,255,255,0.015)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <h2
              className="text-[13px] font-semibold mb-4 flex items-center gap-2"
              style={{ color: 'rgba(255,255,255,0.65)' }}
            >
              <DollarSign className="w-4 h-4" style={{ color: '#10b981' }} />
              Cost by Model
            </h2>
            <div className="space-y-2">
              {[...costs]
                .sort((a, b) => b.totalCost - a.totalCost)
                .map((c) => (
                  <div
                    key={c.model}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md"
                    style={{
                      background: 'rgba(255,255,255,0.01)',
                      border: '1px solid rgba(255,255,255,0.03)',
                    }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
                    <div className="flex-1 min-w-0">
                      <span
                        className="text-[11px] font-semibold"
                        style={{ color: 'rgba(255,255,255,0.7)' }}
                      >
                        {c.model}
                      </span>
                      <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                        {c.requests.toLocaleString()} requests
                      </div>
                    </div>
                    <span className="text-[11px] font-bold tabular-nums" style={{ color: c.color }}>
                      ${c.totalCost.toFixed(2)}
                    </span>
                    <span className="text-[9px] font-medium" style={{ color: '#10b981' }}>
                      {c.trend}%
                    </span>
                  </div>
                ))}
            </div>
          </m.div>

          <m.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="rounded-lg p-4"
            style={{
              background: 'rgba(255,255,255,0.015)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <h2
              className="text-[13px] font-semibold mb-4 flex items-center gap-2"
              style={{ color: 'rgba(255,255,255,0.65)' }}
            >
              <BarChart3 className="w-4 h-4" style={{ color: '#d4a054' }} />
              Domain Budgets
            </h2>
            <div className="space-y-3">
              {DOMAIN_BUDGETS.map((d) => {
                const pct = (d.spent / d.budget) * 100;
                return (
                  <div key={d.domain}>
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-[11px] font-medium"
                        style={{ color: 'rgba(255,255,255,0.6)' }}
                      >
                        {d.domain}
                      </span>
                      <span
                        className="text-[10px] tabular-nums"
                        style={{ color: pct > 80 ? '#f59e0b' : 'rgba(255,255,255,0.3)' }}
                      >
                        ${d.spent.toFixed(0)} / ${d.budget}
                      </span>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    >
                      <m.div
                        className="h-full rounded-full"
                        style={{ background: pct > 80 ? '#f59e0b' : d.color }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </m.div>
        </div>

        {optimalByDomain.length > 0 && (
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-lg p-4 mt-5"
            style={{
              background: 'rgba(255,255,255,0.015)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <h2
              className="text-[13px] font-semibold mb-4 flex items-center gap-2"
              style={{ color: 'rgba(255,255,255,0.65)' }}
            >
              <Zap className="w-4 h-4" style={{ color: '#06b6d4' }} />
              Optimal Model Routing
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {optimalByDomain.map((d) => (
                <div
                  key={d.domain}
                  className="rounded-md p-3 text-center"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.03)',
                  }}
                >
                  <div className="text-[10px] mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {d.domain}
                  </div>
                  <div className="text-[11px] font-semibold" style={{ color: '#06b6d4' }}>
                    {d.model!.name}
                  </div>
                  <div className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    ${d.model!.costPer1k.toFixed(2)}/1k
                  </div>
                </div>
              ))}
            </div>
          </m.div>
        )}
      </div>
    </div>
  );
}
