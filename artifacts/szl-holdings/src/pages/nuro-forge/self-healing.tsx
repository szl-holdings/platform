import { AnimatePresence, m } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Check,
  Clock,
  HeartPulse,
  RotateCcw,
  Shield,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  canaryDeploy,
  promoteCanary,
  rollbackModel,
  triggerFailover,
} from '@/lib/nuro-forge-service';

interface HealthEvent {
  id: string;
  model: string;
  type: 'failover' | 'canary' | 'rollback' | 'swap' | 'recovery';
  status: 'success' | 'in-progress' | 'scheduled';
  detail: string;
  timestamp: number;
  duration: string;
}

const MODEL_HEALTH = [
  {
    model: 'Claude 4 Sonnet',
    status: 'healthy' as const,
    uptime: 99.99,
    lastIncident: '14d ago',
    failoverTarget: 'GPT-5.2',
    canaryVersion: 'v4.2.1',
    color: '#8b5cf6',
  },
  {
    model: 'GPT-5.2',
    status: 'healthy' as const,
    uptime: 99.97,
    lastIncident: '7d ago',
    failoverTarget: 'Claude 4 Sonnet',
    canaryVersion: 'v5.2.3',
    color: '#10b981',
  },
  {
    model: 'Gemini 2.5 Pro',
    status: 'healthy' as const,
    uptime: 99.95,
    lastIncident: '3d ago',
    failoverTarget: 'Claude 4 Sonnet',
    canaryVersion: 'v2.5.1',
    color: '#3b82f6',
  },
  {
    model: 'Qwen3-8B',
    status: 'healthy' as const,
    uptime: 99.98,
    lastIncident: '21d ago',
    failoverTarget: 'Phi-4 Mini',
    canaryVersion: 'v3.0.4',
    color: '#06b6d4',
  },
  {
    model: 'Llama 4 Scout',
    status: 'canary' as const,
    uptime: 99.91,
    lastIncident: '2d ago',
    failoverTarget: 'Qwen3-8B',
    canaryVersion: 'v4.1.0-rc',
    color: '#f59e0b',
  },
  {
    model: 'Mistral Large',
    status: 'healthy' as const,
    uptime: 99.96,
    lastIncident: '10d ago',
    failoverTarget: 'Command R+',
    canaryVersion: 'v2.1.0',
    color: '#d4a054',
  },
  {
    model: 'DeepSeek V3',
    status: 'healthy' as const,
    uptime: 99.93,
    lastIncident: '5d ago',
    failoverTarget: 'Llama 4 Scout',
    canaryVersion: 'v3.0.2',
    color: '#ec4899',
  },
  {
    model: 'Phi-4 Mini',
    status: 'degraded' as const,
    uptime: 99.87,
    lastIncident: '12h ago',
    failoverTarget: 'Qwen3-8B',
    canaryVersion: 'v4.0.3',
    color: '#0ea5e9',
  },
];

function generateHealthEvent(): HealthEvent {
  const types: HealthEvent['type'][] = ['failover', 'canary', 'rollback', 'swap', 'recovery'];
  const type = types[Math.floor(Math.random() * types.length)];
  const model = MODEL_HEALTH[Math.floor(Math.random() * MODEL_HEALTH.length)];
  const details: Record<string, string[]> = {
    failover: [
      `Auto-failover to ${model.failoverTarget}`,
      'Primary endpoint unreachable — rerouting',
      'Latency threshold exceeded — switching',
    ],
    canary: [
      `Canary ${model.canaryVersion} deployed to 5%`,
      'A/B metrics within tolerance',
      'Canary promoted to 25% traffic',
    ],
    rollback: [
      'Quality metrics below threshold — rolling back',
      'Error rate spike detected — reverting',
      'Automatic rollback completed',
    ],
    swap: [
      'Zero-downtime model swap completed',
      'Hot-swap to new version successful',
      'Shadow traffic validation passed',
    ],
    recovery: [
      'Primary model recovered — traffic restored',
      'Self-heal cycle complete',
      'Health check passed — resuming normal ops',
    ],
  };
  return {
    id: `heal-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    model: model.model,
    type,
    status: Math.random() > 0.2 ? 'success' : 'in-progress',
    detail: details[type][Math.floor(Math.random() * details[type].length)],
    timestamp: Date.now(),
    duration: `${Math.floor(Math.random() * 300 + 50)}ms`,
  };
}

export default function SelfHealingInfraPage() {
  const [events, setEvents] = useState<HealthEvent[]>(() =>
    Array.from({ length: 8 }, generateHealthEvent),
  );

  useEffect(() => {
    const t = setInterval(() => {
      const event = generateHealthEvent();

      if (event.type === 'failover') {
        const modelId = MODEL_HEALTH.find((m) => m.model === event.model)?.model;
        if (modelId) {
          const result = triggerFailover(
            modelId.toLowerCase().replace(/\s+/g, '-').replace(/\+/g, 'plus'),
          );
          event.detail = result.success
            ? `Auto-failover to ${result.failoverTarget}`
            : event.detail;
          event.status = result.success ? 'success' : 'in-progress';
        }
      } else if (event.type === 'canary') {
        const modelId = MODEL_HEALTH.find((m) => m.model === event.model)?.model;
        if (modelId) {
          const result = canaryDeploy(
            modelId.toLowerCase().replace(/\s+/g, '-').replace(/\+/g, 'plus'),
            5,
          );
          event.detail =
            result.status === 'deployed'
              ? `Canary deployed to ${result.canaryPct}% traffic`
              : event.detail;
        }
      } else if (event.type === 'rollback') {
        const modelId = MODEL_HEALTH.find((m) => m.model === event.model)?.model;
        if (modelId) {
          const result = rollbackModel(
            modelId.toLowerCase().replace(/\s+/g, '-').replace(/\+/g, 'plus'),
          );
          event.detail =
            result.status === 'rolled_back'
              ? `${result.model} rolled back successfully`
              : event.detail;
        }
      }

      setEvents((prev) => [event, ...prev].slice(0, 25));
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const overallUptime = MODEL_HEALTH.reduce((a, m) => a + m.uptime, 0) / MODEL_HEALTH.length;

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
            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <HeartPulse className="w-4 h-4" style={{ color: '#ef4444' }} />
          </div>
          <div>
            <h1
              className="text-xl font-bold tracking-tight"
              style={{ color: 'rgba(255,255,255,0.9)' }}
            >
              Self-Healing Model Infrastructure
            </h1>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Auto-failover · Canary deployments · Zero-downtime swaps
            </p>
          </div>
        </m.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            {
              label: 'Overall Uptime',
              value: `${overallUptime.toFixed(2)}%`,
              color: '#10b981',
              icon: Activity,
            },
            { label: 'Failovers (24h)', value: '2', color: '#f59e0b', icon: RotateCcw },
            { label: 'Active Canaries', value: '1', color: '#8b5cf6', icon: Shield },
            { label: 'Recovery Time', value: '<200ms', color: '#06b6d4', icon: Clock },
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
              <HeartPulse className="w-4 h-4" style={{ color: '#ef4444' }} />
              Model Health Matrix
            </h2>
            <div className="space-y-2">
              {MODEL_HEALTH.map((m) => (
                <div
                  key={m.model}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md"
                  style={{
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid rgba(255,255,255,0.03)',
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      background:
                        m.status === 'healthy'
                          ? '#10b981'
                          : m.status === 'canary'
                            ? '#f59e0b'
                            : '#ef4444',
                    }}
                  />
                  <span
                    className="text-[11px] font-semibold flex-1"
                    style={{ color: 'rgba(255,255,255,0.7)' }}
                  >
                    {m.model}
                  </span>
                  <span
                    className="text-[10px] tabular-nums font-medium"
                    style={{ color: '#10b981' }}
                  >
                    {m.uptime}%
                  </span>
                  <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    {m.lastIncident}
                  </span>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded-full capitalize"
                    style={{
                      background:
                        m.status === 'healthy'
                          ? 'rgba(16,185,129,0.1)'
                          : m.status === 'canary'
                            ? 'rgba(245,158,11,0.1)'
                            : 'rgba(239,68,68,0.1)',
                      color:
                        m.status === 'healthy'
                          ? '#10b981'
                          : m.status === 'canary'
                            ? '#f59e0b'
                            : '#ef4444',
                    }}
                  >
                    {m.status}
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
              <Zap className="w-4 h-4" style={{ color: '#d4a054' }} />
              Healing Events
            </h2>
            <div className="space-y-1.5">
              <AnimatePresence mode="popLayout">
                {events.slice(0, 8).map((event) => (
                  <m.div
                    key={event.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center gap-3 px-3 py-2 rounded-md"
                    style={{
                      background: 'rgba(255,255,255,0.01)',
                      border: `1px solid ${event.status === 'success' ? 'rgba(16,185,129,0.06)' : 'rgba(245,158,11,0.06)'}`,
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background:
                          event.status === 'success'
                            ? 'rgba(16,185,129,0.12)'
                            : 'rgba(245,158,11,0.12)',
                      }}
                    >
                      {event.status === 'success' ? (
                        <Check className="w-2.5 h-2.5" style={{ color: '#10b981' }} />
                      ) : (
                        <RotateCcw
                          className="w-2.5 h-2.5 animate-spin"
                          style={{ color: '#f59e0b' }}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[10px] font-semibold"
                          style={{ color: 'rgba(255,255,255,0.6)' }}
                        >
                          {event.model}
                        </span>
                        <span
                          className="text-[8px] px-1 py-0.5 rounded capitalize"
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            color: 'rgba(255,255,255,0.25)',
                          }}
                        >
                          {event.type}
                        </span>
                      </div>
                      <p className="text-[9px] truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {event.detail}
                      </p>
                    </div>
                    <span
                      className="text-[9px] tabular-nums flex-shrink-0"
                      style={{ color: 'rgba(255,255,255,0.2)' }}
                    >
                      {event.duration}
                    </span>
                  </m.div>
                ))}
              </AnimatePresence>
            </div>
          </m.div>
        </div>
      </div>
    </div>
  );
}
