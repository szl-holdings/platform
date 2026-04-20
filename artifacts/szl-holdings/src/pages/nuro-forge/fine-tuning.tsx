import { m } from 'framer-motion';
import { ArrowUpRight, Brain, Database, Layers, Lock, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

const DOMAINS = [
  {
    id: 'legal',
    name: 'Legal',
    color: '#8b5cf6',
    baseAccuracy: 78.2,
    improvedAccuracy: 91.4,
    dataPoints: 12847,
    lastTrained: '2h ago',
    isolated: true,
  },
  {
    id: 'maritime',
    name: 'Maritime',
    color: '#06b6d4',
    baseAccuracy: 72.8,
    improvedAccuracy: 87.3,
    dataPoints: 8234,
    lastTrained: '4h ago',
    isolated: true,
  },
  {
    id: 'cyber',
    name: 'Cybersecurity',
    color: '#3b82f6',
    baseAccuracy: 81.5,
    improvedAccuracy: 93.1,
    dataPoints: 15672,
    lastTrained: '1h ago',
    isolated: true,
  },
  {
    id: 'financial',
    name: 'Financial',
    color: '#10b981',
    baseAccuracy: 76.9,
    improvedAccuracy: 89.7,
    dataPoints: 9876,
    lastTrained: '6h ago',
    isolated: true,
  },
  {
    id: 'real-estate',
    name: 'Real Estate',
    color: '#d4a054',
    baseAccuracy: 74.3,
    improvedAccuracy: 86.5,
    dataPoints: 6543,
    lastTrained: '3h ago',
    isolated: true,
  },
  {
    id: 'advisory',
    name: 'Advisory',
    color: '#c4a265',
    baseAccuracy: 71.6,
    improvedAccuracy: 84.2,
    dataPoints: 4321,
    lastTrained: '8h ago',
    isolated: true,
  },
  {
    id: 'operations',
    name: 'Operations',
    color: '#f59e0b',
    baseAccuracy: 79.4,
    improvedAccuracy: 90.8,
    dataPoints: 11234,
    lastTrained: '30m ago',
    isolated: true,
  },
  {
    id: 'research',
    name: 'Research',
    color: '#ec4899',
    baseAccuracy: 83.1,
    improvedAccuracy: 94.6,
    dataPoints: 18456,
    lastTrained: '45m ago',
    isolated: true,
  },
  {
    id: 'creative',
    name: 'Creative',
    color: '#a855f7',
    baseAccuracy: 68.7,
    improvedAccuracy: 82.1,
    dataPoints: 3456,
    lastTrained: '12h ago',
    isolated: true,
  },
];

export default function FederatedFineTuningPage() {
  const [domains, setDomains] = useState(DOMAINS);
  const [selectedDomain, setSelectedDomain] = useState<(typeof DOMAINS)[0] | null>(null);

  useEffect(() => {
    const t = setInterval(() => {
      setDomains((prev) =>
        prev.map((d) => ({
          ...d,
          improvedAccuracy: Math.min(99.9, d.improvedAccuracy + (Math.random() - 0.3) * 0.1),
          dataPoints: d.dataPoints + Math.floor(Math.random() * 5),
        })),
      );
    }, 5000);
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
              background: 'rgba(236,72,153,0.12)',
              border: '1px solid rgba(236,72,153,0.2)',
            }}
          >
            <Brain className="w-4 h-4" style={{ color: '#ec4899' }} />
          </div>
          <div>
            <h1
              className="text-xl font-bold tracking-tight"
              style={{ color: 'rgba(255,255,255,0.9)' }}
            >
              Federated Fine-Tuning Engine
            </h1>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Domain-isolated learning · Cross-domain improvement · Data sovereignty
            </p>
          </div>
        </m.div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            {
              label: 'Avg Improvement',
              value: `+${(domains.reduce((a, d) => a + (d.improvedAccuracy - d.baseAccuracy), 0) / domains.length).toFixed(1)}%`,
              color: '#10b981',
              icon: TrendingUp,
            },
            {
              label: 'Data Points',
              value: domains.reduce((a, d) => a + d.dataPoints, 0).toLocaleString(),
              color: '#8b5cf6',
              icon: Database,
            },
            {
              label: 'Domains Isolated',
              value: `${domains.filter((d) => d.isolated).length}/${domains.length}`,
              color: '#3b82f6',
              icon: Lock,
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-2">
            {domains.map((domain, i) => (
              <m.div
                key={domain.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelectedDomain(domain)}
                className="rounded-lg p-4 cursor-pointer"
                style={{
                  background:
                    selectedDomain?.id === domain.id
                      ? `${domain.color}08`
                      : 'rgba(255,255,255,0.015)',
                  border: `1px solid ${selectedDomain?.id === domain.id ? `${domain.color}20` : 'rgba(255,255,255,0.04)'}`,
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-2 h-2 rounded-full" style={{ background: domain.color }} />
                  <span
                    className="text-[12px] font-semibold"
                    style={{ color: 'rgba(255,255,255,0.75)' }}
                  >
                    {domain.name}
                  </span>
                  <Lock
                    className="w-3 h-3 ml-auto"
                    style={{ color: domain.isolated ? '#10b981' : 'rgba(255,255,255,0.15)' }}
                  />
                  <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    {domain.lastTrained}
                  </span>
                </div>
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        Base → Fine-tuned
                      </span>
                      <span
                        className="text-[10px] font-bold tabular-nums"
                        style={{ color: '#10b981' }}
                      >
                        +{(domain.improvedAccuracy - domain.baseAccuracy).toFixed(1)}%
                      </span>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    >
                      <div className="h-full rounded-full relative">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{
                            width: `${domain.baseAccuracy}%`,
                            background: 'rgba(255,255,255,0.08)',
                          }}
                        />
                        <m.div
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{ background: domain.color }}
                          animate={{ width: `${domain.improvedAccuracy}%` }}
                          transition={{ duration: 1 }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span
                        className="text-[9px] tabular-nums"
                        style={{ color: 'rgba(255,255,255,0.2)' }}
                      >
                        {domain.baseAccuracy.toFixed(1)}%
                      </span>
                      <span
                        className="text-[9px] tabular-nums font-medium"
                        style={{ color: domain.color }}
                      >
                        {domain.improvedAccuracy.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    {domain.dataPoints.toLocaleString()} data points
                  </span>
                </div>
              </m.div>
            ))}
          </div>

          <div>
            {selectedDomain ? (
              <m.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-lg p-5 sticky top-6"
                style={{
                  background: 'rgba(255,255,255,0.015)',
                  border: `1px solid ${selectedDomain.color}15`,
                }}
              >
                <h2
                  className="text-sm font-bold mb-4 flex items-center gap-2"
                  style={{ color: 'rgba(255,255,255,0.85)' }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ background: selectedDomain.color }}
                  />
                  {selectedDomain.name} Domain
                </h2>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { label: 'Base Accuracy', value: `${selectedDomain.baseAccuracy.toFixed(1)}%` },
                    {
                      label: 'Fine-tuned Accuracy',
                      value: `${selectedDomain.improvedAccuracy.toFixed(1)}%`,
                    },
                    {
                      label: 'Improvement',
                      value: `+${(selectedDomain.improvedAccuracy - selectedDomain.baseAccuracy).toFixed(1)}%`,
                    },
                    { label: 'Training Data', value: selectedDomain.dataPoints.toLocaleString() },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="rounded-md p-2.5 text-center"
                      style={{ background: 'rgba(255,255,255,0.02)' }}
                    >
                      <div
                        className="text-sm font-bold tabular-nums"
                        style={{ color: selectedDomain.color }}
                      >
                        {s.value}
                      </div>
                      <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <h3
                    className="text-[11px] font-semibold"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    Data Isolation
                  </h3>
                  {[
                    'All training data remains within domain boundary',
                    'Gradient aggregation only — no raw data shared',
                    'Domain-specific validation set maintained separately',
                    'Audit trail for every training signal contribution',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <Lock className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: '#10b981' }} />
                      <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </m.div>
            ) : (
              <div
                className="rounded-lg p-12 text-center"
                style={{
                  background: 'rgba(255,255,255,0.015)',
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <Brain
                  className="w-8 h-8 mx-auto mb-3"
                  style={{ color: 'rgba(255,255,255,0.1)' }}
                />
                <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Select a domain to view fine-tuning details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
