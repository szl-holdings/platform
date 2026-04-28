import { AnimatePresence, m } from 'framer-motion';
import {
  AlertTriangle,
  Check,
  Eye,
  Shield,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { evaluateGovernance } from '@/lib/nuro-forge-service';

interface GovernanceEvent {
  id: string;
  model: string;
  domain: string;
  type: 'bias' | 'hallucination' | 'toxicity' | 'constitutional' | 'pii';
  severity: 'pass' | 'warning' | 'violation';
  score: number;
  detail: string;
  timestamp: number;
}

function generateEvent(): GovernanceEvent {
  const models = [
    'Claude 4 Sonnet',
    'GPT-5.2',
    'Gemini 2.5 Pro',
    'Qwen3-8B',
    'Llama 4 Scout',
    'Mistral Large',
  ];
  const domains = ['Legal', 'Maritime', 'Cyber', 'Financial', 'Real Estate', 'Advisory'];
  const types: GovernanceEvent['type'][] = [
    'bias',
    'hallucination',
    'toxicity',
    'constitutional',
    'pii',
  ];
  const type = types[Math.floor(Math.random() * types.length)];
  const score = Math.random();
  const details: Record<string, string[]> = {
    bias: [
      'Gender-neutral language verified',
      'Demographic parity check passed',
      'Minor sentiment bias detected — corrected',
    ],
    hallucination: [
      'Factual grounding confirmed via RAG',
      'Citation accuracy verified',
      'Uncertain claim flagged for review',
    ],
    toxicity: [
      'Content safety check passed',
      'Professional tone maintained',
      'Output filtered — rephrased',
    ],
    constitutional: [
      'Constitutional AI alignment verified',
      'Helpfulness-harmlessness balance OK',
      'Ethical boundary respected',
    ],
    pii: ['No PII detected in output', 'Email address redacted', 'Personal data sanitized'],
  };
  return {
    id: `gov-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    model: models[Math.floor(Math.random() * models.length)],
    domain: domains[Math.floor(Math.random() * domains.length)],
    type,
    severity: score > 0.92 ? 'pass' : score > 0.7 ? 'warning' : 'violation',
    score: Math.round(score * 100),
    detail: details[type][Math.floor(Math.random() * details[type].length)],
    timestamp: Date.now(),
  };
}

const POLICIES = [
  {
    domain: 'Legal',
    biasThreshold: 0.95,
    hallucinationThreshold: 0.98,
    toxicityThreshold: 0.99,
    piiPolicy: 'strict',
    color: '#8b5cf6',
  },
  {
    domain: 'Maritime',
    biasThreshold: 0.9,
    hallucinationThreshold: 0.95,
    toxicityThreshold: 0.97,
    piiPolicy: 'moderate',
    color: '#06b6d4',
  },
  {
    domain: 'Cyber',
    biasThreshold: 0.88,
    hallucinationThreshold: 0.92,
    toxicityThreshold: 0.95,
    piiPolicy: 'strict',
    color: '#3b82f6',
  },
  {
    domain: 'Financial',
    biasThreshold: 0.93,
    hallucinationThreshold: 0.96,
    toxicityThreshold: 0.98,
    piiPolicy: 'strict',
    color: '#10b981',
  },
  {
    domain: 'Real Estate',
    biasThreshold: 0.91,
    hallucinationThreshold: 0.94,
    toxicityThreshold: 0.97,
    piiPolicy: 'moderate',
    color: '#d4a054',
  },
  {
    domain: 'Advisory',
    biasThreshold: 0.9,
    hallucinationThreshold: 0.93,
    toxicityThreshold: 0.96,
    piiPolicy: 'moderate',
    color: '#c4a265',
  },
  {
    domain: 'Creative',
    biasThreshold: 0.85,
    hallucinationThreshold: 0.88,
    toxicityThreshold: 0.92,
    piiPolicy: 'relaxed',
    color: '#ec4899',
  },
  {
    domain: 'Research',
    biasThreshold: 0.87,
    hallucinationThreshold: 0.9,
    toxicityThreshold: 0.94,
    piiPolicy: 'moderate',
    color: '#f59e0b',
  },
  {
    domain: 'Operations',
    biasThreshold: 0.89,
    hallucinationThreshold: 0.91,
    toxicityThreshold: 0.95,
    piiPolicy: 'moderate',
    color: 'var(--gi-text-muted)',
  },
];

export default function GovernanceSafetyPage() {
  const [events, setEvents] = useState<GovernanceEvent[]>(() =>
    Array.from({ length: 12 }, generateEvent),
  );
  const [view, setView] = useState<'feed' | 'policies'>('feed');

  useEffect(() => {
    const models = [
      'Claude 4 Sonnet',
      'GPT-5.2',
      'Gemini 2.5 Pro',
      'Qwen3-8B',
      'Llama 4 Scout',
      'Mistral Large',
    ];
    const domains = ['Legal', 'Maritime', 'Cyber', 'Financial', 'Real Estate', 'Advisory'];
    const t = setInterval(() => {
      const model = models[Math.floor(Math.random() * models.length)];
      const domain = domains[Math.floor(Math.random() * domains.length)];
      const serviceResult = evaluateGovernance(model, domain, `Output for ${domain}`);
      const localEvent = generateEvent();
      localEvent.model = serviceResult.model;
      localEvent.domain = serviceResult.domain;
      localEvent.type = serviceResult.type;
      localEvent.severity = serviceResult.severity;
      localEvent.score = serviceResult.score;
      localEvent.detail = serviceResult.detail;
      setEvents((prev) => [localEvent, ...prev].slice(0, 50));
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const stats = useMemo(() => {
    const pass = events.filter((e) => e.severity === 'pass').length;
    const warn = events.filter((e) => e.severity === 'warning').length;
    const viol = events.filter((e) => e.severity === 'violation').length;
    return { pass, warn, viol, total: events.length };
  }, [events]);

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
              background: 'rgba(59,130,246,0.12)',
              border: '1px solid rgba(59,130,246,0.2)',
            }}
          >
            <Shield className="w-4 h-4" style={{ color: '#3b82f6' }} />
          </div>
          <div>
            <h1
              className="text-xl font-bold tracking-tight"
              style={{ color: 'rgba(255,255,255,0.9)' }}
            >
              Governance & Safety Layer
            </h1>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Bias detection · Hallucination scoring · Constitutional AI guardrails
            </p>
          </div>
        </m.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Checks', value: stats.total, color: '#d4a054', icon: Eye },
            { label: 'Passed', value: stats.pass, color: '#10b981', icon: Check },
            { label: 'Warnings', value: stats.warn, color: '#f59e0b', icon: AlertTriangle },
            { label: 'Violations', value: stats.viol, color: '#ef4444', icon: X },
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
          {(['feed', 'policies'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-medium capitalize"
              style={{
                background: view === v ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.02)',
                color: view === v ? '#3b82f6' : 'rgba(255,255,255,0.4)',
                border: `1px solid ${view === v ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)'}`,
              }}
            >
              {v === 'feed' ? 'Audit Feed' : 'Domain Policies'}
            </button>
          ))}
        </div>

        {view === 'feed' ? (
          <div className="space-y-1.5">
            <AnimatePresence mode="popLayout">
              {events.slice(0, 15).map((event) => (
                <m.div
                  key={event.id}
                  layout
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg"
                  style={{
                    background: 'rgba(255,255,255,0.015)',
                    border: `1px solid ${event.severity === 'violation' ? 'rgba(239,68,68,0.1)' : event.severity === 'warning' ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)'}`,
                  }}
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background:
                        event.severity === 'pass'
                          ? 'rgba(16,185,129,0.12)'
                          : event.severity === 'warning'
                            ? 'rgba(245,158,11,0.12)'
                            : 'rgba(239,68,68,0.12)',
                    }}
                  >
                    {event.severity === 'pass' ? (
                      <Check className="w-3 h-3" style={{ color: '#10b981' }} />
                    ) : event.severity === 'warning' ? (
                      <AlertTriangle className="w-3 h-3" style={{ color: '#f59e0b' }} />
                    ) : (
                      <X className="w-3 h-3" style={{ color: '#ef4444' }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[11px] font-semibold"
                        style={{ color: 'rgba(255,255,255,0.7)' }}
                      >
                        {event.model}
                      </span>
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded-full capitalize"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          color: 'rgba(255,255,255,0.3)',
                        }}
                      >
                        {event.type}
                      </span>
                      <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                        {event.domain}
                      </span>
                    </div>
                    <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {event.detail}
                    </p>
                  </div>
                  <span
                    className="text-[10px] font-bold tabular-nums flex-shrink-0"
                    style={{
                      color:
                        event.severity === 'pass'
                          ? '#10b981'
                          : event.severity === 'warning'
                            ? '#f59e0b'
                            : '#ef4444',
                    }}
                  >
                    {event.score}%
                  </span>
                </m.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {POLICIES.map((p) => (
              <m.div
                key={p.domain}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg p-4"
                style={{ background: 'rgba(255,255,255,0.015)', border: `1px solid ${p.color}15` }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                  <span
                    className="text-[12px] font-semibold"
                    style={{ color: 'rgba(255,255,255,0.75)' }}
                  >
                    {p.domain}
                  </span>
                  <span
                    className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full capitalize"
                    style={{ background: `${p.color}12`, color: p.color }}
                  >
                    {p.piiPolicy}
                  </span>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Bias threshold', value: `${(p.biasThreshold * 100).toFixed(0)}%` },
                    {
                      label: 'Hallucination threshold',
                      value: `${(p.hallucinationThreshold * 100).toFixed(0)}%`,
                    },
                    {
                      label: 'Toxicity threshold',
                      value: `${(p.toxicityThreshold * 100).toFixed(0)}%`,
                    },
                    { label: 'PII policy', value: p.piiPolicy },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {row.label}
                      </span>
                      <span
                        className="text-[10px] font-medium tabular-nums"
                        style={{ color: p.color }}
                      >
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </m.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
