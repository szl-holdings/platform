import { m } from 'framer-motion';
import {
  AlertTriangle,
  BarChart3,
  Clock,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const MODEL_METRICS = [
  {
    model: 'Claude 4 Sonnet',
    accuracy: 94.2,
    latency: 1240,
    throughput: 45,
    errorRate: 0.3,
    drift: 0.12,
    status: 'healthy',
    color: '#8b5cf6',
  },
  {
    model: 'GPT-5.2',
    accuracy: 92.8,
    latency: 980,
    throughput: 52,
    errorRate: 0.5,
    drift: 0.08,
    status: 'healthy',
    color: '#10b981',
  },
  {
    model: 'Gemini 2.5 Pro',
    accuracy: 91.4,
    latency: 1100,
    throughput: 38,
    errorRate: 0.4,
    drift: 0.15,
    status: 'healthy',
    color: '#3b82f6',
  },
  {
    model: 'Qwen3-8B',
    accuracy: 87.6,
    latency: 142,
    throughput: 124,
    errorRate: 0.8,
    drift: 0.22,
    status: 'warning',
    color: '#06b6d4',
  },
  {
    model: 'Llama 4 Scout',
    accuracy: 85.3,
    latency: 280,
    throughput: 98,
    errorRate: 1.2,
    drift: 0.31,
    status: 'warning',
    color: '#f59e0b',
  },
  {
    model: 'Mistral Large',
    accuracy: 89.1,
    latency: 350,
    throughput: 78,
    errorRate: 0.6,
    drift: 0.09,
    status: 'healthy',
    color: '#d4a054',
  },
  {
    model: 'DeepSeek V3',
    accuracy: 88.4,
    latency: 420,
    throughput: 65,
    errorRate: 0.7,
    drift: 0.18,
    status: 'healthy',
    color: '#ec4899',
  },
  {
    model: 'Command R+',
    accuracy: 86.2,
    latency: 560,
    throughput: 54,
    errorRate: 0.9,
    drift: 0.25,
    status: 'healthy',
    color: '#64748b',
  },
  {
    model: 'Phi-4 Mini',
    accuracy: 82.7,
    latency: 95,
    throughput: 187,
    errorRate: 1.5,
    drift: 0.34,
    status: 'degraded',
    color: '#4d8fcc',
  },
  {
    model: 'Grok 3',
    accuracy: 84.9,
    latency: 780,
    throughput: 42,
    errorRate: 1.1,
    drift: 0.28,
    status: 'warning',
    color: '#a855f7',
  },
];

export default function PerformanceObservatoryPage() {
  const [metrics, setMetrics] = useState(MODEL_METRICS);
  const [sortBy, setSortBy] = useState<'accuracy' | 'latency' | 'throughput' | 'drift'>('accuracy');

  useEffect(() => {
    const t = setInterval(() => {
      setMetrics((prev) =>
        prev.map((m) => ({
          ...m,
          accuracy: Math.max(75, Math.min(99, m.accuracy + (Math.random() - 0.5) * 0.3)),
          latency: Math.max(50, m.latency + Math.floor((Math.random() - 0.5) * 20)),
          throughput: Math.max(10, m.throughput + Math.floor((Math.random() - 0.5) * 3)),
          drift: Math.max(0, Math.min(1, m.drift + (Math.random() - 0.5) * 0.02)),
        })),
      );
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const sorted = useMemo(() => {
    return [...metrics].sort((a, b) => {
      if (sortBy === 'accuracy') return b.accuracy - a.accuracy;
      if (sortBy === 'latency') return a.latency - b.latency;
      if (sortBy === 'throughput') return b.throughput - a.throughput;
      return a.drift - b.drift;
    });
  }, [metrics, sortBy]);

  const avgAccuracy = metrics.reduce((a, m) => a + m.accuracy, 0) / metrics.length;
  const avgLatency = Math.round(metrics.reduce((a, m) => a + m.latency, 0) / metrics.length);
  const totalThroughput = metrics.reduce((a, m) => a + m.throughput, 0);
  const alertCount = metrics.filter((m) => m.status !== 'healthy').length;

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
              background: 'rgba(249,115,22,0.12)',
              border: '1px solid rgba(249,115,22,0.2)',
            }}
          >
            <BarChart3 className="w-4 h-4" style={{ color: '#f97316' }} />
          </div>
          <div>
            <h1
              className="text-xl font-bold tracking-tight"
              style={{ color: 'rgba(255,255,255,0.9)' }}
            >
              Model Performance Observatory
            </h1>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Real-time accuracy · Latency tracking · Drift detection
            </p>
          </div>
        </m.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            {
              label: 'Avg Accuracy',
              value: `${avgAccuracy.toFixed(1)}%`,
              color: '#10b981',
              icon: TrendingUp,
            },
            { label: 'Avg Latency', value: `${avgLatency}ms`, color: '#06b6d4', icon: Clock },
            { label: 'Throughput', value: `${totalThroughput} req/s`, color: '#8b5cf6', icon: Zap },
            {
              label: 'Alerts',
              value: alertCount.toString(),
              color: alertCount > 0 ? '#f59e0b' : '#10b981',
              icon: AlertTriangle,
            },
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

        <div className="flex gap-2 mb-4">
          {(['accuracy', 'latency', 'throughput', 'drift'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-medium capitalize"
              style={{
                background: sortBy === s ? 'rgba(249,115,22,0.12)' : 'rgba(255,255,255,0.02)',
                color: sortBy === s ? '#f97316' : 'rgba(255,255,255,0.4)',
                border: `1px solid ${sortBy === s ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.04)'}`,
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <div
          className="rounded-lg overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.04)' }}
        >
          <div
            className="grid grid-cols-[1fr_80px_80px_80px_80px_80px_80px] gap-2 px-4 py-2"
            style={{ background: 'rgba(255,255,255,0.02)' }}
          >
            {['Model', 'Accuracy', 'Latency', 'Throughput', 'Error %', 'Drift', 'Status'].map(
              (h) => (
                <span
                  key={h}
                  className="text-[9px] uppercase tracking-wider font-medium"
                  style={{ color: 'rgba(255,255,255,0.2)' }}
                >
                  {h}
                </span>
              ),
            )}
          </div>
          {sorted.map((model, i) => (
            <m.div
              key={model.model}
              layout
              className="grid grid-cols-[1fr_80px_80px_80px_80px_80px_80px] gap-2 px-4 py-2.5 items-center"
              style={{
                background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                borderBottom: '1px solid rgba(255,255,255,0.02)',
              }}
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: model.color }} />
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: 'rgba(255,255,255,0.75)' }}
                >
                  {model.model}
                </span>
              </div>
              <span
                className="text-[11px] font-bold tabular-nums"
                style={{
                  color:
                    model.accuracy > 90 ? '#10b981' : model.accuracy > 85 ? '#f59e0b' : '#ef4444',
                }}
              >
                {model.accuracy.toFixed(1)}%
              </span>
              <span
                className="text-[11px] tabular-nums"
                style={{
                  color:
                    model.latency < 200
                      ? '#10b981'
                      : model.latency < 500
                        ? '#f59e0b'
                        : 'rgba(255,255,255,0.4)',
                }}
              >
                {model.latency}ms
              </span>
              <span className="text-[11px] tabular-nums" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {model.throughput}/s
              </span>
              <span
                className="text-[11px] tabular-nums"
                style={{ color: model.errorRate > 1 ? '#ef4444' : 'rgba(255,255,255,0.3)' }}
              >
                {model.errorRate.toFixed(1)}%
              </span>
              <div className="flex items-center gap-1">
                <div
                  className="w-10 h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${model.drift * 100}%`,
                      background:
                        model.drift > 0.3 ? '#ef4444' : model.drift > 0.2 ? '#f59e0b' : '#10b981',
                    }}
                  />
                </div>
                <span
                  className="text-[9px] tabular-nums"
                  style={{ color: 'rgba(255,255,255,0.2)' }}
                >
                  {model.drift.toFixed(2)}
                </span>
              </div>
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full capitalize"
                style={{
                  background:
                    model.status === 'healthy'
                      ? 'rgba(16,185,129,0.1)'
                      : model.status === 'warning'
                        ? 'rgba(245,158,11,0.1)'
                        : 'rgba(239,68,68,0.1)',
                  color:
                    model.status === 'healthy'
                      ? '#10b981'
                      : model.status === 'warning'
                        ? '#f59e0b'
                        : '#ef4444',
                }}
              >
                {model.status}
              </span>
            </m.div>
          ))}
        </div>
      </div>
    </div>
  );
}
