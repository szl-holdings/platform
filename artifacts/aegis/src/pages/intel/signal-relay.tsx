import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Globe,
  Lock,
  Radio,
  Shield,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const MODELS = [
  {
    id: 'primary-intelligence-70b',
    name: 'Primary Intelligence 70B',
    type: 'General Reasoning',
    latency: '420ms',
    cost: '$0.0018/req',
    requests: 4821,
    accuracy: 96.2,
    status: 'optimal',
  },
  {
    id: 'vision-analysis-7b',
    name: 'Vision Analysis 7B',
    type: 'Visual Analysis',
    latency: '180ms',
    cost: '$0.0008/req',
    requests: 1243,
    accuracy: 91.4,
    status: 'optimal',
  },
  {
    id: 'maritime-specialist',
    name: 'Maritime Specialist',
    type: 'Domain — Vessels',
    latency: '95ms',
    cost: '$0.0004/req',
    requests: 892,
    accuracy: 94.8,
    status: 'optimal',
  },
  {
    id: 'financial-oracle',
    name: 'Financial Oracle',
    type: 'Domain — Finance',
    latency: '210ms',
    cost: '$0.0012/req',
    requests: 2134,
    accuracy: 93.7,
    status: 'optimal',
  },
  {
    id: 'security-sentinel-llm',
    name: 'Security Sentinel LLM',
    type: 'Domain — Security',
    latency: '140ms',
    cost: '$0.0006/req',
    requests: 3847,
    accuracy: 97.1,
    status: 'optimal',
  },
  {
    id: 'code-analyst',
    name: 'Code Analyst 13B',
    type: 'Technical Analysis',
    latency: '380ms',
    cost: '$0.0015/req',
    requests: 445,
    accuracy: 95.9,
    status: 'degraded',
  },
];

interface RelayEvent {
  id: string;
  timestamp: Date;
  source: string;
  targetModel: string;
  requestType: string;
  privacy: 'public' | 'internal' | 'confidential' | 'restricted';
  latency: number;
  status: 'routed' | 'cached' | 'blocked';
  tokens: number;
}

function generateEvent(): RelayEvent {
  const sources = [
    'Maritime Analyst',
    'IT Sentinel',
    'Deal Scout',
    'Creative Director',
    'Advisory Agent',
    'Portfolio Analyst',
    'Brand Monitor',
  ];
  const types = ['inference', 'analysis', 'prediction', 'generation', 'classification'];
  const privacies: RelayEvent['privacy'][] = [
    'public',
    'internal',
    'internal',
    'confidential',
    'restricted',
  ];
  const statuses: RelayEvent['status'][] = ['routed', 'routed', 'routed', 'cached', 'blocked'];
  const modelIds = MODELS.map((m) => m.name);
  return {
    id: Math.random().toString(36).slice(2, 8),
    timestamp: new Date(),
    source: sources[Math.floor(Math.random() * sources.length)],
    targetModel: modelIds[Math.floor(Math.random() * modelIds.length)],
    requestType: types[Math.floor(Math.random() * types.length)],
    privacy: privacies[Math.floor(Math.random() * privacies.length)],
    latency: 80 + Math.floor(Math.random() * 400),
    status: statuses[Math.floor(Math.random() * statuses.length)],
    tokens: 128 + Math.floor(Math.random() * 1872),
  };
}

const PRIVACY_STYLES = {
  public: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Public' },
  internal: { color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Internal' },
  confidential: { color: 'text-amber-400', bg: 'bg-amber-400/10', label: 'Confidential' },
  restricted: { color: 'text-red-400', bg: 'bg-red-400/10', label: 'Restricted' },
};

const STATUS_STYLES = {
  routed: { color: 'text-emerald-400', dot: 'bg-emerald-400' },
  cached: { color: 'text-cyan-400', dot: 'bg-cyan-400' },
  blocked: { color: 'text-red-400', dot: 'bg-red-400 animate-pulse' },
};

const ROUTING_RULES = [
  {
    condition: 'Maritime domain signals',
    target: 'Maritime Specialist',
    reason: 'Domain expertise + lower latency',
    privacy: 'internal',
  },
  {
    condition: 'Financial analysis requests',
    target: 'Financial Oracle',
    reason: 'Specialized financial training',
    privacy: 'confidential',
  },
  {
    condition: 'Security policy evaluations',
    target: 'Security Sentinel LLM',
    reason: 'Security-hardened model + audit trail',
    privacy: 'restricted',
  },
  {
    condition: 'General reasoning & synthesis',
    target: 'Primary Intelligence 70B',
    reason: 'Highest capability for complex tasks',
    privacy: 'internal',
  },
  {
    condition: 'Visual asset analysis',
    target: 'Vision Analysis 7B',
    reason: 'Vision-optimized architecture',
    privacy: 'public',
  },
  {
    condition: 'Code & technical questions',
    target: 'Code Analyst 13B',
    reason: 'Technical training corpus',
    privacy: 'internal',
  },
];

export default function SignalRelay() {
  const [events, setEvents] = useState<RelayEvent[]>(() =>
    Array.from({ length: 12 }, generateEvent),
  );
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      setEvents((prev) => [generateEvent(), ...prev.slice(0, 19)]);
    }, 1200);
    return () => clearInterval(t);
  }, [paused]);

  const totalRequests = events.length;
  const blocked = events.filter((e) => e.status === 'blocked').length;
  const avgLatency = Math.round(events.reduce((s, e) => s + e.latency, 0) / events.length);
  const cached = events.filter((e) => e.status === 'cached').length;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px]">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-cyan-400/15 flex items-center justify-center">
            <Radio className="w-4 h-4 text-cyan-400" />
          </div>
          <h1 className="text-xl font-display font-bold text-foreground tracking-tight">
            Signal Routing Console
          </h1>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 animate-pulse">
            live
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Real-time intelligence routing — which requests are flowing to which models, privacy
          boundaries enforced, and relay performance metrics.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Requests (live window)',
            value: totalRequests,
            color: 'text-foreground',
            bg: '',
          },
          { label: 'Avg Latency', value: `${avgLatency}ms`, color: 'text-cyan-400', bg: '' },
          { label: 'Cached (cost saved)', value: cached, color: 'text-emerald-400', bg: '' },
          {
            label: 'Blocked (policy)',
            value: blocked,
            color: blocked > 0 ? 'text-red-400' : 'text-emerald-400',
            bg: '',
          },
        ].map((s) => (
          <div key={s.label} className="bg-card/60 border border-border rounded-xl p-4">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
              {s.label}
            </p>
            <p className={cn('text-2xl font-display font-bold', s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Model routing map */}
      <div className="bg-card/60 border border-border rounded-xl p-5">
        <h3 className="text-sm font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          Oracle Fleet — Model Registry
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {MODELS.map((model) => (
            <div
              key={model.id}
              className={cn(
                'bg-muted/10 rounded-lg border p-4',
                model.status === 'optimal' ? 'border-border/50' : 'border-amber-400/20',
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-foreground">{model.name}</p>
                <span
                  className={cn(
                    'text-[10px] font-mono px-1.5 py-0.5 rounded',
                    model.status === 'optimal'
                      ? 'text-emerald-400 bg-emerald-400/10'
                      : 'text-amber-400 bg-amber-400/10',
                  )}
                >
                  {model.status}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground font-mono mb-3">{model.type}</p>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="text-muted-foreground">Latency: </span>
                  <span className="font-mono text-foreground">{model.latency}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Cost: </span>
                  <span className="font-mono text-foreground">{model.cost}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Requests: </span>
                  <span className="font-mono text-cyan-400">{model.requests.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Accuracy: </span>
                  <span className="font-mono text-emerald-400">{model.accuracy}%</span>
                </div>
              </div>
              <div className="mt-2">
                <div className="h-1 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400/60 rounded-full"
                    style={{ width: `${(model.requests / 5000) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Routing rules */}
      <div className="bg-card/60 border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            Privacy-Aware Routing Rules
          </h3>
          <p className="text-[10px] text-muted-foreground/70 mt-0.5">
            Routing logic — determining which model handles each request type with privacy
            boundaries enforced.
          </p>
        </div>
        <div className="divide-y divide-border/40">
          {ROUTING_RULES.map((rule, i) => {
            const privacy = PRIVACY_STYLES[rule.privacy as keyof typeof PRIVACY_STYLES];
            return (
              <div
                key={i}
                className="flex items-center gap-4 px-5 py-3 hover:bg-muted/10 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">{rule.condition}</p>
                  <p className="text-[10px] text-muted-foreground/60">{rule.reason}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
                <div className="text-xs font-mono text-cyan-400 min-w-[160px]">{rule.target}</div>
                <span
                  className={cn(
                    'text-[10px] font-mono px-2 py-0.5 rounded-full',
                    privacy.bg,
                    privacy.color,
                  )}
                >
                  {privacy.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live relay stream */}
      <div className="bg-card/60 border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            Live Relay Stream
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </h3>
          <button
            onClick={() => setPaused((p) => !p)}
            className={cn(
              'text-[10px] font-mono px-3 py-1 rounded border transition-colors',
              paused
                ? 'border-emerald-400/30 text-emerald-400 bg-emerald-400/10'
                : 'border-amber-400/30 text-amber-400 bg-amber-400/10',
            )}
          >
            {paused ? '▶ Resume' : '⏸ Pause'}
          </button>
        </div>
        <div className="overflow-auto max-h-72">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-card/90 backdrop-blur-sm border-b border-border">
              <tr>
                {[
                  'Time',
                  'Source Agent',
                  'Target Model',
                  'Type',
                  'Privacy',
                  'Latency',
                  'Tokens',
                  'Status',
                ].map((col) => (
                  <th
                    key={col}
                    className="text-left px-3 py-2 font-mono text-[10px] text-muted-foreground uppercase tracking-wider"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((event, i) => {
                const privacy = PRIVACY_STYLES[event.privacy];
                const status = STATUS_STYLES[event.status];
                return (
                  <tr
                    key={event.id}
                    className={cn(
                      'border-b border-border/30 hover:bg-muted/10 transition-colors',
                      i === 0 && !paused ? 'bg-muted/5' : '',
                    )}
                  >
                    <td className="px-3 py-1.5 font-mono text-muted-foreground text-[10px]">
                      {event.timestamp.toLocaleTimeString('en-US', { hour12: false })}
                    </td>
                    <td className="px-3 py-1.5 font-medium text-foreground">{event.source}</td>
                    <td className="px-3 py-1.5 text-cyan-400 font-mono text-[10px]">
                      {event.targetModel}
                    </td>
                    <td className="px-3 py-1.5 text-muted-foreground">{event.requestType}</td>
                    <td className="px-3 py-1.5">
                      <span
                        className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded font-mono',
                          privacy.bg,
                          privacy.color,
                        )}
                      >
                        {privacy.label}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 font-mono text-muted-foreground">
                      {event.latency}ms
                    </td>
                    <td className="px-3 py-1.5 font-mono text-muted-foreground">{event.tokens}</td>
                    <td className="px-3 py-1.5">
                      <span
                        className={cn(
                          'flex items-center gap-1 text-[10px] font-mono',
                          status.color,
                        )}
                      >
                        <span className={cn('w-1.5 h-1.5 rounded-full', status.dot)} />
                        {event.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
